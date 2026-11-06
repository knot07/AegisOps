from __future__ import annotations

import asyncio
import ipaddress
import math
import os
import re
import sys
import time
from pathlib import Path


API_ROOT = Path(__file__).resolve().parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from demo_v2core.judgement import alert_fingerprint, task_key, validate_result
from demo_v2core.storage import NativeStore


ALLOWED_MINUTES = {5, 15, 30, 60, 120, 360, 720, 1440}
WORKFLOW_ID = "datang-tdp-fixed-review"
DEMO_PAGE_ID = "ai-demo"
DEMO_DB_PATH = Path.home() / ".aegisops" / "data" / "datang_tdp_ai_demo.db"
WORKFLOW_RESULT_VERSION = "1.17.0"
SCAN_ALERT_PATTERN = re.compile(r"扫描|scan|zgrab|nmap|masscan|探测|侦查", re.I)
INTEL_UNAVAILABLE_PATTERN = re.compile(r"(?:外部\s*IP\s*情报|ThreatBook|微步).*(?:暂不可用|不可用|失败|额度|参数)", re.I)
LIST_RESULT_FIELDS = {
    "workflow_version", "verdict", "ban_decision", "confidence", "severity",
    "attack_outcome", "compromise_status", "action_scope", "recommended_action",
    "summary", "source_location", "model_used",
}
KNOWN_PUBLIC_DNS_RESOLVERS = {
    "1.0.0.1", "1.1.1.1", "8.8.4.4", "8.8.8.8", "9.9.9.9",
    "101.226.4.6", "114.114.114.114", "114.114.115.115",
    "119.29.29.29", "149.112.112.112", "180.76.76.76",
    "182.254.116.116", "218.30.118.6", "223.5.5.5", "223.6.6.6",
}


def _version_tuple(value):
    parts = re.findall(r"\d+", str(value or ""))[:3]
    numbers = tuple(int(item) for item in parts)
    return numbers + (0,) * (3 - len(numbers)) if numbers else (0, 0, 0)


def _is_domain(value):
    return bool(re.fullmatch(r"(?=.{4,253}$)(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}", str(value or "").strip()))


def _is_scan_alert(row):
    return bool(SCAN_ALERT_PATTERN.search(str(row.get("threat_name") or "")))


def _result_needs_refresh(row, saved_result):
    version = str(saved_result.get("workflow_version") or "")
    if version.startswith("demo-"):
        return False
    if _version_tuple(version) < (1, 8, 0):
        return True
    if version == WORKFLOW_RESULT_VERSION:
        return False
    source_location = saved_result.get("source_location") or {}
    domestic_review_policy_stale = bool(
        _version_tuple(version) < (1, 15, 0)
        and saved_result.get("verdict") == "疑似扫描"
        and saved_result.get("ban_decision") == "不建议封禁"
        and isinstance(source_location, dict)
        and source_location.get("known")
        and not source_location.get("is_foreign")
    )
    geo_policy_stale = bool(
        _version_tuple(version) < (1, 14, 0)
        and (
            (
                _version_tuple(version) < (1, 13, 0)
                and saved_result.get("ban_decision") in {"不建议封禁", "人工复核"}
            )
            or (
                _version_tuple(version) >= (1, 12, 0)
                and not (isinstance(source_location, dict) and source_location.get("known"))
            )
        )
        and not row.get("is_cdn")
        and _valid_ip(row.get("ip"))
        and not ipaddress.ip_address(str(row.get("ip"))).is_private
    )
    quality_cleanup_stale = bool(
        _version_tuple(version) == (1, 9, 0)
        and (
            saved_result.get("model_used") is False
            or any(
                "Beyond Daily Limitation" in str(item) or "threat_intel:" in str(item)
                for item in (saved_result.get("missing_information") or [])
            )
        )
    )
    direct_intel_refresh_stale = bool(
        _version_tuple(version) == (1, 10, 0)
        and any(
            "外部 IP 情报查询已达到当日额度" in str(item)
            or "Beyond Daily Limitation" in str(item)
            for item in (saved_result.get("missing_information") or [])
        )
    )
    intel_consistency_stale = bool(
        _version_tuple(version) == (1, 11, 0)
        and any(
            "信誉" in str(item)
            and any(marker in str(item) for marker in ("明确恶意", "黑名单", "僵尸网络"))
            for item in (saved_result.get("supporting_evidence") or [])
        )
        and any(
            INTEL_UNAVAILABLE_PATTERN.search(str(item))
            for item in (saved_result.get("missing_information") or [])
        )
    )
    resolver_scope_stale = bool(
        str(row.get("ip") or "") in KNOWN_PUBLIC_DNS_RESOLVERS
        and _is_domain(row.get("ioc"))
        and saved_result.get("action_scope") != "出站域名IOC"
    )
    if saved_result.get("verdict") == "疑似扫描":
        return resolver_scope_stale or geo_policy_stale or domestic_review_policy_stale
    evidence = saved_result.get("http_evidence") or []
    statuses = []
    response_text = []
    for item in evidence if isinstance(evidence, list) else []:
        if not isinstance(item, dict):
            continue
        line = str(item.get("response_line") or "")
        match = re.search(r"HTTP/\d(?:\.\d)?\s+(\d{3})\b", line, re.I)
        if match:
            statuses.append(int(match.group(1)))
        response_text.append(str(item.get("response_body") or ""))
    all_rejected = bool(statuses) and all(400 <= code < 500 for code in statuses)
    auth_redirect = bool(
        statuses
        and all(300 <= code < 400 for code in statuses)
        and re.search(r"atrust|sso|single[ -]?sign[ -]?on|check token fail|登录|login", " ".join(response_text), re.I)
    )
    rejection_outcome_stale = bool(
        saved_result.get("attack_outcome") == "尝试/未知"
        and (all_rejected or auth_redirect)
    )
    return (
        resolver_scope_stale
        or geo_policy_stale
        or rejection_outcome_stale
        or quality_cleanup_stale
        or direct_intel_refresh_stale
        or intel_consistency_stale
    )


def _database_path():
    # This page is intentionally namespaced. It never falls back to the
    # production TDP judgement database, even when an old global override is set.
    override = os.getenv("DATANG_TDP_AI_DEMO_DB")
    return Path(override).expanduser() if override else DEMO_DB_PATH


def _demo_rows(end_time: int) -> list[dict]:
    """Deterministic, sanitized fixtures used by the isolated demo page."""
    rows = [
        {
            "id": "demo:203.0.113.10", "row_key": "203.0.113.10", "ip": "203.0.113.10",
            "ioc": "login.example.test", "threat_name": "示例 Web 探测", "threat_type": "扫描",
            "severity": "中", "count": 6, "first_time": end_time - 900, "last_time": end_time - 120,
            "is_cdn": False, "is_exit": False, "geo_data": {"Country": "美国"},
            "src_ip_geo_data": {"Country": "美国"}, "aggregation_type": "domain_threat_direction",
            "aggregation_key": "login.example.test|示例 Web 探测|扫描|外到内", "grouped_row_count": 1,
            "grouped_ips": ["203.0.113.10"], "grouped_targets": ["10.10.20.15"],
            "grouped_ports": ["443"], "ai_status": "none",
        },
        {
            "id": "demo:198.51.100.23", "row_key": "198.51.100.23", "ip": "198.51.100.23",
            "ioc": "admin.example.test", "threat_name": "示例命令注入尝试", "threat_type": "攻击",
            "severity": "高", "count": 2, "first_time": end_time - 720, "last_time": end_time - 90,
            "is_cdn": False, "is_exit": False, "geo_data": {"Country": "德国"},
            "src_ip_geo_data": {"Country": "德国"}, "aggregation_type": "domain_threat_direction",
            "aggregation_key": "admin.example.test|示例命令注入尝试|攻击|外到内", "grouped_row_count": 1,
            "grouped_ips": ["198.51.100.23"], "grouped_targets": ["10.10.20.16"],
            "grouped_ports": ["8080"], "ai_status": "none",
        },
        {
            "id": "demo:192.0.2.44", "row_key": "192.0.2.44", "ip": "192.0.2.44",
            "ioc": "updates.example.test", "threat_name": "示例恶意外联", "threat_type": "外联",
            "severity": "高", "count": 1, "first_time": end_time - 540, "last_time": end_time - 60,
            "is_cdn": False, "is_exit": False, "geo_data": {"Country": "日本"},
            "src_ip_geo_data": {"Country": "日本"}, "aggregation_type": "domain_threat_direction",
            "aggregation_key": "updates.example.test|示例恶意外联|外联|内到外", "grouped_row_count": 1,
            "grouped_ips": ["192.0.2.44"], "grouped_targets": ["10.10.30.8"],
            "grouped_ports": ["443"], "ai_status": "none",
        },
    ]
    # Keep enough varied records to demonstrate paging and the same fields as
    # production, while using documentation-only TEST-NET addresses/domains.
    extra = [
        ("203.0.113.31", "portal.example.test", "目录遍历探测", "扫描", "中", 4, "法国", "10.10.20.15", "443", "外到内"),
        ("198.51.100.41", "api.example.test", "示例 SQL 注入尝试", "攻击", "高", 3, "加拿大", "10.10.20.16", "8443", "外到内"),
        ("192.0.2.55", "cdn-update.example.test", "可疑更新外联", "外联", "高", 8, "韩国", "10.10.30.8", "443", "内到外"),
        ("203.0.113.62", "vpn.example.test", "弱口令登录探测", "扫描", "低", 2, "英国", "10.10.20.18", "443", "外到内"),
        ("198.51.100.73", "mail.example.test", "示例 SSRF 请求", "攻击", "高", 5, "荷兰", "10.10.20.19", "8080", "外到内"),
        ("192.0.2.86", "telemetry.example.test", "异常 DNS 外联", "外联", "中", 6, "澳大利亚", "10.10.30.12", "53", "内到外"),
        ("203.0.113.97", "search.example.test", "Web 端口扫描", "扫描", "低", 3, "新加坡", "10.10.20.21", "80", "外到内"),
        ("198.51.100.108", "files.example.test", "示例文件上传攻击", "攻击", "严重", 7, "美国", "10.10.20.22", "443", "外到内"),
        ("192.0.2.119", "sync.example.test", "异常同步外联", "外联", "中", 2, "瑞典", "10.10.30.18", "443", "内到外"),
        ("203.0.113.128", "admin.example.test", "后台路径扫描", "扫描", "中", 9, "西班牙", "10.10.20.25", "8080", "外到内"),
        ("198.51.100.147", "upload.example.test", "示例命令执行尝试", "攻击", "严重", 4, "意大利", "10.10.20.26", "8443", "外到内"),
        ("192.0.2.167", "metrics.example.test", "异常指标外联", "外联", "低", 1, "日本", "10.10.30.20", "443", "内到外"),
        ("203.0.113.181", "auth.example.test", "认证接口探测", "扫描", "中", 5, "巴西", "10.10.20.28", "443", "外到内"),
        ("198.51.100.196", "gateway.example.test", "示例反序列化攻击", "攻击", "高", 3, "波兰", "10.10.20.29", "8080", "外到内"),
        ("192.0.2.209", "report.example.test", "异常报表外联", "外联", "中", 2, "挪威", "10.10.30.25", "443", "内到外"),
    ]
    for index, (ip, ioc, name, kind, severity, count, country, target, port, direction) in enumerate(extra, start=1):
        rows.append({
            "id": f"demo:{ip}", "row_key": ip, "ip": ip, "ioc": ioc,
            "threat_name": name, "threat_type": kind, "severity": severity,
            "count": count, "first_time": end_time - 3600 + index * 97,
            "last_time": end_time - index * 53, "is_cdn": False, "is_exit": False,
            "geo_data": {"Country": country}, "src_ip_geo_data": {"Country": country},
            "aggregation_type": "domain_threat_direction",
            "aggregation_key": f"{ioc}|{name}|{kind}|{direction}", "grouped_row_count": 1,
            "grouped_ips": [ip], "grouped_targets": [target], "grouped_ports": [port],
            "ai_status": "none",
        })
    scenarios = [
        ("目录枚举扫描", "扫描", "中", 18, "中国"),
        ("SQL 注入拦截", "攻击", "高", 12, "美国"),
        ("恶意域名外联", "外联", "高", 9, "德国"),
        ("授权扫描待核验", "扫描", "低", 1, "中国"),
        ("文件读取攻击拦截", "攻击", "严重", 6, "法国"),
        ("可疑 DNS 查询", "外联", "中", 4, "日本"),
    ]
    for index in range(24):
        name, kind, severity, count, country = scenarios[index % len(scenarios)]
        ip = f"203.0.113.{210 + index}"
        target = f"10.20.{10 + index % 3}.{20 + index}"
        domain = f"demo-{index + 1:02d}.example.test"
        rows.append({
            "id": f"demo:{ip}", "row_key": ip, "ip": ip, "ioc": domain,
            "threat_name": name, "threat_type": kind, "severity": severity,
            "count": count + (index // 6 if count > 1 else 0),
            "first_time": end_time - 3000 + index * 67, "last_time": end_time - 90 - index * 37,
            "is_cdn": False, "is_exit": False,
            "geo_data": {"Country": country}, "src_ip_geo_data": {"Country": country},
            "aggregation_type": "domain_threat_direction",
            "aggregation_key": f"{domain}|{name}|{kind}", "grouped_row_count": 1,
            "grouped_ips": [ip], "grouped_targets": [target], "grouped_ports": ["443"],
            "ai_status": "none",
        })
    return rows


def _demo_result(ip: str, context: dict) -> dict:
    fixture = next((row for row in _demo_rows(int(time.time())) if row["ip"] == ip), {})
    context = {**fixture, **{key: value for key, value in context.items() if value not in (None, [], {})}}
    is_outbound = str(context.get("threat_type") or "") == "外联"
    verdict = "恶意外联" if is_outbound else ("外网攻击" if str(context.get("threat_type") or "") == "攻击" else "疑似扫描")
    decision = "建议封禁" if verdict != "疑似扫描" else "人工复核"
    action_scope = "出站域名IOC" if is_outbound else ("源IP" if verdict == "外网攻击" else "人工复核")
    result = {
        "workflow_version": "demo-2.0.0", "verdict": verdict, "ban_decision": decision,
        "confidence": 82 if verdict != "疑似扫描" else 74, "severity": str(context.get("severity") or "中"),
        "attack_outcome": "尝试/未知" if verdict == "疑似扫描" else "失败",
        "compromise_status": "未发现失陷", "action_scope": action_scope,
        "recommended_action": "演示环境仅展示建议，不执行任何封禁或设备状态修改。",
        "source_location": {"country": "演示样例", "display": "演示样例数据", "known": True, "is_foreign": True, "source": "fixture"},
        "traffic_paths": [{"source_ip": ip, "destination_ip": "10.10.20.15", "direction": "内到外" if is_outbound else "外到内", "destination_port": "443", "protocol": "TCP", "sensor_direction": "fixture"}],
        "http_evidence": [{"alert_ids": ["demo-alert-001"], "time": int(time.time()), "flow_id": "demo-flow-001", "source_ip": ip, "destination_ip": "10.10.20.15", "destination_port": "443", "request_line": "GET /demo HTTP/1.1", "response_line": "HTTP/1.1 403 Forbidden", "response_body": "演示响应：未发现成功利用", "request_status": "fixture", "response_status": "403", "occurrences": 1}],
        "summary": "这是独立演示环境中的固定证据研判结果。结果可用于演示流程与界面，不代表真实生产告警。",
        "evidence": ["fixture: 包内固定样例告警", "fixture: 不调用生产 TDP、ThreatBook 或模型"],
        "supporting_evidence": ["演示样例包含攻击方向、IOC、目标和端口字段"],
        "contradicting_evidence": ["无生产侧原始报文，不能据此确认真实攻击成功"],
        "missing_information": ["生产 TDP 原始日志未接入演示模式"],
        "affected_targets": ["10.10.20.15"], "key_iocs": [str(context.get("ioc") or ip)],
        "human_checkpoints": ["切换生产页面后再进行真实证据核验"],
    }
    target = (context.get("grouped_targets") or ["10.10.20.15"])[0]
    port = str((context.get("grouped_ports") or ["443"])[0])
    country = (context.get("geo_data") or {}).get("Country", "演示样例")
    count = int(context.get("count") or 1)
    review = verdict == "疑似扫描" and count < 3 and country == "中国"
    result.update({
        "model_used": False,
        "ban_decision": "人工复核" if review else "建议封禁",
        "action_scope": "出站域名IOC" if is_outbound else "人工复核" if review else "源IP",
        "attack_outcome": "尝试/未知" if is_outbound or verdict == "疑似扫描" else "失败",
        "confidence": 72 if review else 88,
        "source_location": {"country": country, "display": f"{country} · 演示", "known": True, "is_foreign": country != "中国", "source": "脱敏固定样例"},
        "traffic_paths": [{"source_ip": target if is_outbound else ip, "destination_ip": ip if is_outbound else target,
                           "direction": "内到外" if is_outbound else "外到内", "destination_port": port,
                           "protocol": "UDP" if port == "53" else "TCP", "sensor_direction": "fixture"}],
        "affected_targets": [target],
        "summary": f"【演示样例】{context.get('threat_name') or '安全告警'}，共 {count} 次。"
                   + (f"内网主机 {target} 发起可疑域名外联，尚不足以确认主机失陷。" if is_outbound else
                      "记录低于扫描封禁阈值，应先核验授权范围。" if review else
                      "可见响应为 403，未发现利用成功回显。" if verdict == "外网攻击" else
                      "依据扫描强度与来源信息建议临时阻断并观察复发。"),
        "recommended_action": (
            f"在 DNS 安全策略或出口防火墙出站规则阻断域名 {context.get('ioc')}，核查发起主机 {target}。"
            if is_outbound else "人工核查来源是否属于授权巡检，保留观察记录。" if review else
            f"在边界防火墙或 WAF 对 {ip} 临时封禁或限速 24-72 小时，结合目标 {target} 日志复核并设置解除条件。"
        ) + " 本演示未执行任何封禁或设备状态修改。",
        "human_checkpoints": [f"核查目标 {target} 的相关日志", "确认处置对象与流量方向", "复核是否复发及解除条件"],
        "raw_output": "演示环境展示预置研判样例，未调用真实模型或生产数据源。",
    })
    result["http_evidence"] = [] if is_outbound else [{
        "alert_ids": [f"demo-alert-{ip}"], "time": int(context.get("last_time") or time.time()),
        "flow_id": f"demo-flow-{ip}", "source_ip": ip, "destination_ip": target, "destination_port": port,
        "request_line": "GET /admin/login HTTP/1.1" if verdict == "疑似扫描" else "POST /api/demo-check HTTP/1.1",
        "request_body": "demo=inspection", "response_line": "HTTP/1.1 403 Forbidden",
        "response_body": "演示样例：请求已被访问控制策略拒绝。",
        "request_status": "已获取", "response_status": "已获取", "occurrences": count,
    }]
    result["missing_information"] = ["此为脱敏固定样例，未连接生产日志与情报服务。"]
    return result


def _seed_demo_results(store, rows, start_time, end_time):
    for index, row in enumerate(rows):
        if index % 5 == 4:
            continue
        identity = alert_fingerprint(row["ip"], row)
        saved = store.get_latest_judgement_by_fingerprint(identity)
        version = str((saved or {}).get("result", {}).get("workflow_version") or "")
        if saved and (version == "demo-2.0.0" or not version.startswith("demo-")):
            continue
        store.save_judgement_state(
            task_key=f"demo-preview-v2:{row['row_key']}", ip=row["ip"],
            start_time=start_time, end_time=end_time, round_number=1,
            status="done", phase="done", alert_fingerprint=identity,
            alert_time=row["last_time"], result=_demo_result(row["ip"], row),
        )


def _demo_trend(rows, start_time, end_time):
    bins = [0] * 13
    span = max(1, end_time - start_time)
    for row in rows:
        index = min(12, max(0, int((row["last_time"] - start_time) * 12 / span)))
        bins[index] += row["count"]
    return {
        "labels": [time.strftime("%H:%M", time.localtime(start_time + span * index / 12)) for index in range(13)],
        "tdp": bins, "total": list(bins), "step_seconds": max(1, span // 12),
    }


def _int_param(request, name, default):
    try:
        return int(request.query_params.get(name, default))
    except (TypeError, ValueError):
        return int(default)


def _range(request):
    start_time = _int_param(request, "start_time", 0)
    end_time = _int_param(request, "end_time", 0)
    if start_time > 0 and end_time > start_time:
        return start_time, end_time
    minutes = _int_param(request, "minutes", 30)
    minutes = minutes if minutes in ALLOWED_MINUTES else 30
    end_time = int(time.time())
    return end_time - minutes * 60, end_time


def _attach_judgements(store, result):
    start_time = result["range"]["start_time"]
    end_time = result["range"]["end_time"]
    done = pending = 0
    for row in result["rows"]:
        identity_context = {
            "ioc": row.get("ioc") or row["ip"],
            "threat_type": row.get("threat_type"),
            "threat_name": row.get("threat_name"),
            "aggregation_type": row.get("aggregation_type"),
            "aggregation_key": row.get("aggregation_key"),
        }
        identity = alert_fingerprint(
            row["ip"],
            identity_context,
        )
        state = (
            store.get_latest_judgement_by_fingerprint(identity)
            if hasattr(store, "get_latest_judgement_by_fingerprint")
            else store.get_latest_judgement(row["ip"], identity)
        )
        if not state:
            state = store.get_judgement(task_key(row["ip"], start_time, end_time, 1, identity))
        if not state and not row.get("aggregation_key"):
            state = store.get_judgement(task_key(row["ip"], start_time, end_time, 1))
        if not state and not row.get("aggregation_key"):
            state = store.get_latest_judgement(row["ip"], "")
            row_time = int(row.get("last_time") or row.get("first_time") or 0)
            if state and not (int(state["start_time"]) <= row_time <= int(state["end_time"])):
                state = None
            elif state:
                store.set_judgement_identity(
                    state["task_key"],
                    alert_fingerprint=identity,
                    alert_time=row_time,
                )
                state["alert_fingerprint"] = identity
                state["alert_time"] = row_time
        if not state:
            row["ai_status"] = "none"
            continue
        if (
            state.get("status") == "pending"
            and state.get("phase") == "queued"
            and not state.get("execution_id")
            and int(time.time()) - int(state.get("updated_at") or 0) > 30
        ):
            row["ai_status"] = "none"
            continue
        saved_result = state.get("result") or {}
        is_demo_result = str(saved_result.get("workflow_version") or "").startswith("demo-")
        campaign_result_stale = bool(
            state.get("status") == "done"
            and not is_demo_result
            and row.get("distributed_scan_campaign")
            and (
                saved_result.get("ban_decision") != "建议封禁"
                or not any(
                    "分布式扫描活动" in str(item)
                    for item in (saved_result.get("supporting_evidence") or [])
                )
            )
        )
        volume_result_stale = bool(
            state.get("status") == "done"
            and not is_demo_result
            and _is_scan_alert(row)
            and int(row.get("count") or 0) >= 3
            and not row.get("is_cdn")
            and str(row.get("ip") or "") not in KNOWN_PUBLIC_DNS_RESOLVERS
            and saved_result.get("action_scope") not in {"IOC域名", "出站域名IOC"}
            and saved_result.get("ban_decision") != "建议封禁"
        )
        # Pre-1.8 results lacked reliable packet preservation. Later migrations
        # are selective so policy fixes do not needlessly rerun every alert.
        if (
            state.get("status") == "done"
            and (campaign_result_stale or volume_result_stale or _result_needs_refresh(row, saved_result))
        ):
            row["ai_status"] = "none"
            continue
        row["ai_status"] = state["status"]
        row["ai_phase"] = state["phase"]
        row["ai_label"] = _ai_label(state)
        row["ai_session_id"] = state["session_id"]
        row["ai_workflow_id"] = state.get("workflow_id", "")
        row["ai_execution_id"] = state.get("execution_id", "")
        row["ai_task_key"] = state["task_key"]
        row["ai_error"] = state["error"]
        # The table only needs a compact summary. Full evidence and raw model
        # output are loaded from /judgement/status when the detail modal opens.
        row.update({
            f"ai_{key}": value
            for key, value in state["result"].items()
            if key in LIST_RESULT_FIELDS
        })
        if state["status"] == "done":
            done += 1
        elif state["status"] == "pending":
            pending += 1
    total = result["summary"]["ip_total"]
    result["summary"]["ai_done"] = done
    result["summary"]["ai_pending"] = pending
    result["summary"]["ai_rate"] = round(done / total * 100, 1) if total else 0.0


def _ai_label(state):
    if state["status"] == "done":
        return "已完成"
    if state["status"] == "failed":
        return "研判异常"
    if state["phase"] == "queued":
        return "队列中"
    if state["phase"] == "parsing":
        return "解析中"
    if state["phase"] == "collecting":
        return "固定取证中"
    if state["phase"] == "rule_engine":
        return "规则分析中"
    if state["phase"] == "model_analysis":
        return "模型分析中"
    if state["phase"] == "finalizing":
        return "结果校验中"
    return "研判中"


def _normalized_ai(state):
    if not state:
        return {
            "status": "none", "phase": "none", "label": "AI研判",
            "verdict": "", "ban_decision": "", "confidence": 0,
            "severity": "未知", "attack_outcome": "尝试/未知",
            "compromise_status": "无法确认", "summary": "", "evidence": [],
            "action_scope": "人工复核", "recommended_action": "",
            "source_location": {},
            "traffic_paths": [], "http_evidence": [],
            "supporting_evidence": [], "contradicting_evidence": [],
            "missing_information": [], "affected_targets": [], "key_iocs": [],
            "human_checkpoints": [], "progress": "", "raw_output": "", "error": "",
            "session_id": "", "task_key": "",
            "workflow_id": "", "execution_id": "",
        }
    result = state.get("result") or {}
    return {
        "status": state["status"], "phase": state["phase"], "label": _ai_label(state),
        "verdict": result.get("verdict", ""), "ban_decision": result.get("ban_decision", ""),
        "confidence": result.get("confidence", 0), "severity": result.get("severity", "未知"),
        "attack_outcome": result.get("attack_outcome", "尝试/未知"),
        "compromise_status": result.get("compromise_status", "无法确认"),
        "action_scope": result.get("action_scope", "人工复核"),
        "recommended_action": result.get("recommended_action", ""),
        "source_location": result.get("source_location", {}),
        "traffic_paths": result.get("traffic_paths", []),
        "http_evidence": result.get("http_evidence", []),
        "summary": result.get("summary", ""), "evidence": result.get("evidence", []),
        "supporting_evidence": result.get("supporting_evidence", []),
        "contradicting_evidence": result.get("contradicting_evidence", []),
        "missing_information": result.get("missing_information", []),
        "affected_targets": result.get("affected_targets", []),
        "key_iocs": result.get("key_iocs", []),
        "human_checkpoints": result.get("human_checkpoints", []),
        "progress": result.get("progress", ""),
        "raw_output": result.get("raw_output", ""), "error": state.get("error", ""),
        "session_id": state.get("session_id", ""), "task_key": state.get("task_key", ""),
        "workflow_id": state.get("workflow_id", ""),
        "execution_id": state.get("execution_id", ""),
    }


async def health(ctx, request):
    del ctx, request
    return {
        "ok": True, "backend": "demo-fixture", "database": str(_database_path()),
        "read_only": True, "blocking_enabled": False, "environment": "demo",
        "real_data_access": False,
    }


async def dashboard(ctx, request):
    del ctx
    start_time, end_time = _range(request)
    page = max(1, _int_param(request, "page", 1))
    page_size = max(1, min(1000, _int_param(request, "page_size", 1000)))

    def query():
        store = NativeStore(_database_path())
        all_rows = _demo_rows(end_time)
        span = max(1, end_time - start_time)
        for index, row in enumerate(all_rows):
            row["last_time"] = end_time - max(1, int(span * (((index * 7) % 41) + 1) / 43))
            row["first_time"] = max(start_time, row["last_time"] - max(1, span // 60))
        _seed_demo_results(store, all_rows, start_time, end_time)
        total = len(all_rows)
        start = (page - 1) * page_size
        rows = all_rows[start:start + page_size]
        result = {
            "range": {"start_time": start_time, "end_time": end_time},
            "rows": rows,
            "summary": {"event_total": sum(int(row["count"]) for row in all_rows), "ip_total": total, "incident_total": total, "ai_done": 0, "ai_pending": 0, "ai_rate": 0.0},
            "pagination": {"page": page, "page_size": page_size, "total": total, "pages": max(1, math.ceil(total / page_size))},
            "trend": _demo_trend(all_rows, start_time, end_time),
            "duration_ms": 1,
        }
        _attach_judgements(store, result)
        return {
            "ok": True,
            "backend": "demo-fixture",
            "data": {
                "ok": True,
                "tdp": {
                    "rows": result["rows"],
                    "start_time": result["range"]["start_time"],
                    "end_time": result["range"]["end_time"],
                    "event_total": result["summary"]["event_total"],
                    "source": "package-fixture",
                    "environment": "demo",
                },
                "errors": {},
            },
            "trend": result["trend"],
            "summary": result["summary"],
            "pagination": result["pagination"],
            "fetched_at": int(time.time()),
            "duration_ms": result["duration_ms"],
        }

    return await asyncio.to_thread(query)


async def _json_body(request):
    try:
        value = await request.json()
    except Exception:
        return None
    return value if isinstance(value, dict) else None


def _valid_ip(value):
    try:
        ipaddress.ip_address(str(value))
        return True
    except ValueError:
        return False


async def judgement_prepare(ctx, request):
    body = await _json_body(request)
    if not body:
        return {"ok": False, "error": "invalid body"}
    ip = str(body.get("ip") or "").strip()
    if not _valid_ip(ip):
        return {"ok": False, "error": "invalid ip"}
    try:
        start_time = int(body.get("start_time"))
        end_time = int(body.get("end_time"))
        round_number = 2 if body.get("second_round") else 1
    except (TypeError, ValueError):
        return {"ok": False, "error": "invalid time range"}
    store = NativeStore(_database_path())
    alert_context = body.get("alert_context") if isinstance(body.get("alert_context"), dict) else {}
    alert_time = int(body.get("alert_time") or end_time)
    identity = alert_fingerprint(ip, alert_context)
    key = task_key(ip, start_time, end_time, round_number, identity)
    store.save_judgement_state(
        task_key=key,
        ip=ip,
        start_time=start_time,
        end_time=end_time,
        round_number=round_number,
        status="pending",
        phase="queued",
        workflow_id=WORKFLOW_ID,
        alert_fingerprint=identity,
        alert_time=alert_time,
    )
    demo_result = _demo_result(ip, alert_context)
    workflow_inputs = {
        "task_key": key,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time,
        "alert_time": alert_time,
        "round_number": round_number,
        "alert_context": alert_context,
        "first_judgement": body.get("first_judgement") if round_number == 2 and isinstance(body.get("first_judgement"), dict) else {},
        "model_enabled": False,
    }
    return {
        "ok": True,
        "task_key": key,
        "title": f"TDP-judgement-{ip}-{time.strftime('%Y%m%d-%H%M%S')}",
        "workflow_id": WORKFLOW_ID,
        "inputs": workflow_inputs,
        "agent": "tdp-monitor-reviewer",
        "demo_result": demo_result,
    }


async def judgement_register(ctx, request):
    del ctx
    body = await _json_body(request)
    if not body:
        return {"ok": False, "error": "invalid body"}
    key = str(body.get("task_key") or "")
    workflow_id = str(body.get("workflow_id") or "")
    execution_id = str(body.get("execution_id") or "")
    if not key or workflow_id != WORKFLOW_ID or not execution_id or len(execution_id) > 200:
        return {"ok": False, "error": "invalid task/workflow execution"}
    store = NativeStore(_database_path())
    state = store.get_judgement(key)
    if not state:
        return {"ok": False, "error": "task not found"}
    store.attach_workflow_execution(
        key,
        workflow_id=workflow_id,
        execution_id=execution_id,
    )
    return {
        "ok": True,
        "task_key": key,
        "workflow_id": workflow_id,
        "execution_id": execution_id,
    }


async def judgement_status(ctx, request):
    del ctx
    key = str(request.query_params.get("task_key") or "")
    ip = str(request.query_params.get("ip") or "")
    store = NativeStore(_database_path())
    state = store.get_judgement(key) if key else store.get_latest_judgement(ip)
    timeout_seconds = max(60, int(os.getenv("DATANG_TDP_V2_AI_TIMEOUT", "600")))
    if state and state["status"] == "pending" and int(time.time()) - int(state["updated_at"]) > timeout_seconds:
        store.save_judgement_state(
            task_key=state["task_key"], ip=state["ip"], start_time=state["start_time"],
            end_time=state["end_time"], round_number=state["round"], status="failed",
            phase="failed", session_id=state["session_id"],
            workflow_id=state.get("workflow_id", ""),
            execution_id=state.get("execution_id", ""),
            error="TDP fixed workflow timeout",
        )
        state = store.get_judgement(state["task_key"])
    return {"ok": bool(state), "task": state, "ai": _normalized_ai(state)}


async def judgement_complete(ctx, request):
    del ctx
    body = await _json_body(request)
    if not body:
        return {"ok": False, "error": "invalid body"}
    key = str(body.get("task_key") or "")
    store = NativeStore(_database_path())
    state = store.get_judgement(key)
    if not state:
        return {"ok": False, "error": "task not found"}
    try:
        result = validate_result(body.get("result"))
    except ValueError as exc:
        return {"ok": False, "error": str(exc)}
    raw_output = str(body.get("raw_output") or "")
    if raw_output:
        result["raw_output"] = raw_output[:200000]
    store.save_judgement_state(
        task_key=key,
        ip=state["ip"],
        start_time=state["start_time"],
        end_time=state["end_time"],
        round_number=state["round"],
        status="done",
        phase="done",
        session_id=state["session_id"],
        workflow_id=state.get("workflow_id", ""),
        execution_id=state.get("execution_id", ""),
        result=result,
    )
    return {"ok": True, "task_key": key, "result": result}


async def judgement_fail(ctx, request):
    del ctx
    body = await _json_body(request)
    if not body:
        return {"ok": False, "error": "invalid body"}
    key = str(body.get("task_key") or "")
    error = str(body.get("error") or "AI judgement ended without valid JSON")[:1000]
    store = NativeStore(_database_path())
    state = store.get_judgement(key)
    if not state:
        return {"ok": False, "error": "task not found"}
    if state["status"] != "done":
        store.save_judgement_state(
            task_key=key,
            ip=state["ip"],
            start_time=state["start_time"],
            end_time=state["end_time"],
            round_number=state["round"],
            status="failed",
            phase="failed",
            session_id=state["session_id"],
            workflow_id=state.get("workflow_id", ""),
            execution_id=state.get("execution_id", ""),
            error=error,
        )
        state = store.get_judgement(key)
    return {"ok": True, "task_key": key, "ai": _normalized_ai(state)}
