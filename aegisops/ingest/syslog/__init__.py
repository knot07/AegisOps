"""Syslog ingestion for workflow triggers (UDP/TCP listeners)."""

from aegisops.ingest.syslog.constants import WORKFLOW_SYSLOG_CONFIG_PREFIX
from aegisops.ingest.syslog.manager import SyslogManager, default_manager

__all__ = ["SyslogManager", "default_manager", "WORKFLOW_SYSLOG_CONFIG_PREFIX"]
