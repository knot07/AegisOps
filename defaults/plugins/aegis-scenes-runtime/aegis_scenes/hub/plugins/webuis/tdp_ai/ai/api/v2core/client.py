from __future__ import annotations

import base64
import hashlib
import hmac
import json
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

from .config import TdpConnection


ATTACK_SQL = "(threat.level = 'attack') AND (packet_direction IN ('in'))"
DEFAULT_COLUMNS = [
    {"label": "类型", "value": ["threat.level", "threat.result"]},
    {"label": "日期", "value": "time"},
    {"label": "源", "value": ["net.src_ip", "net.real_src_ip", "net.src_port", "assets"]},
    {"label": "目的", "value": ["net.dest_ip", "net.dest_port", "dest_assets"]},
    {"label": "协议", "value": ["net.type", "net.http.method", "net.http.status"]},
    {"label": "URL或域名", "value": "data"},
    {"label": "威胁名称", "value": "threat.name"},
    {"label": "ioc", "value": "threat.ioc"},
    {"label": "严重级别", "value": ["threat.severity", "threat.risk_level", "threat.grade"]},
    {
        "label": "源IP地理位置",
        "value": [
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
        ],
    },
]


class TdpClientError(RuntimeError):
    pass


class IncompleteResultError(TdpClientError):
    pass


Transport = Callable[[dict[str, Any]], dict[str, Any]]


class TdpClient:
    def __init__(
        self,
        connection: TdpConnection,
        *,
        transport: Transport | None = None,
        max_rows: int = 100000,
        min_slice_seconds: int = 30,
        max_slices: int = 512,
    ) -> None:
        self.connection = connection
        self.transport = transport or self._http_transport
        self.max_rows = max(1, int(max_rows))
        self.min_slice_seconds = max(1, int(min_slice_seconds))
        self.max_slices = max(1, int(max_slices))

    def _sign(self, timestamp: int) -> str:
        digest = hmac.new(
            self.connection.secret.encode("utf-8"),
            f"{self.connection.api_key}{timestamp}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

    def _http_transport(self, body: dict[str, Any]) -> dict[str, Any]:
        timestamp = int(time.time())
        query = urllib.parse.urlencode(
            {
                "api_key": self.connection.api_key,
                "auth_timestamp": timestamp,
                "sign": self._sign(timestamp),
            }
        )
        url = f"{self.connection.base_url}/api/v1/log/searchBySql?{query}"
        request = urllib.request.Request(
            url,
            data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json;charset=UTF-8", "Accept": "application/json"},
            method="POST",
        )
        handlers: list[Any] = []
        if self.connection.proxy:
            handlers.append(
                urllib.request.ProxyHandler(
                    {"http": self.connection.proxy, "https": self.connection.proxy}
                )
            )
        else:
            handlers.append(urllib.request.ProxyHandler({}))
        context = ssl.create_default_context()
        if not self.connection.verify_ssl:
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
        handlers.append(urllib.request.HTTPSHandler(context=context))
        opener = urllib.request.build_opener(*handlers)
        try:
            with opener.open(request, timeout=self.connection.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise TdpClientError(f"TDP HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise TdpClientError(f"TDP connection failed: {exc.reason}") from exc

    @staticmethod
    def _extract(payload: dict[str, Any]) -> tuple[list[dict[str, Any]], int]:
        if not isinstance(payload, dict):
            raise TdpClientError("TDP returned a non-object response")
        response_code = payload.get("response_code")
        if response_code not in (None, 0, 200):
            raise TdpClientError(
                str(payload.get("verbose_msg") or payload.get("message") or response_code)
            )
        result = payload.get("data", payload)
        if isinstance(result, str):
            result = json.loads(result)
        if isinstance(result, list):
            return [item for item in result if isinstance(item, dict)], len(result)
        if not isinstance(result, dict):
            raise TdpClientError("TDP returned an unsupported data shape")
        rows = result.get("data", result.get("items", []))
        rows = rows if isinstance(rows, list) else []
        normalized = [item for item in rows if isinstance(item, dict)]
        total = int(result.get("total") or len(normalized))
        return normalized, total

    def query_window(self, start_time: int, end_time: int) -> tuple[list[dict[str, Any]], int]:
        if int(end_time) <= int(start_time):
            raise ValueError("end_time must be greater than start_time")
        payload = {
            "time_from": int(start_time),
            "time_to": int(end_time),
            "sql": ATTACK_SQL,
            "net_data_type": ["attack"],
            "columns": DEFAULT_COLUMNS,
            "size": self.max_rows,
        }
        return self._extract(self.transport(payload))

    def fetch_complete(self, start_time: int, end_time: int) -> list[dict[str, Any]]:
        slices = 0

        def fetch(left: int, right: int) -> list[dict[str, Any]]:
            nonlocal slices
            slices += 1
            if slices > self.max_slices:
                raise IncompleteResultError("TDP time slicing exceeded max_slices")
            rows, total = self.query_window(left, right)
            if total <= len(rows):
                return rows
            if right - left <= self.min_slice_seconds:
                raise IncompleteResultError(
                    f"TDP result incomplete at minimum slice: {left}-{right}, total={total}, rows={len(rows)}"
                )
            midpoint = left + (right - left) // 2
            return fetch(left, midpoint) + fetch(midpoint + 1, right)

        unique: dict[str, dict[str, Any]] = {}
        for item in fetch(int(start_time), int(end_time)):
            event_id = str(item.get("id") or "").strip()
            if not event_id:
                canonical = json.dumps(item, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                event_id = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
            unique[event_id] = item
        return sorted(
            unique.values(),
            key=lambda item: (int(item.get("time") or 0), str(item.get("id") or "")),
            reverse=True,
        )
