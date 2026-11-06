from __future__ import annotations

import base64
import ipaddress
import json
import re
import sqlite3
import time
from pathlib import Path
from typing import Any, Iterable


WORKFLOW_ID = "datang-tdp-fixed-review"
WORKFLOW_VERSION = "1.17.0"
SCAN_RECORD_BLOCK_THRESHOLD = 3
PACKET_ALERT_LIMIT_PER_INCIDENT = 12
PACKET_ALERT_BATCH_SIZE = 2
LOG_SAMPLE_SIZE = 10
VALID_VERDICTS = {"外网攻击", "恶意外联", "疑似扫描", "证据不足", "误报可能", "主机失陷"}
VALID_DECISIONS = {"建议封禁", "不建议封禁", "人工复核", "主机失陷"}
VALID_SEVERITIES = {"信息", "低", "中", "高", "严重", "未知"}
VALID_ATTACK_OUTCOMES = {"成功", "失败", "尝试/未知", "不适用"}
VALID_COMPROMISE_STATUSES = {"已失陷", "未发现失陷", "无法确认"}
DNS_TUNNEL_PATTERN = re.compile(r"DNS\s*(?:隧道|tunnel)|域名隧道", re.I)
OUT_OF_SCOPE_MISSING_PATTERN = re.compile(
    r"(?:EDR|身份数据|用户身份|所属用户|资产元数据|资产属性)", re.I
)
OPTIONAL_INTEL_MISSING_PATTERN = re.compile(
    r"(?:threat_intel:|Beyond Daily Limitation|(?:外部\s*IP?\s*情报|ThreatBook|微步).*(?:暂不可用|不可用|未获取|失败|额度|参数)|MCP\s*工具.*(?:失败|额度))",
    re.I,
)
OPTIONAL_ENRICHMENT_TOOLS = {"datang_tdp_ip_reputation"}
KNOWN_PUBLIC_DNS_RESOLVERS = {
    "1.0.0.1", "1.1.1.1", "8.8.4.4", "8.8.8.8", "9.9.9.9",
    "101.226.4.6", "114.114.114.114", "114.114.115.115",
    "119.29.29.29", "149.112.112.112", "180.76.76.76",
    "182.254.116.116", "218.30.118.6", "223.5.5.5", "223.6.6.6",
}
ARRAY_FIELDS = (
    "evidence",
    "supporting_evidence",
    "contradicting_evidence",
    "missing_information",
    "affected_targets",
    "key_iocs",
    "human_checkpoints",
)
SENSITIVE_KEYS = {
    "raw_data",
    "cookie",
    "cookies",
    "authorization",
    "proxy_authorization",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "secret",
    "password",
    "session_id",
}
LOG_COLUMNS = [
    {"label": name, "value": name}
    for name in (
        "time",
        "@timestamp",
        "threat.name",
        "attacker",
        "net.src_ip",
        "net.real_src_ip",
        "net.src_port",
        "net.dest_ip",
        "net.dest_port",
        "net.flow_src_ip",
        "net.flow_src_port",
        "net.flow_dest_ip",
        "net.flow_dest_port",
        "net.protocol",
        "net.http.url",
        "net.http.method",
        "net.http.status",
        "net.http.reqs_line",
        "net.http.reqs_header",
        "net.http.reqs_body",
        "net.http.resp_line",
        "net.http.resp_header",
        "net.http.resp_body",
        "net.flow_bytes",
        "established",
        "threat.result",
        "threat.confidence",
        "threat.is_connected",
        "threat.phase",
        "phase",
        "severity",
        "direction",
        "characters",
        "payload",
        "flow_id",
        "hit_whitelist",
        "ip_reputation",
        "ip_reputation_zh",
        "geo_data.location",
        "geo_data.Country",
        "geo_data.Province",
        "geo_data.City",
        "geo_data.ISO2",
        "geo_data.Area",
        "src_ip_geo_data.location",
        "src_ip_geo_data.Country",
        "src_ip_geo_data.Province",
        "src_ip_geo_data.City",
        "src_ip_geo_data.ISO2",
        "src_ip_geo_data.Area",
        "net.tls.ja3.hash",
        "alert.signature",
    )
]
LOG_COLUMNS_COMPACT = [
    {"label": name, "value": name}
    for name in (
        "time",
        "threat.name",
        "threat.type",
        "threat.phase",
        "threat.result",
        "threat.is_connected",
        "threat.confidence",
        "attacker",
        "net.src_ip",
        "net.real_src_ip",
        "net.src_port",
        "net.dest_ip",
        "net.dest_port",
        "net.flow_src_ip",
        "net.flow_src_port",
        "net.flow_dest_ip",
        "net.flow_dest_port",
        "net.protocol",
        "direction",
        "established",
        "net.http.reqs_line",
        "net.http.reqs_body",
        "net.http.resp_line",
        "net.http.resp_body",
        "flow_id",
        "hit_whitelist",
        "ip_reputation",
        "ip_reputation_zh",
        "geo_data.location",
        "geo_data.Country",
        "geo_data.Province",
        "geo_data.City",
        "geo_data.ISO2",
        "geo_data.Area",
        "src_ip_geo_data.location",
        "src_ip_geo_data.Country",
        "src_ip_geo_data.Province",
        "src_ip_geo_data.City",
        "src_ip_geo_data.ISO2",
        "src_ip_geo_data.Area",
    )
]


def _database_path() -> Path:
    return Path.home() / ".aegisops" / "data" / "datang_tdp_v2.db"


def _state_update(
    context: dict[str, Any],
    *,
    phase: str,
    status: str = "pending",
    result: dict[str, Any] | None = None,
    error: str = "",
) -> None:
    key = str(context.get("task_key") or "")
    if not key:
        return
    try:
        with sqlite3.connect(_database_path(), timeout=30) as connection:
            connection.execute("PRAGMA busy_timeout=30000")
            if result is None:
                connection.execute(
                    "UPDATE tdp_judgements SET status=?, phase=?, error=?, updated_at=? WHERE task_key=?",
                    (status, phase, error[:1000], int(time.time()), key),
                )
            else:
                connection.execute(
                    """
                    UPDATE tdp_judgements
                    SET status=?, phase=?, result_json=?, error=?, updated_at=?
                    WHERE task_key=?
                    """,
                    (
                        status,
                        phase,
                        json.dumps(result, ensure_ascii=False, separators=(",", ":")),
                        error[:1000],
                        int(time.time()),
                        key,
                    ),
                )
    except Exception:
        # Workflow output remains available even if the dashboard database is locked.
        pass


def _clip_text(value: Any, limit: int = 800) -> str:
    text = str(value or "").replace("\x00", "")
    if len(text) <= limit:
        return text
    return text[:limit] + f"... [truncated {len(text) - limit} chars]"


def _looks_like_base64(text: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    return len(compact) > 256 and bool(re.fullmatch(r"[A-Za-z0-9+/=_-]+", compact))


def _looks_like_payload_base64(text: str) -> bool:
    compact = re.sub(r"\s+", "", text)
    return len(compact) >= 32 and len(compact) % 4 == 0 and bool(re.fullmatch(r"[A-Za-z0-9+/=_-]+", compact))


def _payload_summary(text: str) -> dict[str, Any]:
    compact = re.sub(r"\s+", "", text)
    try:
        padded = compact + "=" * (-len(compact) % 4)
        decoded = base64.b64decode(padded, altchars=b"-_", validate=False)
    except Exception:
        return {"encoding": "base64", "encoded_chars": len(compact), "decoded": False}
    protocol_hint = "binary"
    if len(decoded) >= 6 and decoded[0] == 0x16 and decoded[5] == 0x01:
        protocol_hint = "TLS ClientHello"
    elif decoded.startswith((b"GET ", b"POST ", b"PUT ", b"HEAD ", b"DELETE ", b"OPTIONS ")):
        protocol_hint = "HTTP request"
    return {
        "encoding": "base64",
        "encoded_chars": len(compact),
        "decoded_bytes": len(decoded),
        "prefix_hex": decoded[:12].hex(),
        "protocol_hint": protocol_hint,
        "raw_omitted": True,
    }


def _sanitize(value: Any, *, depth: int = 0) -> Any:
    if depth > 7:
        return "[depth truncated]"
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str):
        if _looks_like_base64(value):
            return f"[base64 omitted: {len(value)} chars]"
        return _clip_text(value)
    if isinstance(value, dict):
        cleaned: dict[str, Any] = {}
        for raw_key, item in list(value.items())[:120]:
            key = str(raw_key)
            if key.lower() in SENSITIVE_KEYS:
                cleaned[key] = "[redacted]"
            elif key.lower() == "payload" and isinstance(item, str) and _looks_like_payload_base64(item):
                cleaned[key] = _payload_summary(item)
            else:
                cleaned[key] = _sanitize(item, depth=depth + 1)
        if len(value) > 120:
            cleaned["_truncated_keys"] = len(value) - 120
        return cleaned
    if isinstance(value, (list, tuple, set)):
        items = list(value)
        cleaned = [_sanitize(item, depth=depth + 1) for item in items[:100]]
        if len(items) > 100:
            cleaned.append(f"[truncated {len(items) - 100} items]")
        return cleaned
    return _clip_text(value)


def _parse_tool_value(value: Any) -> Any:
    if isinstance(value, (dict, list)):
        return value
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        return text


def _is_truncated_tool_output(value: Any) -> bool:
    return isinstance(value, str) and "output was truncated" in value.lower()


def _tool_call(tool: Any, name: str, **kwargs: Any) -> dict[str, Any]:
    started = time.time()
    try:
        envelope = tool.run_safe(name, **kwargs)
        success = bool(envelope.get("success")) if isinstance(envelope, dict) else True
        obj = envelope.get("obj") if isinstance(envelope, dict) else envelope
        text = envelope.get("text", "") if isinstance(envelope, dict) else ""
        error = envelope.get("error", "") if isinstance(envelope, dict) else ""
        parsed = _parse_tool_value(obj if obj not in (None, "") else text)
        truncated = _is_truncated_tool_output(parsed)
        return {
            "ok": success and not truncated,
            "tool": name,
            "duration_ms": int((time.time() - started) * 1000),
            "data": _sanitize(parsed),
            "error": (
                "tool output was truncated before structured parsing"
                if truncated
                else "" if success
                else _clip_text(error or text, 500)
            ),
        }
    except Exception as exc:
        return {
            "ok": False,
            "tool": name,
            "duration_ms": int((time.time() - started) * 1000),
            "data": None,
            "error": _clip_text(f"{type(exc).__name__}: {exc}", 500),
        }


def _walk(value: Any) -> Iterable[Any]:
    yield value
    if isinstance(value, dict):
        for item in value.values():
            yield from _walk(item)
    elif isinstance(value, list):
        for item in value:
            yield from _walk(item)


def _dict_nodes(value: Any) -> list[dict[str, Any]]:
    return [item for item in _walk(value) if isinstance(item, dict)]


def _items(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    if not isinstance(value, dict):
        return []
    for key in ("data", "items", "rows", "list", "results", "alerts"):
        candidate = value.get(key)
        if isinstance(candidate, list):
            return [item for item in candidate if isinstance(item, dict)]
        if isinstance(candidate, dict):
            nested = _items(candidate)
            if nested:
                return nested
    return []


def _values(value: Any, names: set[str]) -> list[Any]:
    found: list[Any] = []
    lowered = {name.lower() for name in names}
    for node in _dict_nodes(value):
        for key, item in node.items():
            if str(key).lower() in lowered:
                found.append(item)
    return found


def _unique_strings(values: Iterable[Any], limit: int = 50) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if isinstance(value, list):
            nested = value
        else:
            nested = [value]
        for item in nested:
            text = str(item or "").strip()
            if text and text not in seen:
                seen.add(text)
                result.append(text)
                if len(result) >= limit:
                    return result
    return result


def _contains_ip(value: Any, ip: str) -> bool:
    return ip in json.dumps(value, ensure_ascii=False, separators=(",", ":"))


_INTERNAL_NETWORKS = tuple(
    ipaddress.ip_network(value)
    for value in (
        "10.0.0.0/8",
        "100.64.0.0/10",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "::1/128",
        "fc00::/7",
        "fe80::/10",
    )
)


def _normalized_ip(value: Any) -> str:
    text = str(value or "").strip().strip("[]")
    if not text:
        return ""
    try:
        return ipaddress.ip_address(text).compressed
    except ValueError:
        return ""


def _network_zone(value: Any) -> str:
    text = _normalized_ip(value)
    if not text:
        return "unknown"
    address = ipaddress.ip_address(text)
    return "internal" if any(address in network for network in _INTERNAL_NETWORKS) else "external"


def _traffic_direction(source_ip: str, destination_ip: str) -> str:
    source_zone = _network_zone(source_ip)
    destination_zone = _network_zone(destination_ip)
    return {
        ("external", "internal"): "外到内",
        ("internal", "internal"): "内到内",
        ("internal", "external"): "内到外",
    }.get((source_zone, destination_zone), "待确认")


def _is_domain_name(value: Any) -> bool:
    text = str(value or "").strip()
    return bool(text and re.fullmatch(r"(?=.{4,253}$)(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,63}", text))


def _is_public_dns_resolver(value: Any) -> bool:
    return _normalized_ip(value) in KNOWN_PUBLIC_DNS_RESOLVERS


def _sensor_direction(record: dict[str, Any], net: dict[str, Any]) -> str:
    value = str(
        record.get("direction")
        or record.get("packet_direction")
        or net.get("direction")
        or net.get("packet_direction")
        or ""
    ).strip().lower()
    return {
        "inbound": "in",
        "入站": "in",
        "外部攻击": "in",
        "outbound": "out",
        "出站": "out",
        "失陷主机": "out",
        "横向渗透": "lateral",
    }.get(value, value)


def _traffic_paths(records: list[dict[str, Any]], anchor_ip: str) -> list[dict[str, str]]:
    paths: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str, str]] = set()
    for record in records:
        net = record.get("net") if isinstance(record.get("net"), dict) else {}
        sensor_direction = _sensor_direction(record, net)
        flow_source_ip = _normalized_ip(
            net.get("flow_src_ip")
            or record.get("net.flow_src_ip")
            or record.get("flow_src_ip")
        )
        flow_destination_ip = _normalized_ip(
            net.get("flow_dest_ip")
            or record.get("net.flow_dest_ip")
            or record.get("flow_dest_ip")
        )
        role_source_ip = _normalized_ip(
            net.get("real_src_ip")
            or net.get("src_ip")
            or record.get("net.real_src_ip")
            or record.get("net.src_ip")
            or record.get("src_ip")
            or record.get("attacker")
        )
        role_destination_ip = _normalized_ip(
            net.get("dest_ip")
            or net.get("dst_ip")
            or record.get("net.dest_ip")
            or record.get("net.dst_ip")
            or record.get("dest_ip")
            or record.get("dst_ip")
        )
        source_ip = flow_source_ip or role_source_ip
        destination_ip = flow_destination_ip or role_destination_ip
        if not source_ip and destination_ip and _contains_ip(record, anchor_ip):
            source_ip = _normalized_ip(anchor_ip)
        if not source_ip or not destination_ip:
            continue
        flow_destination_port = str(
            net.get("flow_dest_port")
            or record.get("net.flow_dest_port")
            or record.get("flow_dest_port")
            or ""
        ).strip()
        role_source_port = str(
            net.get("src_port")
            or record.get("net.src_port")
            or record.get("src_port")
            or ""
        ).strip()
        role_destination_port = str(
            net.get("dest_port")
            or net.get("dst_port")
            or record.get("net.dest_port")
            or record.get("net.dst_port")
            or record.get("dest_port")
            or record.get("dst_port")
            or ""
        ).strip()
        destination_port = flow_destination_port or role_destination_port
        if sensor_direction == "out" and _network_zone(source_ip) == "external" and _network_zone(destination_ip) == "internal":
            source_ip, destination_ip = destination_ip, source_ip
            destination_port = role_source_port
        protocol = str(net.get("protocol") or record.get("net.protocol") or record.get("protocol") or "").strip().upper()
        direction = _traffic_direction(source_ip, destination_ip)
        marker = (source_ip, destination_ip, destination_port, protocol, direction)
        if marker in seen:
            continue
        seen.add(marker)
        paths.append(
            {
                "source_ip": source_ip,
                "destination_ip": destination_ip,
                "direction": direction,
                "destination_port": destination_port,
                "protocol": protocol,
                "sensor_direction": sensor_direction,
            }
        )
        if len(paths) >= 20:
            break
    return paths


def _dns_query_paths(records: list[dict[str, Any]], resolver_ip: str) -> list[dict[str, str]]:
    """Restore initiating direction when TDP records a public DNS response packet."""
    paths: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    for record in records:
        net = record.get("net") if isinstance(record.get("net"), dict) else {}
        source_ip = _normalized_ip(
            net.get("src_ip") or record.get("net.src_ip") or record.get("src_ip")
        )
        internal_ip = _normalized_ip(
            net.get("dest_ip") or net.get("dst_ip")
            or record.get("net.dest_ip") or record.get("net.dst_ip")
            or record.get("dest_ip") or record.get("dst_ip")
        )
        resolver_port = str(
            net.get("src_port") or record.get("net.src_port") or record.get("src_port") or "53"
        ).strip()
        client_port = str(
            net.get("dest_port") or net.get("dst_port")
            or record.get("net.dest_port") or record.get("net.dst_port")
            or record.get("dest_port") or record.get("dst_port") or ""
        ).strip()
        try:
            client_port_is_ephemeral = int(client_port) > 1024
        except ValueError:
            client_port_is_ephemeral = False
        if (
            source_ip != resolver_ip
            or _network_zone(internal_ip) != "internal"
            or resolver_port != "53"
            or not client_port_is_ephemeral
        ):
            continue
        marker = (internal_ip, resolver_ip, resolver_port)
        if marker in seen:
            continue
        seen.add(marker)
        paths.append({
            "source_ip": internal_ip,
            "destination_ip": resolver_ip,
            "direction": "内到外",
            "destination_port": resolver_port,
            "protocol": str(net.get("protocol") or record.get("protocol") or "DNS").strip().upper(),
            "sensor_direction": _sensor_direction(record, net),
        })
    return paths


def _incident_id(item: dict[str, Any]) -> str:
    for key in ("incident_id", "incidentId", "id"):
        value = item.get(key)
        if value not in (None, ""):
            return str(value)
    return ""


def _extract_alert_ids(value: Any) -> list[str]:
    values = _values(value, {"alert_id_list", "alert_ids", "alert_id", "alertId"})
    return _unique_strings(values, 500)


def _severity(value: Any) -> str:
    text = str(value or "").strip().lower()
    mapping = {
        "0": "信息", "info": "信息", "information": "信息", "信息": "信息",
        "1": "低", "low": "低", "低": "低", "低危": "低",
        "2": "中", "medium": "中", "中": "中", "中危": "中",
        "3": "高", "high": "高", "高": "高", "高危": "高",
        "4": "严重", "critical": "严重", "严重": "严重", "严重危": "严重",
    }
    return mapping.get(text, "未知")


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return str(value or "").strip().lower() in {"1", "true", "yes", "y", "是", "命中"}


def _has_truthy_field(value: Any, names: set[str]) -> bool:
    return any(_truthy(item) for item in _values(value, names))


def _integer_values(value: Any, names: set[str]) -> list[int]:
    result: list[int] = []
    for item in _values(value, names):
        try:
            result.append(int(float(item)))
        except (TypeError, ValueError):
            continue
    return result


def _max_nonnegative_int(*values: Any) -> int:
    parsed: list[int] = []
    for value in values:
        try:
            parsed.append(max(0, int(float(value))))
        except (TypeError, ValueError):
            continue
    return max(parsed, default=0)


def _leaf_strings(value: Any) -> list[str]:
    return [str(item).strip() for item in _walk(value) if isinstance(item, str) and item.strip()]


def _reputation_profile(
    records: list[dict[str, Any]],
    intel_data: Any,
    alert_context: dict[str, Any],
) -> dict[str, bool]:
    reputation_values = _values(records, {"ip_reputation", "ip_reputation_zh", "reputation", "reputation_zh"})
    terms = _leaf_strings(reputation_values) + _leaf_strings(intel_data)
    reputation_text = " ".join(terms).lower()
    hit_whitelist = (
        _has_truthy_field(records, {"hit_whitelist", "is_whitelist", "whitelist"})
        or _has_truthy_field(intel_data, {"hit_whitelist", "is_whitelist", "whitelist"})
        or _truthy(alert_context.get("hit_whitelist"))
        or any(marker in reputation_text for marker in ("白名单", "whitelist", "trusted infrastructure", "可信基础设施"))
    )
    strong_bad_reputation = (
        _has_truthy_field(intel_data, {"is_malicious", "malicious"})
        or any(
            marker in reputation_text
            for marker in ("僵尸网络", "恶意", "黑名单", "botnet", "zombie", "malicious", "blacklist")
        )
    )
    weak_risk_reputation = any(
        marker in reputation_text
        for marker in ("垃圾邮件", "扫描器", "攻击者", "spam", "scanner")
    )
    bad_reputation = strong_bad_reputation or weak_risk_reputation
    cloud_host = any(marker in reputation_text for marker in ("阿里云", "腾讯云", "华为云", "云主机", "cloud host", "azurecloud", "azure cloud", "idc"))
    trusted_infrastructure = hit_whitelist or _truthy(alert_context.get("is_cdn"))
    return {
        "bad_reputation": bad_reputation,
        "strong_bad_reputation": strong_bad_reputation,
        "weak_risk_reputation": weak_risk_reputation,
        "cloud_host": cloud_host,
        "hit_whitelist": hit_whitelist,
        "trusted_infrastructure": trusted_infrastructure,
    }


def _location_field(value: Any, *names: str) -> str:
    if not isinstance(value, dict):
        return ""
    normalized = {str(key).lower(): item for key, item in value.items()}
    for name in names:
        item = normalized.get(name.lower())
        if item not in (None, ""):
            return str(item).strip()
    return ""


def _location_from_node(node: Any) -> dict[str, str]:
    if not isinstance(node, dict):
        return {}
    flattened = {
        str(key).lower(): value
        for key, value in node.items()
        if not isinstance(value, (dict, list))
    }
    for prefix in ("geo_data", "src_ip_geo_data", "source_ip_geo_data", "attacker_geo_data"):
        flat_result = {
            "country": str(flattened.get(f"{prefix}.country") or "").strip(),
            "province": str(flattened.get(f"{prefix}.province") or "").strip(),
            "city": str(flattened.get(f"{prefix}.city") or "").strip(),
            "country_code": str(flattened.get(f"{prefix}.iso2") or flattened.get(f"{prefix}.country_code") or "").strip(),
            "area": str(flattened.get(f"{prefix}.area") or "").strip(),
            "carrier": _location_field(node, "carrier", "isp"),
        }
        if any(flat_result[key] for key in ("country", "province", "city", "country_code", "area")):
            return flat_result
    containers = [
        node.get("location"),
        node.get("geo_data"),
        node.get("src_ip_geo_data"),
        node.get("source_ip_geo_data"),
        node.get("attacker_geo_data"),
    ]
    containers.extend(
        value
        for key, value in node.items()
        if str(key).lower() in {
            "location", "geo_data", "src_ip_geo_data", "source_ip_geo_data", "attacker_geo_data"
        }
    )
    for container in containers:
        if isinstance(container, str) and container.strip():
            parts = [part.strip() for part in re.split(r"[-/,，]", container) if part.strip()]
            return {
                "country": parts[0] if parts else "",
                "province": parts[1] if len(parts) > 1 else "",
                "city": parts[2] if len(parts) > 2 else "",
                "country_code": "",
                "area": "",
                "carrier": _location_field(node, "carrier", "isp"),
            }
        if not isinstance(container, dict):
            continue
        location_text = _location_field(container, "location")
        parts = [part.strip() for part in re.split(r"[-/,，]", location_text) if part.strip()]
        result = {
            "country": _location_field(container, "country", "Country") or (parts[0] if parts else ""),
            "province": _location_field(container, "province", "Province") or (parts[1] if len(parts) > 1 else ""),
            "city": _location_field(container, "city", "City") or (parts[2] if len(parts) > 2 else ""),
            "country_code": _location_field(container, "country_code", "ISO2", "iso_code"),
            "area": _location_field(container, "area", "Area"),
            "carrier": _location_field(node, "carrier", "isp"),
        }
        if any(result.values()):
            return result
    return {}


def _node_matches_ip(node: dict[str, Any], ip: str) -> bool:
    values: list[str] = []
    for key in (
        "ip", "external_ip", "attacker", "attacker_ip", "src_ip", "source_ip",
        "real_src_ip", "resource",
    ):
        value = node.get(key)
        if not isinstance(value, (dict, list)):
            values.append(str(value or "").strip())
    net = node.get("net") if isinstance(node.get("net"), dict) else {}
    values.extend(str(net.get(key) or "").strip() for key in ("src_ip", "real_src_ip", "flow_src_ip"))
    return ip in values


def _is_foreign_location(country: str, country_code: str, area: str) -> bool:
    area_value = str(area or "").strip().lower()
    if area_value in {"outland", "overseas", "foreign", "abroad", "境外", "国外"}:
        return True
    if area_value in {"china_mainland", "mainland", "境内", "国内"}:
        return False
    code = re.sub(r"[^A-Za-z]", "", str(country_code or "")).upper()
    if code in {"CN", "CHN", "HK", "HKG", "MO", "MAC", "TW", "TWN"}:
        return False
    if code:
        return True
    name = re.sub(r"\s+", "", str(country or "")).lower()
    if not name or name in {"未知", "unknown", "other", "--", "-"}:
        return False
    domestic_markers = (
        "中国", "中华人民共和国", "china", "香港", "hongkong", "澳门", "macao", "macau", "台湾", "taiwan"
    )
    return not any(marker in name for marker in domestic_markers)


def _source_location(
    evidence: dict[str, Any],
    intel_data: Any,
    alert_context: dict[str, Any],
    ip: str,
) -> dict[str, Any]:
    candidates: list[tuple[str, dict[str, str]]] = []
    intel_location = _location_from_node(intel_data)
    if intel_location:
        candidates.append(("微步IP信誉", intel_location))
    context_location = _location_from_node(alert_context)
    if context_location:
        candidates.append(("告警上下文", context_location))
    for node in _dict_nodes((evidence.get("sources") or {})):
        if _node_matches_ip(node, ip):
            location = _location_from_node(node)
            if location:
                candidates.append(("TDP", location))
    if not candidates:
        return {
            "country": "", "province": "", "city": "", "country_code": "",
            "area": "", "carrier": "", "display": "未知", "is_foreign": False,
            "known": False, "source": "",
        }
    source, location = candidates[0]
    display_parts = _unique_strings([
        location.get("country"), location.get("province"), location.get("city")
    ], 3)
    return {
        **location,
        "display": " / ".join(display_parts) or location.get("country_code") or "未知",
        "is_foreign": _is_foreign_location(
            location.get("country", ""), location.get("country_code", ""), location.get("area", "")
        ),
        "known": bool(display_parts or location.get("country_code") or location.get("area")),
        "source": source,
    }


def _threat_intel_summary(intel_data: Any) -> str:
    if not isinstance(intel_data, dict) or intel_data.get("skipped"):
        return ""
    malicious = intel_data.get("is_malicious")
    malicious_text = "未知" if malicious is None else "是" if _truthy(malicious) else "否"
    judgments = _unique_strings(intel_data.get("judgments") or [], 8)
    tags = _unique_strings([
        tag
        for item in (intel_data.get("tags_classes") or [])
        if isinstance(item, dict)
        for tag in (item.get("tags") or [])
    ], 12)
    parts = [f"恶意={malicious_text}"]
    if intel_data.get("confidence_level") not in (None, ""):
        parts.append(f"可信度={intel_data['confidence_level']}")
    if intel_data.get("severity") not in (None, ""):
        parts.append(f"严重度={intel_data['severity']}")
    if judgments:
        parts.append("威胁类型=" + "、".join(judgments))
    if tags:
        parts.append("标签=" + "、".join(tags))
    location = _location_from_node(intel_data)
    location_parts = _unique_strings([
        location.get("country"), location.get("province"), location.get("city")
    ], 3)
    if location_parts:
        parts.append("归属地=" + "/".join(location_parts))
    if location.get("carrier"):
        parts.append("运营商=" + location["carrier"])
    return "微步 IP 信誉查询成功: " + "，".join(parts)


def _collect_log_sample(
    tool: Any,
    *,
    time_from: int,
    time_to: int,
    sql: str,
) -> dict[str, Any]:
    batches: dict[str, dict[str, Any]] = {}
    records: list[dict[str, Any]] = []
    for data_type in ("attack", "risk", "action"):
        batch = _tool_call(
            tool,
            "tdp_log_search",
            action="search",
            time_from=time_from,
            time_to=time_to,
            net_data_type=[data_type],
            sql=sql,
            columns=LOG_COLUMNS,
            size=LOG_SAMPLE_SIZE,
        )
        if not batch.get("ok") and "truncated" in str(batch.get("error") or "").lower():
            retry = _tool_call(
                tool,
                "tdp_log_search",
                action="search",
                time_from=time_from,
                time_to=time_to,
                net_data_type=[data_type],
                sql=sql,
                columns=LOG_COLUMNS_COMPACT,
                size=3,
            )
            retry["degraded"] = True
            retry["fallback"] = "compact_fields_size_3"
            retry["original_error"] = batch.get("error", "")
            batch = retry
        batches[data_type] = batch
        if batch.get("ok"):
            records.extend(_items(batch.get("data")))
    failed = [f"{name}: {item.get('error') or 'tool failed'}" for name, item in batches.items() if not item.get("ok")]
    return {
        "ok": not failed,
        "tool": "tdp_log_search",
        "duration_ms": sum(int(item.get("duration_ms") or 0) for item in batches.values()),
        "data": {"items": records, "batch_status": {
            name: {"ok": item.get("ok"), "degraded": item.get("degraded", False), "error": item.get("error", "")}
            for name, item in batches.items()
        }},
        "error": "; ".join(failed),
        "degraded": any(item.get("degraded") for item in batches.values()),
    }


def prepare(inputs: dict[str, Any]) -> dict[str, Any]:
    ip = str(inputs.get("ip") or "").strip()
    try:
        ip_obj = ipaddress.ip_address(ip)
    except ValueError as exc:
        raise ValueError("invalid investigation ip") from exc
    alert_time = int(inputs.get("alert_time") or inputs.get("end_time") or time.time())
    start_time = int(inputs.get("start_time") or alert_time - 3600)
    end_time = int(inputs.get("end_time") or alert_time + 3600)
    if end_time <= start_time:
        raise ValueError("invalid investigation time range")
    round_number = 2 if int(inputs.get("round_number") or 1) == 2 else 1
    task_key = str(inputs.get("task_key") or f"{ip}|{start_time}|{end_time}|{round_number}")
    alert_context = inputs.get("alert_context") if isinstance(inputs.get("alert_context"), dict) else {}
    first_judgement = inputs.get("first_judgement") if isinstance(inputs.get("first_judgement"), dict) else {}
    context = {
        "task_key": task_key,
        "workflow_id": WORKFLOW_ID,
        "workflow_version": WORKFLOW_VERSION,
        "ip": ip,
        "ip_version": ip_obj.version,
        "alert_time": alert_time,
        "start_time": start_time,
        "end_time": end_time,
        "window_15": {"time_from": alert_time - 900, "time_to": alert_time + 900},
        "window_60": {"time_from": alert_time - 3600, "time_to": alert_time + 3600},
        "round_number": round_number,
        "alert_context": _sanitize(alert_context),
        "first_judgement": _sanitize(first_judgement),
        "model_enabled": bool(inputs.get("model_enabled", True)),
    }
    _state_update(context, phase="collecting")
    return {"context": context}


def _collect_incident_details(
    tool: Any,
    *,
    incidents: list[dict[str, Any]],
    context: dict[str, Any],
) -> list[dict[str, Any]]:
    ip = context["ip"]
    window = context["window_60"]
    detailed: list[dict[str, Any]] = []
    seen: set[str] = set()
    for incident in incidents:
        incident_id = _incident_id(incident)
        if not incident_id or incident_id in seen:
            continue
        seen.add(incident_id)
        common = {
            "incident_id": incident_id,
            "time_from": window["time_from"],
            "time_to": window["time_to"],
        }
        details: dict[str, Any] = {"incident_id": incident_id, "incident": _sanitize(incident)}
        for action, extra in (
            ("attack_success", {}),
            ("attack_timeline", {"include_risk": True, "show_attack": True}),
            ("attack_result_distribution", {}),
            ("top_attacked_entity", {}),
            ("attacker_ip_list", {"cur_page": 1, "page_size": 100}),
            ("attacker_ip_detail", {"attacker": [ip]}),
        ):
            details[action] = _tool_call(
                tool,
                "tdp_threat_intelligent_aggregation",
                action=action,
                **common,
                **extra,
            )
        alert_ids = _extract_alert_ids(details.get("attack_timeline"))
        alerts: list[dict[str, Any]] = []
        selected_alert_ids = alert_ids[:PACKET_ALERT_LIMIT_PER_INCIDENT]
        for offset in range(0, len(selected_alert_ids), PACKET_ALERT_BATCH_SIZE):
            chunk = selected_alert_ids[offset:offset + PACKET_ALERT_BATCH_SIZE]
            page = _tool_call(
                tool,
                "tdp_threat_intelligent_aggregation",
                action="attack_alert_list",
                alert_ids=chunk,
                include_risk=True,
                include_action=True,
                cur_page=1,
                page_size=max(10, len(chunk)),
            )
            if page.get("ok") or len(chunk) == 1:
                alerts.append(page)
                continue
            for alert_id in chunk:
                alerts.append(
                    _tool_call(
                        tool,
                        "tdp_threat_intelligent_aggregation",
                        action="attack_alert_list",
                        alert_ids=[alert_id],
                        include_risk=True,
                        include_action=True,
                        cur_page=1,
                        page_size=10,
                    )
                )
        details["alert_ids"] = alert_ids
        details["packet_alert_ids"] = selected_alert_ids
        details["packet_alerts_truncated"] = len(alert_ids) > len(selected_alert_ids)
        details["attack_alert_pages"] = alerts
        detailed.append(details)
        if len(detailed) >= 3:
            break
    return detailed


def collect_evidence(inputs: dict[str, Any], tool: Any) -> dict[str, Any]:
    context = dict(inputs.get("context") or {})
    ip = context["ip"]
    alert_context = context.get("alert_context") or {}
    window_15 = context["window_15"]
    window_60 = context["window_60"]
    evidence_ips = _unique_strings(
        [ip] + list(alert_context.get("grouped_ips") or []),
        40,
    )
    evidence_ips = [value for value in evidence_ips if _normalized_ip(value)] or [ip]
    clauses = []
    for evidence_ip in evidence_ips:
        quoted_ip = evidence_ip.replace("'", "''")
        clauses.append(
            f"attacker = '{quoted_ip}' OR net.real_src_ip = '{quoted_ip}' OR net.src_ip = '{quoted_ip}'"
        )
    sql = "(" + ") OR (".join(clauses) + ")"
    context["evidence_ips"] = evidence_ips
    sources: dict[str, Any] = {}
    sources["monitor_15"] = _tool_call(
        tool,
        "tdp_threat_monitor_list",
        time_from=window_15["time_from"],
        time_to=window_15["time_to"],
        sql=sql,
        net_data_type=["attack", "risk", "action"],
        refresh_rate=-1,
        cur_page=1,
        page_size=100,
    )
    sources["logs_15"] = _collect_log_sample(
        tool,
        time_from=window_15["time_from"],
        time_to=window_15["time_to"],
        sql=sql,
    )
    if not sources["monitor_15"].get("ok") and sources["logs_15"].get("ok"):
        monitor_error = str(sources["monitor_15"].get("error") or "monitor endpoint unavailable")
        sources["monitor_15"] = {
            "ok": True,
            "tool": "tdp_threat_monitor_list",
            "duration_ms": sources["monitor_15"].get("duration_ms", 0),
            "data": {
                "coverage_source": "logs_15",
                "coverage_window": window_15,
                "reason": "TDP real-time monitor endpoint unavailable; raw log evidence used",
            },
            "error": "",
            "degraded": True,
            "fallback": "logs_15",
            "original_error": _clip_text(monitor_error, 300),
        }
    incident_keyword = str(alert_context.get("ioc") or ip).strip() if alert_context.get("aggregation_key") else ip
    sources["incidents_15"] = _tool_call(
        tool,
        "tdp_threat_intelligent_aggregation",
        action="incident_search",
        time_from=window_15["time_from"],
        time_to=window_15["time_to"],
        keyword=incident_keyword,
        cur_page=1,
        page_size=100,
        sort_by="last_time",
        sort_order="desc",
    )
    log_items = _items(sources["logs_15"].get("data"))
    incident_items = _items(sources["incidents_15"].get("data"))
    phase_text = " ".join(_unique_strings(_values(log_items, {"phase"}))).lower()
    needs_extended = (
        context.get("round_number") == 2
        or not log_items
        or not incident_items
        or not any(name in phase_text for name in ("exploit", "control", "post_exploit", "attack_out"))
    )
    if needs_extended:
        sources["logs_60"] = _collect_log_sample(
            tool,
            time_from=window_60["time_from"],
            time_to=window_60["time_to"],
            sql=sql,
        )
        sources["incidents_60"] = _tool_call(
            tool,
            "tdp_threat_intelligent_aggregation",
            action="incident_search",
            time_from=window_60["time_from"],
            time_to=window_60["time_to"],
            keyword=incident_keyword,
            cur_page=1,
            page_size=100,
            sort_by="last_time",
            sort_order="desc",
        )
    ip_obj = ipaddress.ip_address(ip)
    context_ioc = str(alert_context.get("ioc") or "").strip()
    grouped_domain_alert = alert_context.get("aggregation_type") == "domain_incident"
    resolver_domain_alert = (_is_public_dns_resolver(ip) or grouped_domain_alert) and _is_domain_name(context_ioc)
    if ip_obj.version == 4 and ip_obj.is_global and not resolver_domain_alert:
        sources["threat_intel"] = _tool_call(
            tool,
            "datang_tdp_ip_reputation",
            ip=ip,
            related_ips=_unique_strings(
                (context.get("alert_context") or {}).get("scan_campaign_source_ips") or [],
                99,
            ),
        )
    else:
        sources["threat_intel"] = {
            "ok": True,
            "tool": "datang_tdp_ip_reputation",
            "duration_ms": 0,
            "data": {
                "skipped": True,
                "reason": (
                    "public DNS resolver is shared infrastructure; domain IOC remains actionable"
                    if resolver_domain_alert else "only public IPv4 is queried"
                ),
            },
            "error": "",
        }
    all_incidents = incident_items + _items(sources.get("incidents_60", {}).get("data"))
    matching_incidents = [
        item for item in all_incidents
        if any(_contains_ip(item, evidence_ip) for evidence_ip in evidence_ips)
        or (context_ioc and context_ioc.lower() in json.dumps(item, ensure_ascii=False).lower())
    ]
    sources["incident_details"] = _collect_incident_details(
        tool,
        incidents=matching_incidents or all_incidents,
        context=context,
    )
    tool_errors = []
    enrichment_errors = []
    for name, item in sources.items():
        if not isinstance(item, dict) or item.get("ok") is not False:
            continue
        message = f"{name}: {item.get('error') or 'tool failed'}"
        if item.get("tool") in OPTIONAL_ENRICHMENT_TOOLS:
            enrichment_errors.append(message)
        else:
            tool_errors.append(message)
    evidence = {
        "workflow_version": WORKFLOW_VERSION,
        "fixed_steps": [
            "monitor_15_or_logs_15_fallback",
            "logs_15",
            "incidents_15",
            "logs_60_if_needed",
            "incident_details",
            "related_alert_pages",
            "script_ip_reputation",
        ],
        "extended_window_used": needs_extended,
        # Every tool result is already sanitized in _tool_call. Sanitizing the
        # assembled tree again would replace nested alert.net.http with the
        # depth sentinel before the rule engine can inspect packet evidence.
        "sources": sources,
        "tool_errors": tool_errors,
        "enrichment_errors": enrichment_errors,
    }
    _state_update(context, phase="rule_engine")
    return {"context": context, "evidence_bundle": evidence}


def _record_candidates(evidence: dict[str, Any], ips: str | list[str]) -> list[dict[str, Any]]:
    anchors = [ips] if isinstance(ips, str) else ips
    records: list[dict[str, Any]] = []
    for node in _dict_nodes(evidence.get("sources")):
        if any(_contains_ip(node, ip) for ip in anchors) and any(
            key in node for key in ("threat", "net", "time", "@timestamp", "reqs_line", "resp_line")
        ):
            records.append(node)
    unique: list[dict[str, Any]] = []
    seen: set[str] = set()
    for record in records:
        marker = json.dumps(record, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        if marker not in seen:
            seen.add(marker)
            unique.append(record)
    return unique[:100]


def _compact_record(record: dict[str, Any]) -> dict[str, Any]:
    threat = record.get("threat") if isinstance(record.get("threat"), dict) else {}
    net = record.get("net") if isinstance(record.get("net"), dict) else {}
    http = net.get("http") if isinstance(net.get("http"), dict) else {}
    tls = net.get("tls") if isinstance(net.get("tls"), dict) else {}
    ja3 = tls.get("ja3") if isinstance(tls.get("ja3"), dict) else {}
    path = (_traffic_paths([record], "") or [{}])[0]
    return _sanitize({
        "time": record.get("time") or record.get("@timestamp"),
        "flow_id": record.get("flow_id"),
        "attacker": record.get("attacker"),
        "direction": path.get("direction", "待确认"),
        "sensor_direction": path.get("sensor_direction") or _sensor_direction(record, net),
        "established": record.get("established"),
        "source_ip": path.get("source_ip"),
        "destination_ip": path.get("destination_ip"),
        "destination_port": path.get("destination_port"),
        "protocol": net.get("protocol") or record.get("protocol"),
        "threat": {
            "name": threat.get("name") or record.get("threat_name"),
            "type": threat.get("type"),
            "phase": threat.get("phase") or record.get("phase"),
            "result": threat.get("result"),
            "is_connected": threat.get("is_connected"),
            "confidence": threat.get("confidence"),
            "tags": threat.get("tags") or threat.get("tag"),
        },
        "request": {
            "line": _clip_text(record.get("reqs_line") or http.get("reqs_line") or http.get("request_line"), 400),
            "body": _clip_text(record.get("reqs_body") or http.get("reqs_body"), 600),
        },
        "response": {
            "line": _clip_text(record.get("resp_line") or http.get("resp_line") or http.get("response_line"), 400),
            "body": _clip_text(record.get("resp_body") or http.get("resp_body"), 600),
        },
        "ja3": ja3.get("hash") or tls.get("ja3_hash"),
        "hit_whitelist": record.get("hit_whitelist"),
        "ip_reputation": record.get("ip_reputation"),
        "ip_reputation_zh": record.get("ip_reputation_zh"),
    })


def _http_evidence(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for record in records:
        net = record.get("net") if isinstance(record.get("net"), dict) else {}
        flow = net.get("flow") if isinstance(net.get("flow"), dict) else {}
        http = net.get("http") if isinstance(net.get("http"), dict) else {}
        request_line = _clip_text(
            record.get("reqs_line") or http.get("reqs_line") or http.get("request_line"),
            600,
        )
        request_body = _clip_text(record.get("reqs_body") or http.get("reqs_body"), 1600)
        response_line = _clip_text(
            record.get("resp_line") or http.get("resp_line") or http.get("response_line"),
            600,
        )
        response_body = _clip_text(record.get("resp_body") or http.get("resp_body"), 1600)
        bytes_to_server = _max_nonnegative_int(
            record.get("bytes_toserver"), record.get("net.bytes_toserver"),
            record.get("net.flow_bytes_toserver"), record.get("net.flow.bytes_toserver"),
            net.get("bytes_toserver"), net.get("flow_bytes_toserver"), flow.get("bytes_toserver"),
        )
        bytes_to_client = _max_nonnegative_int(
            record.get("bytes_toclient"), record.get("net.bytes_toclient"),
            record.get("net.flow_bytes_toclient"), record.get("net.flow.bytes_toclient"),
            net.get("bytes_toclient"), net.get("flow_bytes_toclient"), flow.get("bytes_toclient"),
        )
        if not any((request_line, request_body, response_line, response_body)):
            continue
        paths = _traffic_paths([record], "")
        path = paths[0] if paths else {}
        marker = json.dumps(
            [request_line, request_body, response_line, response_body, record.get("flow_id")],
            ensure_ascii=False,
            separators=(",", ":"),
        )
        item = grouped.get(marker)
        alert_id = str(record.get("id") or record.get("alert_id") or "").strip()
        if item is not None:
            item["occurrences"] += 1
            item["bytes_to_server"] = max(item["bytes_to_server"], bytes_to_server)
            item["bytes_to_client"] = max(item["bytes_to_client"], bytes_to_client)
            if alert_id and alert_id not in item["alert_ids"]:
                item["alert_ids"].append(alert_id)
            continue
        request_available = bool(request_line or request_body)
        response_available = bool(response_line or response_body)
        grouped[marker] = {
            "alert_ids": [alert_id] if alert_id else [],
            "time": int(record.get("time") or 0),
            "flow_id": str(record.get("flow_id") or ""),
            "source_ip": str(path.get("source_ip") or ""),
            "destination_ip": str(path.get("destination_ip") or ""),
            "destination_port": str(path.get("destination_port") or ""),
            "request_line": request_line,
            "request_body": request_body,
            "response_line": response_line,
            "response_body": response_body,
            "request_status": "已获取" if request_available else "TDP原始告警未采集",
            "response_status": "已获取" if response_available else "TDP原始告警未采集",
            "bytes_to_server": bytes_to_server,
            "bytes_to_client": bytes_to_client,
            "occurrences": 1,
        }
        if len(grouped) >= 8:
            break
    return list(grouped.values())


def evaluate_rules(inputs: dict[str, Any]) -> dict[str, Any]:
    context = dict(inputs.get("context") or {})
    evidence = dict(inputs.get("evidence_bundle") or {})
    ip = context["ip"]
    alert_context = context.get("alert_context") or {}
    evidence_ips = _unique_strings(context.get("evidence_ips") or [ip], 40)
    ioc = str(alert_context.get("ioc") or "").strip()
    is_domain_ioc = bool(ioc and ioc != ip and _is_domain_name(ioc))
    grouped_domain_incident = alert_context.get("aggregation_type") == "domain_incident"
    records = _record_candidates(evidence, evidence_ips)
    traffic_paths = _traffic_paths(records, ip)
    resolver_response_paths = []
    if is_domain_ioc:
        for resolver_ip in evidence_ips:
            if _is_public_dns_resolver(resolver_ip) or grouped_domain_incident:
                resolver_response_paths.extend(_dns_query_paths(records, resolver_ip))
        resolver_response_paths = list({
            (item["source_ip"], item["destination_ip"], item.get("destination_port", "")): item
            for item in resolver_response_paths
        }.values())[:20]
    resolver_response_alert = bool(resolver_response_paths)
    if resolver_response_paths:
        traffic_paths = resolver_response_paths
    phases = _unique_strings(_values(records, {"phase"}))
    results = _unique_strings(_values(records, {"result"}))
    threat_names = _unique_strings(
        [alert_context.get("threat_name")]
        + [record.get("threat_name") for record in records]
        + [record.get("threat", {}).get("name") for record in records if isinstance(record.get("threat"), dict)]
    )
    internal_path_hosts = [
        endpoint
        for path in traffic_paths
        for endpoint in (path.get("source_ip", ""), path.get("destination_ip", ""))
        if _network_zone(endpoint) == "internal"
    ]
    targets = _unique_strings(
        internal_path_hosts
        + list(alert_context.get("grouped_targets") or [])
        + _values(records, {"machine", "victim", "host_ip"}),
        20,
    )
    target_ports = _unique_strings(_values(records, {"dest_port", "dst_port"}), 50)
    request_values = _unique_strings(_values(records, {"reqs_line", "reqs_body", "request", "payload"}), 30)
    response_values = _unique_strings(_values(records, {"resp_line", "resp_body", "response"}), 30)
    response_lines = _unique_strings(_values(records, {"resp_line", "response_line"}), 30)
    request_text = "\n".join(request_values).lower()
    response_text = "\n".join(response_values).lower()
    response_status_codes = [
        int(match.group(1))
        for line in response_lines
        if (match := re.search(r"HTTP/\d(?:\.\d)?\s+(\d{3})\b", line, re.I))
    ]
    all_responses_rejected = bool(response_status_codes) and all(
        400 <= code < 500 for code in response_status_codes
    )
    auth_gateway_redirect = bool(
        response_status_codes
        and all(300 <= code < 400 for code in response_status_codes)
        and re.search(r"atrust|sso|single[ -]?sign[ -]?on|check token fail|登录|login", response_text, re.I)
    )
    suspicious_request = any(
        marker in request_text
        for marker in (
            "../", "${jndi", "union select", " or '1'='1", ' or "1"="1',
            " or 1=1", "%27%20or%20", "cmd=", "powershell", "whoami",
            "wget ", "curl ", "<script", "php://",
        )
    )
    explicit_effect = any(
        marker in response_text
        for marker in ("uid=", "gid=", "root:x:0:0", "command executed", "systeminfo", "nt authority", "webshell created")
    )
    explicit_block = all_responses_rejected or auth_gateway_redirect or any(
        marker in response_text
        for marker in ("forbidden", "access denied", "request blocked", "attack blocked", "permission denied")
    )
    network_reachable = _has_truthy_field(records, {"established"})
    tdp_connected = _has_truthy_field(records, {"is_connected"})
    post_phase = any(str(phase).lower() in {"control", "post_exploit", "attack_out", "lateral"} for phase in phases)
    compromise_marker = _has_truthy_field(records, {"is_compromised", "is_webshell", "is_lateral", "is_attack_out"})
    allow_success = bool(suspicious_request and explicit_effect)
    allow_compromise = bool(compromise_marker and post_phase and (network_reachable or tdp_connected))
    scan_hint = any(re.search(r"扫描|scan|nmap|探测|scanner", name, re.I) for name in threat_names)
    phase_text = " ".join(phases).lower()
    threat_text = " ".join(threat_names).lower()
    exploit_name_hint = bool(re.search(r"exploit|漏洞|未授权|反序列化|文件读取|路径穿越|注入|rce|命令执行|/etc/passwd", threat_text, re.I))
    c2_hint = bool(re.search(r"control|c2|银狐|黑产|钓鱼|phishing|木马|病毒|远控|后门|恶意域名|僵尸网络|botnet|trojan|rat|dga", phase_text + " " + threat_text, re.I))
    explicit_exploit_phase = any(name in phase_text for name in ("exploit", "initial_access", "execution"))
    has_exploit = suspicious_request or exploit_name_hint or explicit_exploit_phase
    has_post_exploit = post_phase or compromise_marker
    phases_are_recon = bool(phases) and all(str(phase).lower() in {"recon", "scan", "discovery"} for phase in phases)
    recon_only = bool(
        scan_hint
        and not suspicious_request
        and not explicit_exploit_phase
        and not has_post_exploit
        and (phases_are_recon or not phases)
    )
    event_times = _integer_values(records, {"time"})
    dns_query_values = _unique_strings(
        _values(records, {"qname", "query_name", "dns_qname", "rrname", "query"}),
        50,
    )
    distinct_times = sorted(set(event_times))
    intervals = [right - left for left, right in zip(distinct_times, distinct_times[1:]) if right > left]
    periodic_flow_evidence = bool(
        len(intervals) >= 3
        and min(intervals) > 0
        and max(intervals) <= min(intervals) * 1.25
    )
    dns_tunnel_evidence = bool(dns_query_values and periodic_flow_evidence)
    same_second_burst = len(event_times) >= 2 and len(set(event_times)) == 1
    attack_count = max(len(records), int((context.get("alert_context") or {}).get("count") or 0))
    target_count = len(targets)
    campaign_source_count = int(alert_context.get("scan_campaign_source_count") or 0)
    campaign_event_count = int(alert_context.get("scan_campaign_event_count") or 0)
    campaign_target_count = int(alert_context.get("scan_campaign_target_count") or 0)
    campaign_same_target_source_count = int(alert_context.get("scan_campaign_same_target_source_count") or 0)
    campaign_window_seconds = int(alert_context.get("scan_campaign_window_seconds") or 0)
    campaign_source_ips = _unique_strings(
        [_normalized_ip(value) for value in (alert_context.get("scan_campaign_source_ips") or [])],
        20,
    )
    distributed_scan_campaign = bool(
        scan_hint
        and _truthy(alert_context.get("distributed_scan_campaign"))
        and 0 < campaign_window_seconds <= 900
        and (campaign_source_count >= 5 or campaign_same_target_source_count >= 3)
    )
    per_source_high_volume_scan = bool(
        scan_hint
        and (
            attack_count >= SCAN_RECORD_BLOCK_THRESHOLD
            or target_count >= 3
            or len(target_ports) >= 10
        )
    )
    high_volume_scan = per_source_high_volume_scan or distributed_scan_campaign
    intel_source = (evidence.get("sources") or {}).get("threat_intel") or {}
    intel_data = intel_source.get("data")
    threat_intel_available = bool(
        intel_source.get("ok")
        and isinstance(intel_data, dict)
        and not intel_data.get("skipped")
    )
    reputation = _reputation_profile(records, intel_data, alert_context)
    bad_reputation = reputation["bad_reputation"]
    strong_bad_reputation = reputation["strong_bad_reputation"]
    weak_risk_reputation = reputation["weak_risk_reputation"]
    cloud_host = reputation["cloud_host"]
    hit_whitelist = reputation["hit_whitelist"]
    trusted_infrastructure = reputation["trusted_infrastructure"]
    source_location = _source_location(evidence, intel_data, alert_context, ip)
    foreign_attack_source = bool(
        source_location["known"]
        and source_location["is_foreign"]
        and _network_zone(ip) == "external"
        and records
        and not trusted_infrastructure
    )
    outbound_seen = any(
        _sensor_direction(record, record.get("net") if isinstance(record.get("net"), dict) else {}) == "out"
        for record in records
    )
    outbound_hosts = _unique_strings(
        [path["source_ip"] for path in traffic_paths if path.get("direction") == "内到外"],
        20,
    )
    outbound_domain_alert = bool(
        is_domain_ioc
        and (c2_hint or resolver_response_alert or grouped_domain_incident)
        and (outbound_seen or outbound_hosts or resolver_response_alert or (grouped_domain_incident and records))
    )
    if allow_compromise:
        verdict = "主机失陷"
        attack_outcome = "成功"
        compromise_status = "已失陷"
    elif outbound_domain_alert:
        verdict = "恶意外联"
        attack_outcome = "尝试/未知"
        compromise_status = "无法确认"
    elif trusted_infrastructure and is_domain_ioc:
        # The alert may carry a malicious domain while the grouped IP is public
        # DNS/CDN infrastructure. Keep the domain actionable without attributing
        # the attack to, or blocking, the shared infrastructure address.
        verdict = "证据不足"
        attack_outcome = "尝试/未知" if records else "不适用"
        compromise_status = "无法确认" if post_phase else "未发现失陷"
    elif trusted_infrastructure and not records:
        verdict = "误报可能"
        attack_outcome = "不适用"
        compromise_status = "未发现失陷"
    elif recon_only:
        verdict = "疑似扫描"
        attack_outcome = "尝试/未知"
        compromise_status = "未发现失陷" if records else "无法确认"
    elif has_exploit or c2_hint:
        verdict = "外网攻击"
        attack_outcome = "成功" if allow_success else "失败" if has_exploit and explicit_block else "尝试/未知"
        compromise_status = "未发现失陷" if records and not post_phase else "无法确认"
    elif scan_hint:
        verdict = "疑似扫描"
        attack_outcome = "尝试/未知"
        compromise_status = "未发现失陷" if records else "无法确认"
    elif records:
        verdict = "外网攻击"
        attack_outcome = "尝试/未知"
        compromise_status = "未发现失陷" if not post_phase else "无法确认"
    else:
        verdict = "证据不足"
        attack_outcome = "尝试/未知"
        compromise_status = "无法确认"
    context_severity = _severity(alert_context.get("severity"))
    confidence = 30
    if records:
        confidence += 20
    if evidence.get("sources", {}).get("incident_details"):
        confidence += 10
    if request_values or response_values:
        confidence += 10
    if scan_hint:
        confidence += 10
    if bad_reputation or hit_whitelist:
        confidence += 5
    if source_location["known"]:
        confidence += 5
    confidence -= min(20, len(evidence.get("tool_errors") or []) * 5)
    confidence = max(15, min(90, confidence))
    if allow_compromise:
        ban_decision = "主机失陷"
        disposition = "立即隔离并排查受影响主机，同时在边界封禁攻击源；保全日志和报文证据。"
    elif outbound_domain_alert:
        ban_decision = "建议封禁"
        host_text = "、".join(outbound_hosts) if outbound_hosts else "相关内网主机"
        disposition = (
            f"在 DNS 安全策略、安全代理或出口防火墙的出站规则中阻断恶意域名 IOC {ioc}；"
            f"不要依据 TDP 聚合地址 {ip} 直接封禁公网 IP。核查发起外联的内网主机 {host_text} 的 DNS、进程和网络日志，"
            "确认 IOC 失效并完成人工复核后再解除阻断。"
        )
    elif trusted_infrastructure and is_domain_ioc:
        ban_decision = "建议封禁"
        disposition = f"仅阻断域名 IOC {ioc}：不要封禁可信基础设施 IP {ip}；在 DNS、代理或 WAF 临时阻断该域名 24-72 小时，并核查实际解析该域名的内网主机。"
    elif allow_success:
        ban_decision = "建议封禁"
        disposition = f"在边界临时封禁 {ip}，并核查受影响目标的应用、系统和安全日志；依据后续证据决定是否扩大主机处置。"
    elif trusted_infrastructure:
        ban_decision = "不建议封禁"
        disposition = "来源命中白名单、CDN 或可信基础设施，暂不封禁；核对告警字段归因与授权范围，确认误报后优化白名单。"
    elif foreign_attack_source and recon_only:
        ban_decision = "建议封禁"
        disposition = (
            f"攻击源 {ip} 归属地明确为境外（{source_location['display']}），且 TDP 已识别为扫描行为；"
            f"即使当前仅 {attack_count} 条记录，也建议在边界防火墙或 WAF 对该单一 IP 临时封禁或限速 24-72 小时。"
            "观察是否复发或更换代理源，不直接封禁整个运营商 ASN 或网段。"
        )
    elif foreign_attack_source and records:
        ban_decision = "建议封禁"
        disposition = (
            f"攻击源 {ip} 归属地明确为境外（{source_location['display']}），且已被 TDP 检出攻击行为；"
            "建议在边界对该单一 IP 临时封禁 24-72 小时并观察复发，不直接扩大到运营商 ASN 或网段。"
        )
    elif recon_only and (high_volume_scan or strong_bad_reputation):
        ban_decision = "建议封禁"
        if distributed_scan_campaign:
            scan_basis = (
                f"15 分钟内识别到同类分布式扫描活动（{campaign_source_count} 个源 IP、"
                f"{campaign_event_count} 条事件、{campaign_target_count} 个目标）"
            )
            disposition = (
                f"{scan_basis}，建议对本活动已观测源 IP（含 {ip}）临时封禁或限速 24-72 小时，"
                "并在 WAF/IPS 按扫描器特征和目标端口启用速率限制；不要直接封禁整个云厂商 ASN 或网段。"
            )
        else:
            scan_basis = (
                f"达到单源批量扫描阈值（{attack_count} 条记录、{target_count} 个目标、{len(target_ports)} 个目标端口）"
                if per_source_high_volume_scan
                else "命中明确恶意、黑名单或僵尸网络类强信誉"
            )
            disposition = f"{scan_basis}，建议在边界防火墙或 WAF 对 {ip} 临时封禁或限速 24-72 小时；观察是否复发或转向其他目标，当前不建议永久封禁。"
    elif recon_only and source_location["known"] and not source_location["is_foreign"]:
        ban_decision = "人工复核"
        disposition = (
            f"攻击源 {ip} 归属地已确认在境内（{source_location['display']}），当前仅 {attack_count} 条记录、"
            f"{target_count} 个目标、{len(target_ports)} 个目标端口，未达到自动封禁阈值且未命中强恶意信誉。"
            "建议人工复核该 IP 在近 24 小时内的同源告警、目标访问日志、请求特征和是否存在横向扩散；"
            "若确认持续扫描、命中多个目标或存在利用载荷，再升级为单 IP 临时封禁或限速 24-72 小时。"
        )
    elif recon_only:
        ban_decision = "不建议封禁"
        disposition = (
            f"当前仅 {attack_count} 条记录、{target_count} 个目标、{len(target_ports)} 个目标端口，且未命中明确恶意、黑名单或僵尸网络类强信誉，"
            f"暂不直接封禁 {ip}；保留观察并对扫描类流量限速，达到 {SCAN_RECORD_BLOCK_THRESHOLD} 条记录、3 个目标或 10 个目标端口任一阈值时升级为临时封禁。"
        )
    elif has_exploit:
        ban_decision = "建议封禁"
        disposition = f"在边界对 {ip} 临时封禁 24-72 小时并核查目标应用响应和系统日志；尚无失陷闭环，不按主机失陷处置，也不直接永久封禁。"
    elif c2_hint:
        ban_decision = "建议封禁"
        disposition = f"在边界对 {ip} 临时封禁 24-72 小时；重点核查目标主机的域名解析、异常外联与进程日志，未形成闭环前不判定主机失陷。"
    elif bad_reputation and attack_count >= 3:
        ban_decision = "建议封禁"
        disposition = f"攻击源存在负面信誉且重复触发，建议对 {ip} 临时封禁 24-72 小时并观察复发；不直接永久封禁。"
    else:
        ban_decision = "人工复核"
        disposition = "证据尚不足以自动决定封禁，请优先复核请求、响应和目标日志后再处置。"
    supporting = []
    if records:
        supporting.append(f"固定取证流程检出 {len(records)} 条与 {ip} 直接关联的记录")
    if threat_names:
        supporting.append("关联威胁名称: " + "、".join(threat_names[:8]))
    if phases:
        supporting.append("关联攻击阶段: " + "、".join(phases[:8]))
    if scan_hint:
        supporting.append(
            f"扫描画像: {attack_count} 条记录、{target_count or 0} 个目标、{len(target_ports)} 个目标端口"
            + ("，记录集中在同一秒" if same_second_burst else "")
        )
    if distributed_scan_campaign:
        supporting.append(
            f"分布式扫描活动: 15 分钟内并发扫描告警涉及 {campaign_source_count} 个源 IP、"
            f"{campaign_event_count} 条事件、{campaign_target_count} 个目标；已按活动总量而非单 IP 次数处置"
        )
    intel_summary = _threat_intel_summary(intel_data) if threat_intel_available else ""
    if intel_summary:
        supporting.append(intel_summary)
    if source_location["known"]:
        supporting.append(
            f"攻击源地理位置: {source_location['display']}"
            f"（{'境外' if source_location['is_foreign'] else '境内'}，来源={source_location['source']}）"
        )
    if foreign_attack_source:
        supporting.append("境外公网 IP 已触发 TDP 攻击或扫描告警，低频情况下仍按单 IP 临时封禁策略处置")
    elif recon_only and source_location["known"] and not source_location["is_foreign"] and ban_decision == "人工复核":
        supporting.append("境内低频扫描未达到自动封禁阈值，已转为人工复核而非直接放行或自动封禁")
    if strong_bad_reputation:
        supporting.append("攻击源命中明确恶意、黑名单或僵尸网络类强信誉，可作为临时封禁依据")
    elif weak_risk_reputation:
        supporting.append("攻击源仅命中 spam、scanner 或攻击者等弱风险标签，不单独作为封禁依据")
    if hit_whitelist:
        supporting.append("攻击源命中白名单或可信基础设施标签，自动处置已降级")
    if trusted_infrastructure and is_domain_ioc:
        supporting.append(f"告警携带域名 IOC {ioc}，处置对象已限定为域名，不包含可信基础设施 IP {ip}")
    if grouped_domain_incident:
        supporting.append(
            f"已将同一域名与威胁类型的 {int(alert_context.get('grouped_row_count') or len(evidence_ips))} 个重复来源聚合研判；"
            f"累计 {int(alert_context.get('count') or len(records))} 次检出，覆盖 {len(evidence_ips)} 个 DNS/网络节点"
        )
    if outbound_domain_alert:
        supporting.append(
            f"聚合来源属于 DNS/网络基础设施，当前入站包是内网 DNS 查询的响应，逻辑会话已还原为内到外；"
            f"恶意域名 IOC {ioc} 应在出站 DNS 规则阻断，不得封禁解析器 IP"
            if resolver_response_alert
            else f"TDP direction=out 表示内网资产向外联方向，恶意域名 IOC {ioc} 应在出站规则阻断"
        )
    if request_values or response_values:
        supporting.append("已分析可获取的请求、响应或脱敏报文摘要；原始大段 Base64 未写入结果")
    if traffic_paths:
        supporting.append(
            "流量路径: "
            + "；".join(
                f"{item['source_ip']} -> {item['destination_ip']} ({item['direction']})"
                for item in traffic_paths[:5]
            )
        )
    contradicting = []
    if not explicit_effect:
        contradicting.append("未发现请求载荷执行后产生的明确响应回显，不能仅凭状态码或 TDP success 判定攻击成功")
    if has_exploit and all_responses_rejected:
        contradicting.append(
            "已采集的 HTTP 响应全部为 4xx 拒绝状态（"
            + "、".join(str(code) for code in sorted(set(response_status_codes)))
            + "），本次利用未被目标正常处理，攻击结果判定为失败"
        )
    elif has_exploit and auth_gateway_redirect:
        contradicting.append("已采集的 HTTP 响应全部跳转到认证网关或登录页，本次未授权利用未到达目标应用，攻击结果判定为失败")
    if not allow_compromise:
        contradicting.append("未形成后渗透阶段、连接状态与失陷特征相互印证的证据闭环")
    if network_reachable and not tdp_connected:
        contradicting.append("established=true 仅说明 TCP 可达；threat.is_connected=0 表示 TDP 未判定恶意连接成立，两者语义不同并非数据矛盾")
    missing = list(evidence.get("tool_errors") or [])
    for error in evidence.get("enrichment_errors") or []:
        if "Beyond Daily Limitation" in str(error):
            missing.append("外部 IP 情报查询已达到当日额度；本次结论仅依据 TDP 本地证据，不影响固定方向与处置规则")
        else:
            missing.append("外部 IP 情报查询暂不可用；本次结论仅依据 TDP 本地证据，不影响固定方向与处置规则")
    if not source_location["known"] and _network_zone(ip) == "external":
        missing.append("微步与 TDP 本地证据均未返回可确认的攻击源国家/地区，本次不使用 IP 字段猜测地理位置")
    if request_values and not response_values:
        missing.append("TDP 原始告警已获取请求内容，但响应行和响应体为空，无法验证攻击效果")
    elif not request_values and not response_values:
        missing.append("TDP 原始告警的请求行、请求体、响应行和响应体均为空")
    elif response_values and not request_values:
        missing.append("TDP 原始告警已获取响应内容，但请求行和请求体为空")
    if not evidence.get("sources", {}).get("incident_details"):
        missing.append("未匹配到可展开详情的智能聚合事件")
    if context.get("ip_version") == 6:
        missing.append("IPv6 不使用仅支持 IPv4 的外部情报查询")
    if outbound_domain_alert and not request_values and not response_values:
        missing.append("缺少 DNS 查询、TLS SNI 或代理日志，尚不能确认域名外联是否建立及由哪个进程发起")
    summary = (
        f"固定工作流围绕 {ip} 完成 TDP 实时告警、原始日志和智能聚合交叉取证。"
        + (f"攻击源归属地为{source_location['display']}（{'境外' if source_location['is_foreign'] else '境内'}）。" if source_location["known"] else "攻击源地理位置暂无法确认。")
        + f"当前规则结论为{verdict}，攻击结果为{attack_outcome}，失陷状态为{compromise_status}。"
        + f"处置建议：{disposition}"
        + "本结果未执行任何封禁或设备状态修改。"
    )
    checkpoints = [
        disposition,
        f"核查 {('、'.join(outbound_hosts) if outbound_hosts else '相关内网主机')} 对 {ioc} 的 DNS 查询、TLS SNI、代理访问和发起进程。",
        "若发现连接建立、周期性心跳、下载执行或后续控制行为，立即升级为主机隔离与应急响应；仅有被阻断尝试时不直接判定主机失陷。",
    ] if outbound_domain_alert else [
        disposition,
        "核查受影响目标在告警时段的 TLS、Web、访问控制或业务日志，确认是否只有扫描探测。",
        "当前无失陷证据时不开展主机失陷处置；扫描告警不得仅凭 TCP 可达或 TDP success 推定攻击成功。",
    ] if scan_hint else [
        disposition,
        "人工复核关键请求与响应是否构成攻击效果闭环。",
        "人工确认目标主机是否存在后续外联、横向、持久化或命令执行行为。",
    ]
    http_evidence = _http_evidence(records)
    rule_result = {
        "verdict": verdict,
        "ban_decision": ban_decision,
        "action_scope": (
            "目标主机和源IP" if allow_compromise
            else "出站域名IOC" if outbound_domain_alert
            else "IOC域名" if trusted_infrastructure and is_domain_ioc
            else "源IP" if ban_decision == "建议封禁"
            else "人工复核" if ban_decision == "人工复核"
            else "无"
        ),
        "recommended_action": disposition,
        "confidence": confidence,
        "severity": context_severity,
        "attack_outcome": attack_outcome,
        "compromise_status": compromise_status,
        "summary": summary,
        "evidence": supporting + contradicting,
        "supporting_evidence": supporting,
        "contradicting_evidence": contradicting,
        "missing_information": _unique_strings(missing),
        "affected_targets": targets,
        "key_iocs": _unique_strings(
            ([ioc] if outbound_domain_alert else [ip, ioc])
            + (campaign_source_ips if distributed_scan_campaign else [])
        ),
        "human_checkpoints": checkpoints,
        "traffic_paths": traffic_paths,
        "http_evidence": http_evidence,
        "source_location": source_location,
    }
    model_bundle = {
        "context": context,
        "source_status": {
            name: {"ok": item.get("ok"), "error": item.get("error", "")}
            for name, item in (evidence.get("sources") or {}).items()
            if isinstance(item, dict) and "ok" in item
        },
        "related_records": [_compact_record(record) for record in records[:12]],
        "incident_details": [
            {
                "incident_id": item.get("incident_id"),
                "alert_ids": list(item.get("alert_ids") or [])[:12],
                "packet_alerts_truncated": bool(item.get("packet_alerts_truncated")),
            }
            for item in (evidence.get("sources") or {}).get("incident_details", [])[:3]
            if isinstance(item, dict)
        ],
        "features": {
            "record_count": len(records),
            "phases": phases,
            "tdp_results": results,
            "threat_names": threat_names,
            "has_request": bool(request_values),
            "has_response": bool(response_values),
            "suspicious_request": suspicious_request,
            "explicit_effect": explicit_effect,
            "explicit_block": explicit_block,
            "response_status_codes": response_status_codes,
            "all_responses_rejected": all_responses_rejected,
            "auth_gateway_redirect": auth_gateway_redirect,
            "network_reachable": network_reachable,
            "tdp_connected": tdp_connected,
            "post_phase": post_phase,
            "compromise_marker": compromise_marker,
            "scan_hint": scan_hint,
            "attack_count": attack_count,
            "target_count": target_count,
            "target_port_count": len(target_ports),
            "same_second_burst": same_second_burst,
            "per_source_high_volume_scan": per_source_high_volume_scan,
            "distributed_scan_campaign": distributed_scan_campaign,
            "scan_campaign_source_count": campaign_source_count,
            "scan_campaign_event_count": campaign_event_count,
            "scan_campaign_target_count": campaign_target_count,
            "scan_campaign_same_target_source_count": campaign_same_target_source_count,
            "scan_campaign_window_seconds": campaign_window_seconds,
            "scan_campaign_source_ips": campaign_source_ips,
            "bad_reputation": bad_reputation,
            "strong_bad_reputation": strong_bad_reputation,
            "weak_risk_reputation": weak_risk_reputation,
            "cloud_host": cloud_host,
            "hit_whitelist": hit_whitelist,
            "trusted_infrastructure": trusted_infrastructure,
            "ioc": ioc,
            "is_domain_ioc": is_domain_ioc,
            "recon_only": recon_only,
            "phases_are_recon": phases_are_recon,
            "explicit_exploit_phase": explicit_exploit_phase,
            "has_exploit": has_exploit,
            "exploit_name_hint": exploit_name_hint,
            "c2_hint": c2_hint,
            "has_post_exploit": has_post_exploit,
            "packet_evidence": bool(request_values or response_values),
            "dns_query_values": dns_query_values,
            "periodic_flow_evidence": periodic_flow_evidence,
            "dns_tunnel_evidence": dns_tunnel_evidence,
            "traffic_paths": traffic_paths,
            "outbound_domain_alert": outbound_domain_alert,
            "outbound_hosts": outbound_hosts,
            "resolver_response_alert": resolver_response_alert,
            "tool_errors": evidence.get("tool_errors") or [],
            "enrichment_errors": evidence.get("enrichment_errors") or [],
            "threat_intel_available": threat_intel_available,
            "source_location": source_location,
            "foreign_attack_source": foreign_attack_source,
        },
        "rule_result": rule_result,
        "hard_limits": {
            "allow_attack_success": allow_success,
            "allow_compromise": allow_compromise,
            "allow_dns_tunnel_attribution": dns_tunnel_evidence,
            "outbound_domain_alert": outbound_domain_alert,
            "lock_outbound_supporting_evidence": outbound_domain_alert,
            "lock_scan_result": recon_only,
            "locked_verdict": verdict,
            "locked_ban_decision": ban_decision,
            "locked_attack_outcome": attack_outcome,
            "disposition_summary": disposition,
            "has_request": bool(request_values),
            "has_response": bool(response_values),
            "threat_intel_available": threat_intel_available,
            "source_location": source_location,
            "foreign_attack_source": foreign_attack_source,
            "allowed_ips": _unique_strings(
                [ip]
                + [item.get("source_ip") for item in traffic_paths]
                + [item.get("destination_ip") for item in traffic_paths]
                + campaign_source_ips,
                50,
            ),
        },
        "first_judgement": context.get("first_judgement") or {},
    }
    _state_update(context, phase="model_analysis")
    return {
        "context": context,
        "evidence_bundle": evidence,
        "rule_result": rule_result,
        "model_bundle": model_bundle,
    }


def _extract_json(text: str) -> dict[str, Any] | None:
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", str(text or ""), flags=re.I).strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.I).strip()
    try:
        value = json.loads(cleaned)
        return value if isinstance(value, dict) else None
    except Exception:
        pass
    start = cleaned.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(cleaned)):
        char = cleaned[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                try:
                    value = json.loads(cleaned[start:index + 1])
                    return value if isinstance(value, dict) else None
                except Exception:
                    return None
    return None


def _compact_model_bundle(model_bundle: dict[str, Any]) -> dict[str, Any]:
    rule_result = dict(model_bundle.get("rule_result") or {})
    for field in ARRAY_FIELDS:
        rule_result[field] = list(rule_result.get(field) or [])[:6]
    compact_http = []
    for item in list(rule_result.get("http_evidence") or [])[:4]:
        if not isinstance(item, dict):
            continue
        compact_item = dict(item)
        compact_item["request_body"] = _clip_text(compact_item.get("request_body"), 400)
        compact_item["response_body"] = _clip_text(compact_item.get("response_body"), 400)
        compact_http.append(compact_item)
    rule_result["http_evidence"] = compact_http
    context = dict(model_bundle.get("context") or {})
    return {
        "context": {
            key: context.get(key)
            for key in ("ip", "ip_version", "alert_time", "round_number", "alert_context")
            if key in context
        },
        "source_status": model_bundle.get("source_status") or {},
        "related_records": list(model_bundle.get("related_records") or [])[:4],
        "features": model_bundle.get("features") or {},
        "rule_result": rule_result,
        "hard_limits": model_bundle.get("hard_limits") or {},
        "first_judgement": model_bundle.get("first_judgement") or {},
    }


def _model_error_summary(errors: list[str]) -> str:
    joined = "；".join(str(item) for item in errors)
    if re.search(r"504|gateway time-?out|超时", joined, re.I):
        return "上游模型响应超时，已使用固定规则结果"
    if re.search(r"422|invalid_request|请求参数", joined, re.I):
        return "上游模型拒绝原始请求，精简证据重试仍失败，已使用固定规则结果"
    if "模型未返回合法 JSON" in joined:
        return "模型未返回合法 JSON，精简证据重试仍失败，已使用固定规则结果"
    return _clip_text("模型调用失败，已使用固定规则结果: " + joined, 300)


def _foreign_ipv4s(text: Any, allowed_ips: list[str]) -> list[str]:
    allowed = {_normalized_ip(value) for value in allowed_ips}
    found = []
    for candidate in re.findall(r"(?<![\w:])(?:\d{1,3}\.){3}\d{1,3}(?![\w:])", str(text or "")):
        try:
            normalized = str(ipaddress.ip_address(candidate))
        except ValueError:
            continue
        if normalized not in allowed:
            found.append(normalized)
    return _unique_strings(found)


def analyze_with_model(inputs: dict[str, Any], llm: Any) -> dict[str, Any]:
    context = dict(inputs.get("context") or {})
    model_bundle = dict(inputs.get("model_bundle") or {})
    raw_output = ""
    model_result: dict[str, Any] = {}
    model_error = ""
    if context.get("model_enabled", True):
        prompt = """你是 TDP 网络侧告警证据分析器。Python 固定工作流已经完成取证、扫描强度/信誉/白名单分层和处置规则计算，你不得要求或调用任何工具。
只分析下方结构化证据，重点补充证据关联、反证和缺失信息。不得把 HTTP 200、established、is_connected、TDP result=success 或聚合成功计数单独作为攻击成功依据。established=true 只表示 TCP 可达，threat.is_connected=0 表示 TDP 未判定恶意连接成立，两者不是矛盾。没有命令执行、控制、外联、横向、持久化等闭环证据时不得判定主机失陷。
features.has_request、features.has_response 和 rule_result.http_evidence 是报文可用性的权威字段。has_request=true 时不得声称请求行或请求体均为空；has_response=false 时应准确写成“TDP 原始告警未采集响应内容”，不得连带声称请求也缺失。必须分析 http_evidence 中可见的攻击载荷，但不得凭请求载荷单独判定攻击成功。
TDP direction=out 表示失陷/外联方向；traffic_paths 已按真实 flow 字段归一化，内到外路径不得描述为外部 IP 入站攻击。rule_features.outbound_domain_alert=true 时，必须将事件描述为恶意域名外联尝试，处置只建议在 DNS、安全代理或出口防火墙的出站规则中阻断域名 IOC，并核查内网发起主机；不得建议封禁聚合公网 IP。
rule_features.resolver_response_alert=true 表示 TDP 捕获的是公共 DNS 解析器返回内网临时端口的响应包，逻辑会话方向已经还原为内到外；公共解析器不是攻击源，不得把解析器 IP 列为关键 IOC 或封禁对象。
rule_features.all_responses_rejected=true 表示全部可见 HTTP 响应均为 4xx；rule_features.auth_gateway_redirect=true 表示全部可见响应跳转到认证网关或登录页。没有其他攻击效果闭环时，这两类事件的 attack_outcome 必须为“失败”，不能写“尝试/未知”。
目的端口为 53 只说明流量可能使用 DNS，不等于 DNS 隧道。hard_limits.allow_dns_tunnel_attribution=false 时，任何字段都不得写“DNS 隧道”或同义结论；只有同时具备可核验的 DNS QNAME/载荷特征和稳定周期性流量证据时才允许提出该归因，并必须列出具体证据。
不得把多台主机访问同一地址描述为共同感染、集中化 C2 或典型家族模式；不得自行解释原始 sensor_direction 与归一化 traffic_paths 的差异。缺少相应证据时只能列为待核查假设。hard_limits.lock_outbound_supporting_evidence=true 时，不要扩写 evidence 或 supporting_evidence，模型只补充反证、缺失信息和人工核查点。
扫描类处置由 Python 阈值固定：单源扫描达到 3 条记录、3 个目标或 10 个目标端口任一阈值即建议临时封禁；低于阈值且仅有 spam/scanner/云主机等弱标签时不直接封禁。命中明确恶意、黑名单、僵尸网络强信誉同样建议临时封禁。hard_limits.lock_scan_result=true 时，不得改写规则摘要、支持证据或处置建议。
扫描强度必须同时评估单 IP 与跨 IP 活动。features.distributed_scan_campaign=true 表示 15 分钟内 Nmap、Zgrab、Friendly-Scanner 等并发扫描合计达到 5 个源 IP，或同一目标达到 3 个源 IP；即使代理池切换了 IP 或扫描器指纹且每个 IP 只出现一次，也按分布式扫描活动建议临时封禁已观测源 IP 并启用行为限速，不得因单 IP 低频而降级，也不得扩大封禁整个云厂商网段。
features.threat_intel_available=true 表示项目专用微步 IP 信誉 API 已成功返回；必须使用 rule_result.supporting_evidence 中的情报结论，不得再声称 ThreatBook、微步或外部 IP 情报不可用。
hard_limits.allow_attack_success=false 时 attack_outcome 禁止输出“成功”；hard_limits.allow_compromise=false 时 verdict 禁止输出“主机失陷”、compromise_status 禁止输出“已失陷”。
hard_limits.locked_verdict 非空时必须保持该 verdict；ban_decision 必须与 hard_limits.locked_ban_decision 完全一致，attack_outcome 必须与 hard_limits.locked_attack_outcome 完全一致。处置说明必须保留 hard_limits.disposition_summary 的控制点、核查对象和解除条件，不得退化成空泛的“人工复核”。模型只补充理由，不得升级或降级 Python 规则确定的处置等级。
当前项目仅接入一台 TDP，资产、EDR、身份数据源明确不在本阶段范围内。不得把 EDR、用户身份、资产元数据缺失重复写入 missing_information；可在 human_checkpoints 中保留必要的人工主机核查。source_status 中的可选外部情报失败只允许表述一次，不得重复扩写。
只输出一个 JSON 对象，不要 Markdown：
{"verdict":"外网攻击|恶意外联|疑似扫描|证据不足|误报可能|主机失陷","ban_decision":"建议封禁|不建议封禁|人工复核|主机失陷","confidence":0,"severity":"信息|低|中|高|严重|未知","attack_outcome":"成功|失败|尝试/未知|不适用","compromise_status":"已失陷|未发现失陷|无法确认","summary":"","evidence":[],"supporting_evidence":[],"contradicting_evidence":[],"missing_information":[],"affected_targets":[],"key_iocs":[],"human_checkpoints":[]}
证据包：
""" + json.dumps(model_bundle, ensure_ascii=False, separators=(",", ":"))
        attempt_errors: list[str] = []
        for attempt, attempt_prompt in enumerate((
            prompt,
            prompt.rsplit("证据包：\n", 1)[0]
            + "证据包：\n"
            + json.dumps(_compact_model_bundle(model_bundle), ensure_ascii=False, separators=(",", ":")),
        )):
            try:
                raw_output = str(llm.ask(
                    attempt_prompt, temperature=0.1, timeout_s=240, max_retries=0
                ) or "")
                parsed = _extract_json(raw_output)
                if parsed is not None:
                    model_result = parsed
                    break
                attempt_errors.append("模型未返回合法 JSON")
            except Exception as exc:
                attempt_errors.append(_clip_text(f"{type(exc).__name__}: {exc}", 300))
            if attempt == 0 and not re.search(
                r"422|invalid_request|请求参数|模型未返回合法 JSON",
                attempt_errors[-1],
                re.I,
            ):
                break
        if not model_result:
            model_error = _model_error_summary(attempt_errors)
    else:
        model_error = "模型分析按测试输入关闭，使用规则引擎结果"
    _state_update(context, phase="finalizing")
    return {
        "context": context,
        "evidence_bundle": inputs.get("evidence_bundle") or {},
        "rule_result": inputs.get("rule_result") or {},
        "model_bundle": model_bundle,
        "model_result": _sanitize(model_result),
        "model_raw_output": _clip_text(raw_output, 50000),
        "model_error": model_error,
    }


def _validated_result(value: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    result = dict(fallback)
    if value.get("verdict") in VALID_VERDICTS:
        result["verdict"] = value["verdict"]
    if value.get("ban_decision") in VALID_DECISIONS:
        result["ban_decision"] = value["ban_decision"]
    if value.get("severity") in VALID_SEVERITIES:
        result["severity"] = value["severity"]
    if value.get("attack_outcome") in VALID_ATTACK_OUTCOMES:
        result["attack_outcome"] = value["attack_outcome"]
    if value.get("compromise_status") in VALID_COMPROMISE_STATUSES:
        result["compromise_status"] = value["compromise_status"]
    confidence = value.get("confidence")
    if isinstance(confidence, (int, float)) and not isinstance(confidence, bool):
        result["confidence"] = max(0, min(100, int(confidence)))
    summary = value.get("summary")
    if isinstance(summary, str) and summary.strip():
        result["summary"] = _clip_text(summary.strip(), 5000)
    for field in ARRAY_FIELDS:
        items = value.get(field)
        if isinstance(items, list):
            result[field] = _unique_strings(
                [_clip_text(item, 1200) for item in items if isinstance(item, str)],
                50,
            )
        else:
            result[field] = list(result.get(field) or [])
    return result


def finalize(inputs: dict[str, Any]) -> dict[str, Any]:
    context = dict(inputs.get("context") or {})
    rule_result = dict(inputs.get("rule_result") or {})
    model_result = dict(inputs.get("model_result") or {})
    model_bundle = dict(inputs.get("model_bundle") or {})
    hard_limits = dict(model_bundle.get("hard_limits") or {})
    result = _validated_result(model_result, rule_result)
    result["http_evidence"] = list(rule_result.get("http_evidence") or [])
    result["source_location"] = dict(rule_result.get("source_location") or {})
    guards: list[str] = []
    if not hard_limits.get("allow_dns_tunnel_attribution"):
        removed_dns_tunnel_claim = False
        if DNS_TUNNEL_PATTERN.search(str(result.get("summary") or "")):
            result["summary"] = rule_result.get("summary", "")
            removed_dns_tunnel_claim = True
        for field in ARRAY_FIELDS:
            items = list(result.get(field) or [])
            filtered = [item for item in items if not DNS_TUNNEL_PATTERN.search(str(item))]
            if len(filtered) != len(items):
                result[field] = filtered
                removed_dns_tunnel_claim = True
        if removed_dns_tunnel_claim:
            guards.append("固定规则已移除仅凭 53 端口作出的无证据通道归因")
    locked_verdict = str(hard_limits.get("locked_verdict") or "")
    if locked_verdict and result.get("verdict") != locked_verdict:
        result["verdict"] = locked_verdict
        guards.append("固定规则已保持扫描类事件的结论分类")
    locked_decision = str(hard_limits.get("locked_ban_decision") or rule_result.get("ban_decision") or "")
    if locked_decision in VALID_DECISIONS and result.get("ban_decision") != locked_decision:
        result["ban_decision"] = locked_decision
        guards.append("固定规则已恢复基于扫描强度、信誉和白名单计算的处置建议")
    if not hard_limits.get("allow_attack_success") and result.get("attack_outcome") == "成功":
        result["attack_outcome"] = rule_result.get("attack_outcome", "尝试/未知")
        guards.append("硬规则已阻止缺少攻击效果闭环的“攻击成功”结论")
    locked_attack_outcome = str(hard_limits.get("locked_attack_outcome") or "")
    if locked_attack_outcome in VALID_ATTACK_OUTCOMES and result.get("attack_outcome") != locked_attack_outcome:
        result["attack_outcome"] = locked_attack_outcome
        guards.append("固定规则已保持基于请求响应闭环计算的攻击结果")
    if not hard_limits.get("allow_compromise"):
        if result.get("verdict") == "主机失陷":
            result["verdict"] = rule_result.get("verdict", "证据不足")
            guards.append("硬规则已阻止缺少后渗透闭环的“主机失陷”结论")
        if result.get("compromise_status") == "已失陷":
            result["compromise_status"] = rule_result.get("compromise_status", "无法确认")
            if "硬规则已阻止缺少后渗透闭环的“主机失陷”结论" not in guards:
                guards.append("硬规则已阻止缺少后渗透闭环的“主机失陷”结论")
    foreign_summary_ips = _foreign_ipv4s(
        result.get("summary"), list(hard_limits.get("allowed_ips") or [])
    )
    if foreign_summary_ips:
        result["summary"] = rule_result.get("summary", "")
        guards.append("固定规则已移除摘要中未被流量路径证实的 IP")
    if hard_limits.get("has_request"):
        inaccurate_missing = re.compile(r"(?:请求.*响应|响应.*请求).*(?:均为空|都为空|全部为空|均缺失|都缺失)")
        items = list(result.get("missing_information") or [])
        filtered = [item for item in items if not inaccurate_missing.search(str(item))]
        if len(filtered) != len(items):
            result["missing_information"] = filtered
            guards.append("固定规则已移除与原始请求包相冲突的缺失信息")
    if hard_limits.get("outbound_domain_alert"):
        if result.get("summary") != rule_result.get("summary"):
            guards.append("固定规则已移除可能混淆内外方向或误封公网 IP 的模型处置描述")
        result["verdict"] = rule_result.get("verdict", "恶意外联")
        result["ban_decision"] = rule_result.get("ban_decision", "建议封禁")
        result["action_scope"] = rule_result.get("action_scope", "出站域名IOC")
        result["recommended_action"] = rule_result.get("recommended_action", "")
        result["summary"] = rule_result.get("summary", "")
    if hard_limits.get("lock_scan_result"):
        result["verdict"] = rule_result.get("verdict", "疑似扫描")
        result["ban_decision"] = rule_result.get("ban_decision", "不建议封禁")
        result["action_scope"] = rule_result.get("action_scope", "无")
        result["recommended_action"] = rule_result.get("recommended_action", "")
        result["summary"] = rule_result.get("summary", "")
    model_error = str(inputs.get("model_error") or "")
    if model_error:
        result["missing_information"] = _unique_strings(
            list(result.get("missing_information") or []) + ["模型分析降级: " + model_error]
        )
        result["confidence"] = min(int(result.get("confidence") or 0), int(rule_result.get("confidence") or 50))
    intel_missing_removed = False
    for field in ARRAY_FIELDS:
        model_items = list(result.get(field) or [])
        if (
            hard_limits.get("lock_outbound_supporting_evidence")
            or hard_limits.get("lock_scan_result")
        ) and field in {"evidence", "supporting_evidence"}:
            model_items = []
        if field == "missing_information":
            before_filter = len(model_items)
            model_items = [
                item for item in model_items
                if not OUT_OF_SCOPE_MISSING_PATTERN.search(str(item))
                and not OPTIONAL_INTEL_MISSING_PATTERN.search(str(item))
            ]
            intel_missing_removed = bool(
                hard_limits.get("threat_intel_available")
                and len(model_items) != before_filter
            )
        if field == "key_iocs":
            model_items = []
        if field in {"evidence", "contradicting_evidence", "affected_targets"}:
            model_items = [
                item for item in model_items
                if not _foreign_ipv4s(item, list(hard_limits.get("allowed_ips") or []))
            ]
        result[field] = _unique_strings(
            list(rule_result.get(field) or []) + model_items,
            50,
        )
    if intel_missing_removed:
        guards.append("固定规则已移除与微步 IP 信誉成功响应相冲突的情报缺失描述")
    if guards:
        result["contradicting_evidence"] = _unique_strings(
            list(result.get("contradicting_evidence") or []) + guards
        )
        result["human_checkpoints"] = _unique_strings(
            list(result.get("human_checkpoints") or []) + ["人工复核模型结论与固定硬规则发生冲突的原因"]
        )
    summary = str(result.get("summary") or "").strip()
    disposition_summary = str(hard_limits.get("disposition_summary") or "").strip()
    if disposition_summary and disposition_summary not in summary:
        summary = summary.rstrip("。") + f"。固定处置策略：{disposition_summary}"
    if "未执行任何封禁或设备状态修改" not in summary:
        summary = summary.rstrip("。") + "。本工作流未执行任何封禁或设备状态修改。"
    result["summary"] = summary
    result["raw_output"] = str(inputs.get("model_raw_output") or "")[:50000]
    result["workflow_id"] = WORKFLOW_ID
    result["workflow_version"] = WORKFLOW_VERSION
    result["model_used"] = not bool(model_error)
    _state_update(context, phase="done", status="done", result=result)
    return {
        "task_key": context.get("task_key", ""),
        "workflow_id": WORKFLOW_ID,
        "workflow_version": WORKFLOW_VERSION,
        "judgement": result,
        "model_used": result["model_used"],
        "guardrails_applied": guards,
    }
