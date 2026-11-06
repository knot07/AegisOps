

import json
import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


SecretGetter = Callable[[str, Any], Any]


@dataclass(frozen=True)
class TdpConnection:
    base_url: str
    api_key: str
    secret: str
    proxy: str = ""
    verify_ssl: bool = False
    timeout: int = 30
    source: str = "api_services"
    device_id: str = ""

    def __post_init__(self) -> None:
        base_url = str(self.base_url or "").strip().rstrip("/")
        if not base_url:
            raise ValueError("TDP base URL is required")
        if not base_url.startswith(("http://", "https://")):
            base_url = f"https://{base_url}"
        if not self.api_key or not self.secret:
            raise ValueError("TDP API Key and Secret are required")
        object.__setattr__(self, "base_url", base_url)
        object.__setattr__(self, "timeout", max(1, int(self.timeout)))


def _as_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _secret_value(secret_getter: SecretGetter, key: str, default: Any = "") -> Any:
    try:
        return secret_getter(key, default)
    except TypeError:
        value = secret_getter(key)  # type: ignore[call-arg]
        return default if value is None else value


def _resolve_ref(value: Any, secret_getter: SecretGetter) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    if text.startswith("{secret:") and text.endswith("}"):
        return str(_secret_value(secret_getter, text[8:-1], "") or "").strip()
    if text.startswith("{env:") and text.endswith("}"):
        return str(os.getenv(text[5:-1], "")).strip()
    return text


def _default_device_db_path() -> Path:
    try:
        from aegisops.storage.storage import Storage

        return Path(Storage.get_db_path())
    except Exception:
        return Path.home() / ".aegisops" / "data" / "aegisops.db"


def _load_tdp_device_instance(
    database_path: str | os.PathLike[str],
    *,
    preferred_device_id: str = "",
) -> dict[str, Any]:
    """Return one enabled TDP device row without resolving its secret values.

    Device credentials remain opaque ``{secret:...}`` references here. They
    are resolved later through the page runtime's ``ctx.secrets.get`` callback;
    this module never opens ``.secret.json``.
    """

    path = Path(database_path).expanduser()
    if not path.is_file():
        return {}
    try:
        connection = sqlite3.connect(f"{path.resolve().as_uri()}?mode=ro", uri=True, timeout=5)
        connection.row_factory = sqlite3.Row
        try:
            rows = connection.execute(
                """
                SELECT id, name, storage_key, service_id, enabled, verify_ssl,
                       fields, status, updated_at
                FROM device_integrations
                WHERE enabled = 1
                  AND (service_id = 'tdp_api' OR storage_key IN ('tdp_api_v3_3_10', 'tdp_api'))
                """
            ).fetchall()
        finally:
            connection.close()
    except (OSError, sqlite3.Error):
        return {}

    candidates: list[dict[str, Any]] = []
    for row in rows:
        device_id = str(row["id"] or "")
        if preferred_device_id and device_id != preferred_device_id:
            continue
        try:
            fields = json.loads(row["fields"] or "{}")
        except (TypeError, ValueError, json.JSONDecodeError):
            continue
        if not isinstance(fields, dict):
            continue
        candidates.append(
            {
                **fields,
                "_device_id": device_id,
                "_device_name": str(row["name"] or ""),
                "_storage_key": str(row["storage_key"] or ""),
                "_status": str(row["status"] or ""),
                "_updated_at": int(row["updated_at"] or 0),
                "_verify_ssl": bool(row["verify_ssl"]),
            }
        )

    if preferred_device_id and not candidates:
        raise ValueError("configured TDP device instance was not found or is disabled")
    candidates.sort(
        key=lambda item: (
            item.get("_status") != "ok",
            item.get("_storage_key") != "tdp_api_v3_3_10",
            -int(item.get("_updated_at") or 0),
            str(item.get("_device_id") or ""),
        )
    )
    return candidates[0] if candidates else {}


def _resolved_field(raw: dict[str, Any], keys: tuple[str, ...], getter: SecretGetter) -> str:
    for key in keys:
        value = _resolve_ref(raw.get(key), getter)
        if value:
            return value
    return ""


def load_legacy_connection(path: str | os.PathLike[str]) -> TdpConnection:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return TdpConnection(
        base_url=payload.get("base_url", ""),
        api_key=payload.get("api_key", ""),
        secret=payload.get("secret", ""),
        proxy=payload.get("proxy", ""),
        verify_ssl=_as_bool(payload.get("verify_ssl"), False),
        timeout=int(payload.get("timeout", 30) or 30),
        source="legacy_config",
    )


def load_aegisops_connection(
    *,
    config_path: str | os.PathLike[str] | None = None,
    secret_getter: SecretGetter | None = None,
    device_db_path: str | os.PathLike[str] | None = None,
    preferred_device_id: str | None = None,
) -> TdpConnection:
    """Resolve AegisOps' TDP service or device-instance configuration.

    Standard ``api_services`` fields take precedence. Missing fields are filled
    from the best enabled ``device_integrations`` row and its opaque Secret
    Manager references. The caller supplies ``ctx.secrets.get`` in the WebUI
    page runtime; this module never reads ``.secret.json`` directly.
    """

    getter = secret_getter or (lambda key, default=None: os.getenv(key.upper(), default))
    path = Path(config_path) if config_path else Path.home() / ".aegisops" / "config" / "aegisops.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    services = payload.get("api_services") if isinstance(payload, dict) else {}
    services = services if isinstance(services, dict) else {}
    raw: dict[str, Any] = {}
    for key in ("tdp_api_v3_3_10", "tdp_api"):
        candidate = services.get(key)
        if isinstance(candidate, dict) and candidate:
            raw = candidate
            break

    service_base_url = _resolved_field(raw, ("base_url", "baseUrl"), getter)
    service_api_key = _resolved_field(raw, ("apiKey", "api_key"), getter)
    service_secret = _resolved_field(raw, ("secret",), getter)
    device: dict[str, Any] = {}
    if not (service_base_url and service_api_key and service_secret):
        selected_device_id = str(
            preferred_device_id
            or os.getenv("DATANG_TDP_V2_DEVICE_ID", "")
            or ""
        ).strip()
        device = _load_tdp_device_instance(
            device_db_path or _default_device_db_path(),
            preferred_device_id=selected_device_id,
        )

    device_base_url = _resolved_field(device, ("base_url", "baseUrl"), getter)
    device_api_key = _resolved_field(device, ("apiKey", "api_key"), getter)
    device_secret = _resolved_field(device, ("secret",), getter)
    base_url = (
        service_base_url
        or device_base_url
        or str(_secret_value(getter, "tdp_host", "") or "")
        or os.getenv("TDP_HOST", "")
    )
    api_key = (
        service_api_key
        or device_api_key
        or str(_secret_value(getter, "tdp_api_key", "") or "")
        or os.getenv("TDP_API_KEY", "")
    )
    secret = (
        service_secret
        or device_secret
        or str(_secret_value(getter, "tdp_secret", "") or "")
        or os.getenv("TDP_SECRET", "")
    )
    device_used = bool(
        (not service_base_url and device_base_url)
        or (not service_api_key and device_api_key)
        or (not service_secret and device_secret)
    )
    if "verify_ssl" in raw or "ssl_verify" in raw:
        verify_ssl = _as_bool(raw.get("verify_ssl", raw.get("ssl_verify")), False)
    elif device:
        verify_ssl = bool(device.get("_verify_ssl", False))
    else:
        verify_ssl = False
    proxy = str(raw.get("proxy") or device.get("proxy") or "")
    timeout = int(raw.get("timeout") or device.get("timeout") or 30)
    return TdpConnection(
        base_url=base_url,
        api_key=api_key,
        secret=secret,
        proxy=proxy,
        verify_ssl=verify_ssl,
        timeout=timeout,
        source="device_instance" if device_used else "api_services",
        device_id=str(device.get("_device_id") or "") if device_used else "",
    )
