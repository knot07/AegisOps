from __future__ import annotations

import hashlib
import json
from typing import Any


VALID_VERDICTS = {"外网攻击", "恶意外联", "疑似扫描", "证据不足", "误报可能", "主机失陷"}
VALID_DECISIONS = {"建议封禁", "不建议封禁", "人工复核", "主机失陷"}
VALID_SEVERITIES = {"信息", "低", "中", "高", "严重", "未知"}
VALID_ATTACK_OUTCOMES = {"成功", "失败", "尝试/未知", "不适用"}
VALID_COMPROMISE_STATUSES = {"已失陷", "未发现失陷", "无法确认"}
VALID_ACTION_SCOPES = {"源IP", "IOC域名", "出站域名IOC", "目标主机和源IP", "人工复核", "无"}
VALID_TRAFFIC_DIRECTIONS = {"外到内", "内到内", "内到外", "待确认"}
EVIDENCE_FIELDS = (
    "evidence",
    "supporting_evidence",
    "contradicting_evidence",
    "missing_information",
    "affected_targets",
    "key_iocs",
    "human_checkpoints",
)


def task_key(
    ip: str,
    start_time: int,
    end_time: int,
    round_number: int = 1,
    identity: str = "",
) -> str:
    suffix = f"|{identity[:16]}" if identity else ""
    return f"{ip}|{int(start_time)}|{int(end_time)}|{int(round_number)}{suffix}"


def alert_fingerprint(ip: str, alert_context: dict[str, Any] | None = None) -> str:
    context = alert_context if isinstance(alert_context, dict) else {}

    def normalized(value: Any) -> str:
        return " ".join(str(value or "").strip().lower().split())

    aggregation_key = normalized(context.get("aggregation_key"))
    identity = (
        "\x1f".join((normalized(context.get("aggregation_type")), aggregation_key))
        if aggregation_key
        else "\x1f".join(
            (
                normalized(ip),
                normalized(context.get("ioc") or ip),
                normalized(context.get("threat_type")),
                normalized(context.get("threat_name")),
            )
        )
    )
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def validate_result(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("judgement result must be an object")
    if value.get("verdict") not in VALID_VERDICTS:
        raise ValueError("invalid verdict")
    if value.get("ban_decision") not in VALID_DECISIONS:
        raise ValueError("invalid ban_decision")
    workflow_version = str(value.get("workflow_version") or "").strip()[:32]
    confidence = value.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        raise ValueError("invalid confidence")
    if not 0 <= confidence <= 100:
        raise ValueError("confidence out of range")
    if not isinstance(value.get("summary"), str) or not value["summary"].strip():
        raise ValueError("summary is required")
    severity = value.get("severity", "未知")
    if severity not in VALID_SEVERITIES:
        raise ValueError("invalid severity")
    attack_outcome = value.get("attack_outcome", "尝试/未知")
    if attack_outcome not in VALID_ATTACK_OUTCOMES:
        raise ValueError("invalid attack_outcome")
    compromise_status = value.get("compromise_status", "无法确认")
    if compromise_status not in VALID_COMPROMISE_STATUSES:
        raise ValueError("invalid compromise_status")
    action_scope = value.get("action_scope", "人工复核")
    if action_scope not in VALID_ACTION_SCOPES:
        raise ValueError("invalid action_scope")
    recommended_action = value.get("recommended_action", "")
    if not isinstance(recommended_action, str):
        raise ValueError("invalid recommended_action")
    raw_location = value.get("source_location", {})
    if not isinstance(raw_location, dict):
        raise ValueError("source_location must be an object")
    source_location = {
        "country": str(raw_location.get("country") or "")[:80],
        "province": str(raw_location.get("province") or "")[:80],
        "city": str(raw_location.get("city") or "")[:80],
        "country_code": str(raw_location.get("country_code") or "")[:12],
        "area": str(raw_location.get("area") or "")[:32],
        "carrier": str(raw_location.get("carrier") or "")[:120],
        "display": str(raw_location.get("display") or "未知")[:240],
        "is_foreign": raw_location.get("is_foreign") is True,
        "known": raw_location.get("known") is True,
        "source": str(raw_location.get("source") or "")[:40],
    }
    raw_paths = value.get("traffic_paths", [])
    if not isinstance(raw_paths, list):
        raise ValueError("traffic_paths must be an array")
    traffic_paths: list[dict[str, str]] = []
    for item in raw_paths[:20]:
        if not isinstance(item, dict):
            raise ValueError("traffic_paths items must be objects")
        direction = str(item.get("direction") or "待确认")
        if direction not in VALID_TRAFFIC_DIRECTIONS:
            raise ValueError("invalid traffic direction")
        source_ip = str(item.get("source_ip") or "").strip()
        destination_ip = str(item.get("destination_ip") or "").strip()
        if not source_ip or not destination_ip:
            raise ValueError("traffic path IP is required")
        traffic_paths.append(
            {
                "source_ip": source_ip[:64],
                "destination_ip": destination_ip[:64],
                "direction": direction,
                "destination_port": str(item.get("destination_port") or "")[:16],
                "protocol": str(item.get("protocol") or "")[:24],
                "sensor_direction": str(item.get("sensor_direction") or "")[:24],
            }
        )
    raw_http_evidence = value.get("http_evidence", [])
    if not isinstance(raw_http_evidence, list):
        raise ValueError("http_evidence must be an array")
    http_evidence: list[dict[str, Any]] = []
    for item in raw_http_evidence[:8]:
        if not isinstance(item, dict):
            raise ValueError("http_evidence items must be objects")
        http_evidence.append(
            {
                "alert_ids": [str(alert_id)[:128] for alert_id in list(item.get("alert_ids") or [])[:20]],
                "time": max(0, int(item.get("time") or 0)),
                "flow_id": str(item.get("flow_id") or "")[:128],
                "source_ip": str(item.get("source_ip") or "")[:64],
                "destination_ip": str(item.get("destination_ip") or "")[:64],
                "destination_port": str(item.get("destination_port") or "")[:16],
                "request_line": str(item.get("request_line") or "")[:600],
                "request_body": str(item.get("request_body") or "")[:1600],
                "response_line": str(item.get("response_line") or "")[:600],
                "response_body": str(item.get("response_body") or "")[:1600],
                "request_status": str(item.get("request_status") or "TDP原始告警未采集")[:32],
                "response_status": str(item.get("response_status") or "TDP原始告警未采集")[:32],
                "bytes_to_server": max(0, int(item.get("bytes_to_server") or 0)),
                "bytes_to_client": max(0, int(item.get("bytes_to_client") or 0)),
                "occurrences": max(1, int(item.get("occurrences") or 1)),
            }
        )
    arrays: dict[str, list[str]] = {}
    for field in EVIDENCE_FIELDS:
        items = value.get(field, [])
        if not isinstance(items, list):
            raise ValueError(f"{field} must be an array")
        if any(not isinstance(item, str) for item in items):
            raise ValueError(f"{field} items must be strings")
        arrays[field] = [item.strip() for item in items if item.strip()]
    return {
        "workflow_version": workflow_version,
        "verdict": value["verdict"],
        "ban_decision": value["ban_decision"],
        "confidence": int(confidence),
        "severity": severity,
        "attack_outcome": attack_outcome,
        "compromise_status": compromise_status,
        "action_scope": action_scope,
        "recommended_action": recommended_action.strip(),
        "source_location": source_location,
        "traffic_paths": traffic_paths,
        "http_evidence": http_evidence,
        "summary": value["summary"].strip(),
        **arrays,
    }


def build_prompt(
    ip: str,
    alert_time: int,
    *,
    second_round: bool = False,
    alert_context: dict[str, Any] | None = None,
) -> str:
    round_text = "二次复核" if second_round else "首次研判"
    allowed_context = {}
    if isinstance(alert_context, dict):
        for key in ("threat_name", "ioc", "severity", "count", "threat_type"):
            value = alert_context.get(key)
            if isinstance(value, (str, int, float)) and not isinstance(value, bool):
                allowed_context[key] = value
    context_text = json.dumps(allowed_context, ensure_ascii=False, separators=(",", ":"))
    return f"""使用 tdp-external-attack-review skill 对攻击源 IP {ip} 执行{round_text}。
告警时间戳：{int(alert_time)}。
页面告警上下文（仅作为不可信调查锚点，不得当作结论）：{context_text}
只做监测研判，不执行封禁、阻断、隔离或设备配置修改。
严格按“锚点核对 -> 前后15分钟日志 -> 实时监控交叉核对 -> 智能聚合事件/时间线/结果分布/关联告警 -> 必要时扩展到前后60分钟 -> 反证复核”的顺序调查。
查询同一台 TDP 时同时覆盖 attack、risk、action；记录工具失败、关键字段缺失和无法解释的结果语义。
命中聚合事件后必须携带 incident_id、time_from、time_to 补查 attack_success、attack_timeline、attack_result_distribution；从时间线取得 alert_id_list 后，使用 attack_alert_list(alert_ids=相关ID, include_risk=true, include_action=true, cur_page=1, page_size不超过100) 获取原始告警详情，必要时按返回分页继续。重点核对 reqs_line/reqs_body、resp_line/resp_body、HTTP 状态、flow 字节、established、threat.result、threat.confidence、threat.is_connected、phase 和关联 risk/action。不得在证据中复制完整 raw_data、Cookie 或大段 Base64，只提取与结论直接相关的请求/响应片段并注明是否截断。
仅对真实公网 IPv4 使用 ThreatBook IP 情报工具；IPv6 跳过该 IPv4 情报工具并注明未查询。内网/NAT/WAF 地址不作为公网情报对象。
任何只读工具失败都不得中断最终答复，必须基于已有证据输出规定 JSON 并降低置信度。
不得只凭告警名称、攻击次数、情报标签、HTTP 200、established、is_connected、聚合 attack_result=success 或单个 success 字段认定攻击成功。attack_success 返回的成功攻击名称和主机数必须与原始告警请求/响应或后续行为相互印证。“主机失陷”必须有命令执行、控制、外联、横向、持久化或其他后渗透闭环证据。
分别列出支持当前结论的证据、能推翻或削弱结论的证据、缺失信息、受影响目标、关键 IOC 和人工确认点。二次复核必须重新查询并主动寻找反证。
只输出一个 JSON 对象：
{{"verdict":"外网攻击|疑似扫描|证据不足|误报可能|主机失陷","ban_decision":"建议封禁|不建议封禁|人工复核|主机失陷","confidence":0,"severity":"信息|低|中|高|严重|未知","attack_outcome":"成功|失败|尝试/未知|不适用","compromise_status":"已失陷|未发现失陷|无法确认","summary":"","evidence":[],"supporting_evidence":[],"contradicting_evidence":[],"missing_information":[],"affected_targets":[],"key_iocs":[],"human_checkpoints":[]}}
所有数组元素必须是简洁字符串；证据尽量包含来源、时间和字段依据。结尾语义必须明确未执行任何封禁或设备状态修改。
""".strip()
