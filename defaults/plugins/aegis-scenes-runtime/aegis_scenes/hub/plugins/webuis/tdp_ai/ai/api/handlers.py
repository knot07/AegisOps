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

from v2core.client import TdpClient
from v2core.config import load_aegisops_connection, load_legacy_connection
from v2core.judgement import alert_fingerprint, task_key, validate_result
from v2core.service import NativeTdpService
from v2core.storage import NativeStore


ALLOWED_MINUTES = {5, 15, 30, 60, 120, 360, 720, 1440}
WORKFLOW_ID = "datang-tdp-fixed-review"
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
    override = os.getenv("DATANG_TDP_V2_DB")
    return Path(override).expanduser() if override else Path.home() / ".aegisops" / "data" / "datang_tdp_v2.db"


def _connection(ctx):
    # Shadow development may point at the existing config without copying it.
    # Production V2 resolves AegisOps' own tdp_api service and Secret Manager.
    legacy = os.getenv("DATANG_TDP_V2_LEGACY_CONFIG")
    if legacy:
        return load_legacy_connection(legacy)
    return load_aegisops_connection(secret_getter=ctx.secrets.get)


def _service(ctx):
    return NativeTdpService(TdpClient(_connection(ctx)), NativeStore(_database_path()))


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
        campaign_result_stale = bool(
            state.get("status") == "done"
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
    del request
    try:
        connection = _connection(ctx)
        result = _service(ctx).health()
        result["tdp_origin"] = connection.base_url
        result["tdp_config_source"] = connection.source
        result["tdp_device_instance"] = bool(connection.device_id)
        return result
    except Exception as exc:
        return {"ok": False, "backend": "native-v2", "error": str(exc)}


async def dashboard(ctx, request):
    start_time, end_time = _range(request)
    page = max(1, _int_param(request, "page", 1))
    page_size = max(1, min(1000, _int_param(request, "page_size", 1000)))

    def query():
        service = _service(ctx)
        result = service.dashboard_query(
            start_time=start_time,
            end_time=end_time,
            page=page,
            page_size=page_size,
        )
        _attach_judgements(service.store, result)
        return {
            "ok": True,
            "backend": "native-v2",
            "data": {
                "ok": True,
                "tdp": {
                    "rows": result["rows"],
                    "start_time": result["range"]["start_time"],
                    "end_time": result["range"]["end_time"],
                    "event_total": result["summary"]["event_total"],
                    "source": "aegisops-native-v2",
                    "environment": "production",
                },
                "errors": {},
            },
            "trend": result["trend"],
            "summary": result["summary"],
            "pagination": result["pagination"],
            "fetched_at": int(time.time()),
            "duration_ms": result["duration_ms"],
        }

    try:
        return await asyncio.to_thread(query)
    except ValueError:
        return {"ok": False, "error": "尚未配置 TDP 数据源，请在设备接入中配置并启用 TDP OpenAPI；可先切换到演示环境。"}


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
    workflow_inputs = {
        "task_key": key,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time,
        "alert_time": alert_time,
        "round_number": round_number,
        "alert_context": alert_context,
        "first_judgement": body.get("first_judgement") if round_number == 2 and isinstance(body.get("first_judgement"), dict) else {},
        "model_enabled": True,
    }
    return {
        "ok": True,
        "task_key": key,
        "title": f"TDP-judgement-{ip}-{time.strftime('%Y%m%d-%H%M%S')}",
        "workflow_id": WORKFLOW_ID,
        "inputs": workflow_inputs,
        "agent": "tdp-monitor-reviewer",
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
