"""Data retention test fixtures: a per-test AegisOps home with its own storage, logs and records."""

from pathlib import Path

import pytest

from aegisops.config.config import Config
from aegisops.storage.storage import Storage
from aegisops.utils.log import set_log_cleanup_managed, set_log_retention_days_override


@pytest.fixture(autouse=True)
async def isolate_retention_storage(monkeypatch: pytest.MonkeyPatch, tmp_path: Path):
    aegisops_root = tmp_path / "aegisops-home"
    data_dir = aegisops_root / "data"
    log_dir = aegisops_root / "logs"
    record_dir = data_dir / "records"
    db_path = data_dir / "retention-tests.db"

    monkeypatch.setenv("AEGISOPS_ROOT", str(aegisops_root))
    monkeypatch.setenv("AEGISOPS_DATA_DIR", str(data_dir))
    monkeypatch.setenv("AEGISOPS_LOG_DIR", str(log_dir))
    monkeypatch.setenv("AEGISOPS_RECORD_DIR", str(record_dir))
    monkeypatch.delenv("AEGISOPS_LOG_RETENTION_DAYS", raising=False)
    monkeypatch.delenv("XDG_DATA_HOME", raising=False)
    monkeypatch.delenv("XDG_STATE_HOME", raising=False)

    from aegisops.session.message import Message
    from aegisops.session.session import Session

    Config._global_config = None
    Config.clear_cache()
    Storage._initialized = False
    Storage._db_path = None
    Session.invalidate_cache()
    Message.invalidate_cache()
    set_log_retention_days_override(None)
    set_log_cleanup_managed(False)

    await Storage.init(db_path)

    yield

    await Storage.clear()
    Session.invalidate_cache()
    Message.invalidate_cache()
    set_log_retention_days_override(None)
    set_log_cleanup_managed(False)
    Config._global_config = None
    Config.clear_cache()
    Storage._initialized = False
    Storage._db_path = None
