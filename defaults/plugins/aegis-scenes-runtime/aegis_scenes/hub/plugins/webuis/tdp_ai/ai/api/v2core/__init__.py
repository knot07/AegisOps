"""TDP native AegisOps V2 core."""

from .aggregation import aggregate_attackers, annotate_scan_campaigns, build_trend
from .client import IncompleteResultError, TdpClient, TdpClientError
from .collector import NativeCollector
from .config import TdpConnection, load_aegisops_connection, load_legacy_connection
from .service import NativeTdpService
from .storage import NativeStore

__all__ = [
    "IncompleteResultError",
    "NativeStore",
    "NativeCollector",
    "NativeTdpService",
    "TdpClient",
    "TdpClientError",
    "TdpConnection",
    "aggregate_attackers",
    "annotate_scan_campaigns",
    "build_trend",
    "load_aegisops_connection",
    "load_legacy_connection",
]
