"""Permission data types and neutral confirmation transport."""

from aegisops.permission.helpers import Ruleset, from_config, merge
from aegisops.permission.interactive import legacy_tool_permission_prompt_required
from aegisops.permission.manager import Permission, PermissionManager
from aegisops.permission.next import DeniedError, PermissionNext, PermissionRequestInfo
from aegisops.permission.rule import (
    PermissionLevel,
    PermissionRequest,
    PermissionResult,
    PermissionRule,
    PermissionScope,
)

__all__ = [
    "Permission",
    "PermissionManager",
    "PermissionLevel",
    "PermissionScope",
    "PermissionRule",
    "PermissionRequest",
    "PermissionResult",
    "Ruleset",
    "from_config",
    "merge",
    "PermissionRequestInfo",
    "DeniedError",
    "PermissionNext",
    "auto_approve_enabled",
    "legacy_tool_permission_prompt_required",
]
