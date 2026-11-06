from __future__ import annotations

import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any


SCHEMA_VERSION = 4


class NativeStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self.init_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA busy_timeout=30000")
        return connection

    def init_schema(self) -> None:
        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS tdp_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tdp_buckets (
                    bucket_start INTEGER PRIMARY KEY,
                    bucket_end INTEGER NOT NULL,
                    event_count INTEGER NOT NULL,
                    collected_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tdp_ip_summaries (
                    range_key TEXT NOT NULL,
                    ip TEXT NOT NULL,
                    attack_count INTEGER NOT NULL,
                    first_time INTEGER NOT NULL,
                    last_time INTEGER NOT NULL,
                    record_json TEXT NOT NULL,
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY (range_key, ip)
                );
                CREATE INDEX IF NOT EXISTS idx_tdp_summary_range_time
                    ON tdp_ip_summaries(range_key, last_time DESC, ip ASC);
                CREATE TABLE IF NOT EXISTS tdp_judgements (
                    task_key TEXT PRIMARY KEY,
                    ip TEXT NOT NULL,
                    start_time INTEGER NOT NULL,
                    end_time INTEGER NOT NULL,
                    round INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL,
                    phase TEXT NOT NULL,
                    session_id TEXT NOT NULL DEFAULT '',
                    workflow_id TEXT NOT NULL DEFAULT '',
                    execution_id TEXT NOT NULL DEFAULT '',
                    alert_fingerprint TEXT NOT NULL DEFAULT '',
                    alert_time INTEGER NOT NULL DEFAULT 0,
                    result_json TEXT NOT NULL DEFAULT '{}',
                    error TEXT NOT NULL DEFAULT '',
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                """
            )
            columns = {
                str(row[1])
                for row in connection.execute("PRAGMA table_info(tdp_judgements)").fetchall()
            }
            if "workflow_id" not in columns:
                connection.execute(
                    "ALTER TABLE tdp_judgements ADD COLUMN workflow_id TEXT NOT NULL DEFAULT ''"
                )
            if "execution_id" not in columns:
                connection.execute(
                    "ALTER TABLE tdp_judgements ADD COLUMN execution_id TEXT NOT NULL DEFAULT ''"
                )
            if "alert_fingerprint" not in columns:
                connection.execute(
                    "ALTER TABLE tdp_judgements ADD COLUMN alert_fingerprint TEXT NOT NULL DEFAULT ''"
                )
            if "alert_time" not in columns:
                connection.execute(
                    "ALTER TABLE tdp_judgements ADD COLUMN alert_time INTEGER NOT NULL DEFAULT 0"
                )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_tdp_judgements_identity
                    ON tdp_judgements(ip, alert_fingerprint, updated_at DESC)
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_tdp_judgements_fingerprint
                    ON tdp_judgements(alert_fingerprint, updated_at DESC)
                """
            )
            connection.execute(
                "INSERT OR REPLACE INTO tdp_meta(key, value) VALUES('schema_version', ?)",
                (str(SCHEMA_VERSION),),
            )

    def replace_summary(self, range_key: str, rows: list[dict[str, Any]]) -> None:
        now = int(time.time())
        with self._lock, self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute("DELETE FROM tdp_ip_summaries WHERE range_key = ?", (range_key,))
            connection.executemany(
                """
                INSERT INTO tdp_ip_summaries(
                    range_key, ip, attack_count, first_time, last_time, record_json, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        range_key,
                        row.get("row_key") or row["ip"],
                        int(row.get("count") or 0),
                        int(row.get("first_time") or 0),
                        int(row.get("last_time") or 0),
                        json.dumps(
                            {
                                **row,
                                "id": f"{range_key}:{row.get('row_key') or row['ip']}",
                                "range_key": range_key,
                                "time": int(row.get("last_time") or 0),
                            },
                            ensure_ascii=False,
                            separators=(",", ":"),
                        ),
                        now,
                    )
                    for row in rows
                ],
            )
            connection.commit()

    def list_summary(self, range_key: str, *, page: int, page_size: int) -> tuple[list[dict[str, Any]], int]:
        page = max(1, int(page))
        page_size = max(1, min(1000, int(page_size)))
        offset = (page - 1) * page_size
        with self._lock, self._connect() as connection:
            total = int(
                connection.execute(
                    "SELECT COUNT(*) FROM tdp_ip_summaries WHERE range_key = ?", (range_key,)
                ).fetchone()[0]
            )
            records = connection.execute(
                """
                SELECT record_json FROM tdp_ip_summaries
                WHERE range_key = ?
                ORDER BY last_time DESC, ip ASC
                LIMIT ? OFFSET ?
                """,
                (range_key, page_size, offset),
            ).fetchall()
        return [json.loads(record["record_json"]) for record in records], total

    def replace_buckets(self, trend: dict[str, Any]) -> None:
        timestamps = trend.get("timestamps") or []
        values = trend.get("tdp") or []
        step = int(trend.get("step_seconds") or 0)
        now = int(time.time())
        with self._lock, self._connect() as connection:
            connection.executemany(
                """
                INSERT INTO tdp_buckets(bucket_start, bucket_end, event_count, collected_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(bucket_start) DO UPDATE SET
                    bucket_end=excluded.bucket_end,
                    event_count=excluded.event_count,
                    collected_at=excluded.collected_at
                """,
                [
                    (int(timestamp), int(timestamp) + step, int(value), now)
                    for timestamp, value in zip(timestamps, values)
                ],
            )

    def save_bucket(self, bucket_start: int, bucket_end: int, event_count: int) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO tdp_buckets(bucket_start, bucket_end, event_count, collected_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(bucket_start) DO UPDATE SET
                    bucket_end=excluded.bucket_end,
                    event_count=excluded.event_count,
                    collected_at=excluded.collected_at
                """,
                (int(bucket_start), int(bucket_end), int(event_count), int(time.time())),
            )

    def missing_bucket_starts(self, start_time: int, end_time: int, step: int) -> list[int]:
        starts = list(range(int(start_time), int(end_time), int(step)))
        if not starts:
            return []
        with self._lock, self._connect() as connection:
            existing = {
                int(row[0])
                for row in connection.execute(
                    "SELECT bucket_start FROM tdp_buckets WHERE bucket_start >= ? AND bucket_start < ?",
                    (int(start_time), int(end_time)),
                ).fetchall()
            }
        return [value for value in starts if value not in existing]

    def save_judgement_state(
        self,
        *,
        task_key: str,
        ip: str,
        start_time: int,
        end_time: int,
        round_number: int,
        status: str,
        phase: str,
        session_id: str = "",
        workflow_id: str = "",
        execution_id: str = "",
        alert_fingerprint: str = "",
        alert_time: int = 0,
        result: dict[str, Any] | None = None,
        error: str = "",
    ) -> None:
        now = int(time.time())
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO tdp_judgements(
                    task_key, ip, start_time, end_time, round, status, phase,
                    session_id, workflow_id, execution_id, alert_fingerprint, alert_time,
                    result_json, error, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(task_key) DO UPDATE SET
                    status=excluded.status,
                    phase=excluded.phase,
                    session_id=CASE WHEN excluded.session_id <> '' THEN excluded.session_id ELSE tdp_judgements.session_id END,
                    workflow_id=CASE WHEN excluded.workflow_id <> '' THEN excluded.workflow_id ELSE tdp_judgements.workflow_id END,
                    execution_id=CASE WHEN excluded.execution_id <> '' THEN excluded.execution_id ELSE tdp_judgements.execution_id END,
                    alert_fingerprint=CASE WHEN excluded.alert_fingerprint <> '' THEN excluded.alert_fingerprint ELSE tdp_judgements.alert_fingerprint END,
                    alert_time=CASE WHEN excluded.alert_time > 0 THEN excluded.alert_time ELSE tdp_judgements.alert_time END,
                    result_json=excluded.result_json,
                    error=excluded.error,
                    updated_at=excluded.updated_at
                """,
                (
                    task_key,
                    ip,
                    int(start_time),
                    int(end_time),
                    int(round_number),
                    status,
                    phase,
                    session_id,
                    workflow_id,
                    execution_id,
                    alert_fingerprint,
                    int(alert_time),
                    json.dumps(result or {}, ensure_ascii=False, separators=(",", ":")),
                    error,
                    now,
                    now,
                ),
            )

    def attach_workflow_execution(
        self,
        task_key: str,
        *,
        workflow_id: str,
        execution_id: str,
    ) -> bool:
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE tdp_judgements
                SET workflow_id=?, execution_id=?, updated_at=?
                WHERE task_key=?
                """,
                (workflow_id, execution_id, int(time.time()), task_key),
            )
        return bool(cursor.rowcount)

    def set_judgement_identity(
        self,
        task_key: str,
        *,
        alert_fingerprint: str,
        alert_time: int,
    ) -> bool:
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                UPDATE tdp_judgements
                SET alert_fingerprint=?, alert_time=?, updated_at=?
                WHERE task_key=? AND alert_fingerprint=''
                """,
                (alert_fingerprint, int(alert_time), int(time.time()), task_key),
            )
        return bool(cursor.rowcount)

    def get_judgement(self, task_key: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM tdp_judgements WHERE task_key = ?", (task_key,)
            ).fetchone()
        if row is None:
            return None
        value = dict(row)
        value["result"] = json.loads(value.pop("result_json") or "{}")
        return value

    def get_latest_judgement(
        self,
        ip: str,
        alert_fingerprint: str | None = None,
    ) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            identity_filter = "" if alert_fingerprint is None else " AND alert_fingerprint = ?"
            parameters = (str(ip),) if alert_fingerprint is None else (str(ip), alert_fingerprint)
            row = connection.execute(
                f"""
                SELECT * FROM tdp_judgements
                WHERE ip = ?{identity_filter}
                ORDER BY updated_at DESC,
                         CASE status WHEN 'pending' THEN 0 ELSE 1 END
                LIMIT 1
                """,
                parameters,
            ).fetchone()
        if row is None:
            return None
        value = dict(row)
        value["result"] = json.loads(value.pop("result_json") or "{}")
        return value

    def get_latest_judgement_by_fingerprint(self, alert_fingerprint: str) -> dict[str, Any] | None:
        if not alert_fingerprint:
            return None
        with self._lock, self._connect() as connection:
            row = connection.execute(
                """
                SELECT * FROM tdp_judgements
                WHERE alert_fingerprint = ?
                ORDER BY updated_at DESC,
                         CASE status WHEN 'pending' THEN 0 ELSE 1 END
                LIMIT 1
                """,
                (alert_fingerprint,),
            ).fetchone()
        if row is None:
            return None
        value = dict(row)
        value["result"] = json.loads(value.pop("result_json") or "{}")
        return value
