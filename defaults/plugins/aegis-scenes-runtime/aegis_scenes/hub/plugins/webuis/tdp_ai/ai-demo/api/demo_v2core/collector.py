from __future__ import annotations

import threading
import time
from typing import Any

from .client import TdpClient
from .storage import NativeStore


class NativeCollector:
    """Idempotent read-only TDP bucket collector.

    Scheduling is owned by AegisOps. The collector deliberately exposes bounded
    ``run_once`` and ``backfill`` methods instead of starting a hidden thread at
    import time.
    """

    def __init__(
        self,
        client: TdpClient,
        store: NativeStore,
        *,
        bucket_seconds: int = 1800,
    ) -> None:
        self.client = client
        self.store = store
        self.bucket_seconds = max(60, int(bucket_seconds))
        self._run_lock = threading.Lock()

    def floor_bucket(self, timestamp: int) -> int:
        value = int(timestamp)
        return value - value % self.bucket_seconds

    def collect_bucket(self, bucket_start: int) -> dict[str, Any]:
        bucket_start = int(bucket_start)
        bucket_end = bucket_start + self.bucket_seconds
        events = self.client.fetch_complete(bucket_start, bucket_end)
        self.store.save_bucket(bucket_start, bucket_end, len(events))
        return {
            "bucket_start": bucket_start,
            "bucket_end": bucket_end,
            "event_count": len(events),
        }

    def run_once(self, *, now: int | None = None) -> dict[str, Any]:
        if not self._run_lock.acquire(blocking=False):
            return {"ok": True, "skipped": True, "reason": "collector already running"}
        try:
            current = int(now or time.time())
            latest_completed_start = self.floor_bucket(current) - self.bucket_seconds
            result = self.collect_bucket(latest_completed_start)
            return {"ok": True, "skipped": False, **result}
        finally:
            self._run_lock.release()

    def backfill(
        self,
        start_time: int,
        end_time: int,
        *,
        max_buckets: int = 96,
    ) -> dict[str, Any]:
        start = self.floor_bucket(int(start_time))
        end = self.floor_bucket(int(end_time)) + self.bucket_seconds
        missing = self.store.missing_bucket_starts(start, end, self.bucket_seconds)
        if len(missing) > max(1, int(max_buckets)):
            raise ValueError("backfill exceeds max_buckets")
        rows = [self.collect_bucket(bucket_start) for bucket_start in missing]
        return {"ok": True, "requested": len(missing), "collected": len(rows), "buckets": rows}

