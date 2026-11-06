from __future__ import annotations

import ipaddress
import hashlib
import math
import re
import time
from typing import Any


def attacker_ip(item: dict[str, Any]) -> str:
    net = item.get("net") if isinstance(item.get("net"), dict) else {}
    return str(item.get("attacker") or net.get("real_src_ip") or net.get("src_ip") or "").strip()


def _valid_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (str, int, float)):
        return str(value).strip()
    if isinstance(value, list):
        return " / ".join(part for item in value if (part := _text(item)))
    if isinstance(value, dict):
        for key in ("name", "label", "value", "level", "result"):
            if key in value and (part := _text(value.get(key))):
                return part
    return ""


def _latest_event_fields(item: dict[str, Any], attacker: str) -> dict[str, Any]:
    threat = item.get("threat") if isinstance(item.get("threat"), dict) else {}
    net = item.get("net") if isinstance(item.get("net"), dict) else {}
    fields: dict[str, Any] = {
        "threat_type": _text(threat.get("level") or threat.get("result") or item.get("threat.level") or item.get("type")),
        "ioc": _text(threat.get("ioc") or item.get("threat.ioc")) or attacker,
        "threat_name": _text(threat.get("name") or item.get("threat.name") or item.get("threat_name")),
        "src_ip": _text(net.get("real_src_ip") or net.get("src_ip") or item.get("net.real_src_ip") or item.get("net.src_ip")) or attacker,
        "dst_ip": _text(net.get("dest_ip") or net.get("dst_ip") or item.get("net.dest_ip") or item.get("net.dst_ip")),
        "dst_port": _text(net.get("dest_port") or net.get("dst_port") or item.get("net.dest_port") or item.get("net.dst_port")),
        "protocol": _text(net.get("protocol") or item.get("net.protocol") or item.get("protocol")),
        "sensor_direction": _text(
            net.get("direction")
            or item.get("net.direction")
            or item.get("direction")
            or item.get("threat_direction")
        ).lower(),
        "severity": _text(
            threat.get("severity")
            or threat.get("risk_level")
            or threat.get("grade")
            or item.get("threat.severity")
            or item.get("threat.risk_level")
            or item.get("threat.grade")
            or item.get("severity")
            or item.get("risk_level")
        ),
    }
    for key in ("geo_data", "src_ip_geo_data"):
        if isinstance(item.get(key), dict) and item[key]:
            fields[key] = dict(item[key])
    return fields


def _stable_key(prefix: str, *parts: Any) -> str:
    identity = "\x1f".join(" ".join(str(part or "").strip().lower().split()) for part in parts)
    return f"{prefix}-{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:24]}"


def _normalized_domain(value: Any) -> str:
    domain = str(value or "").strip().rstrip(".").lower()
    if not re.fullmatch(r"(?=.{4,253}$)(?:[a-z0-9-]+\.)+[a-z]{2,63}", domain):
        return ""
    return domain


def aggregate_attackers(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    for event in events:
        ip = attacker_ip(event)
        if not _valid_ip(ip):
            continue
        fields = _latest_event_fields(event, ip)
        identity = (
            ip,
            str(fields.get("ioc") or ip).strip().lower(),
            str(fields.get("threat_type") or "").strip().lower(),
            str(fields.get("threat_name") or "").strip().lower(),
        )
        event_time = int(event.get("time") or 0)
        row = grouped.setdefault(
            identity,
            {
                "ip": ip,
                "count": 0,
                "first_time": 0,
                "last_time": 0,
                "is_cdn": False,
                "is_exit": False,
                **fields,
            },
        )
        row["count"] += 1
        if event_time:
            row["first_time"] = event_time if not row["first_time"] else min(row["first_time"], event_time)
            if event_time >= row["last_time"]:
                row.update(fields)
            row["last_time"] = max(row["last_time"], event_time)
    total = sum(row["count"] for row in grouped.values())
    rows = list(grouped.values())
    for row in rows:
        row["percent"] = round(row["count"] / total * 100, 3) if total else 0.0
        row["row_key"] = _stable_key(
            "alert", row.get("ip"), row.get("ioc"), row.get("threat_type"), row.get("threat_name")
        )
    rows.sort(key=lambda row: (-int(row["last_time"]), str(row["ip"])))
    return rows


def aggregate_domain_alerts(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Collapse the same domain threat seen through multiple DNS/network nodes."""
    grouped: dict[tuple[str, str, str, str], list[dict[str, Any]]] = {}
    passthrough: list[dict[str, Any]] = []
    for row in rows:
        domain = _normalized_domain(row.get("ioc"))
        threat_name = str(row.get("threat_name") or "").strip()
        if not domain or not threat_name:
            passthrough.append(row)
            continue
        key = (
            domain,
            threat_name.lower(),
            str(row.get("threat_type") or "").strip().lower(),
            str(row.get("sensor_direction") or "unknown").strip().lower(),
        )
        grouped.setdefault(key, []).append(row)

    merged = list(passthrough)
    for key, members in grouped.items():
        if len(members) == 1:
            merged.append(members[0])
            continue
        latest = max(members, key=lambda item: (int(item.get("last_time") or 0), str(item.get("ip") or "")))
        result = dict(latest)
        grouped_ips = sorted({str(item.get("ip") or "") for item in members if item.get("ip")})
        grouped_targets = sorted({str(item.get("dst_ip") or "") for item in members if item.get("dst_ip")})
        grouped_ports = sorted({str(item.get("dst_port") or "") for item in members if item.get("dst_port")})
        representative_ip = grouped_ips[0]
        aggregation_key = "domain:" + "|".join(key)
        result.update({
            "ip": representative_ip,
            "src_ip": representative_ip,
            "ioc": key[0],
            "count": sum(int(item.get("count") or 0) for item in members),
            "percent": round(sum(float(item.get("percent") or 0) for item in members), 3),
            "first_time": min((int(item.get("first_time") or 0) for item in members), default=0),
            "last_time": max((int(item.get("last_time") or 0) for item in members), default=0),
            "aggregation_type": "domain_incident",
            "aggregation_key": aggregation_key,
            "row_key": _stable_key("domain", aggregation_key),
            "grouped_row_count": len(members),
            "grouped_ips": grouped_ips,
            "grouped_targets": grouped_targets,
            "grouped_ports": grouped_ports,
        })
        merged.append(result)

    merged.sort(key=lambda row: (-int(row.get("last_time") or 0), str(row.get("row_key") or row.get("ip") or "")))
    return merged


def _scan_family(row: dict[str, Any]) -> str:
    name = str(row.get("threat_name") or "").strip().lower()
    if not re.search(r"扫描|scan|zgrab|nmap|masscan|探测|侦查", name, re.I):
        return ""
    # Proxy pools can rotate both source IPs and scanner fingerprints.
    return "network_scan"


def annotate_scan_campaigns(
    rows: list[dict[str, Any]],
    *,
    window_seconds: int = 900,
    source_threshold: int = 5,
    same_target_threshold: int = 3,
) -> list[dict[str, Any]]:
    scan_rows = [(row, _scan_family(row)) for row in rows]
    for row, family in scan_rows:
        row["distributed_scan_campaign"] = False
        if not family:
            continue
        anchor = int(row.get("last_time") or row.get("first_time") or 0)
        peers = [
            candidate
            for candidate, candidate_family in scan_rows
            if candidate_family == family
            and abs(int(candidate.get("last_time") or candidate.get("first_time") or 0) - anchor) <= window_seconds
        ]
        source_ips = sorted({str(item.get("ip") or "") for item in peers if item.get("ip")})
        target = str(row.get("dst_ip") or "")
        same_target_sources = sorted({
            str(item.get("ip") or "")
            for item in peers
            if target and str(item.get("dst_ip") or "") == target and item.get("ip")
        })
        distributed = len(source_ips) >= source_threshold or len(same_target_sources) >= same_target_threshold
        row.update({
            "distributed_scan_campaign": distributed,
            "scan_campaign_family": family,
            "scan_campaign_source_count": len(source_ips),
            "scan_campaign_event_count": sum(int(item.get("count") or 0) for item in peers),
            "scan_campaign_target_count": len({str(item.get("dst_ip")) for item in peers if item.get("dst_ip")}),
            "scan_campaign_same_target_source_count": len(same_target_sources),
            "scan_campaign_window_seconds": window_seconds,
            "scan_campaign_start_time": min((int(item.get("first_time") or 0) for item in peers), default=0),
            "scan_campaign_end_time": max((int(item.get("last_time") or 0) for item in peers), default=0),
            "scan_campaign_source_ips": source_ips[:20],
        })
    return rows


def _step_seconds(span: int, target_points: int) -> int:
    raw = max(1, math.ceil(span / max(1, target_points)))
    return max(60, math.ceil(raw / 60) * 60)


def build_trend(
    events: list[dict[str, Any]],
    start_time: int,
    end_time: int,
    *,
    target_points: int = 48,
) -> dict[str, Any]:
    start_time = int(start_time)
    end_time = int(end_time)
    if end_time <= start_time:
        raise ValueError("end_time must be greater than start_time")
    step = _step_seconds(end_time - start_time, target_points)
    points = max(1, math.ceil((end_time - start_time) / step))
    values = [0] * points
    for event in events:
        event_time = int(event.get("time") or 0)
        if event_time < start_time or event_time > end_time:
            continue
        index = min(points - 1, max(0, (event_time - start_time) // step))
        values[index] += 1
    use_date = end_time - start_time > 86400
    timestamps = [start_time + index * step for index in range(points)]
    labels = [
        time.strftime("%m-%d %H:%M" if use_date else "%H:%M", time.localtime(ts))
        for ts in timestamps
    ]
    return {
        "labels": labels,
        "timestamps": timestamps,
        "tdp": values,
        "total": list(values),
        "step_seconds": step,
        "summary": {"tdp": sum(values), "total": sum(values), "points": points},
    }
