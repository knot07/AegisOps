from __future__ import annotations

import math
import time
from typing import Any

from .aggregation import aggregate_attackers, aggregate_domain_alerts, annotate_scan_campaigns, build_trend
from .client import TdpClient
from .storage import NativeStore


class NativeTdpService:
    def __init__(self, client: TdpClient, store: NativeStore) -> None:
        self.client = client
        self.store = store

    @staticmethod
    def range_key(start_time: int, end_time: int) -> str:
        return f"{int(start_time)}:{int(end_time)}"

    def dashboard_query(
        self,
        *,
        start_time: int,
        end_time: int,
        page: int = 1,
        page_size: int = 10,
    ) -> dict[str, Any]:
        started = time.time()
        start_time = int(start_time)
        end_time = int(end_time)
        page = max(1, int(page))
        page_size = max(1, min(1000, int(page_size)))
        events = self.client.fetch_complete(start_time, end_time)
        summaries = annotate_scan_campaigns(aggregate_domain_alerts(aggregate_attackers(events)))
        trend = build_trend(events, start_time, end_time)
        key = self.range_key(start_time, end_time)
        self.store.replace_summary(key, summaries)
        self.store.replace_buckets(trend)
        rows, total = self.store.list_summary(key, page=page, page_size=page_size)
        pages = max(1, math.ceil(total / page_size))
        return {
            "ok": True,
            "backend": "native-v2",
            "range": {"start_time": start_time, "end_time": end_time},
            "summary": {
                "event_total": len(events),
                "ip_total": total,
                "incident_total": total,
                "ai_done": 0,
                "ai_pending": 0,
                "ai_rate": 0.0,
            },
            "trend": trend,
            "rows": rows,
            "pagination": {
                "page": min(page, pages),
                "page_size": page_size,
                "total": total,
                "pages": pages,
            },
            "duration_ms": int((time.time() - started) * 1000),
        }

    def health(self) -> dict[str, Any]:
        return {
            "ok": True,
            "backend": "native-v2",
            "database": str(self.store.path),
            "read_only": True,
            "blocking_enabled": False,
        }
