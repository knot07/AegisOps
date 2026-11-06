"""
Hook system for AegisOps

Provides an event-driven hook system for extending AegisOps functionality.
Inspired by OpenClaw's hook architecture.
"""

from aegisops.hooks.registry import (
    HookRegistry,
    register_hook,
    unregister_hook,
    clear_hooks,
    trigger_hook,
    get_hook_stats,
)
from aegisops.hooks.types import (
    HookEvent,
    HookEventType,
    CommandHookEvent,
    SessionHookEvent,
    AgentHookEvent,
    SystemHookEvent,
    HookHandler,
    AsyncHookHandler,
)
from aegisops.hooks.utils import (
    create_command_event,
    create_session_event,
    create_agent_event,
    create_system_event,
)

__all__ = [
    # Registry
    "HookRegistry",
    "register_hook",
    "unregister_hook",
    "clear_hooks",
    "trigger_hook",
    "get_hook_stats",
    
    # Types
    "HookEvent",
    "HookEventType",
    "CommandHookEvent",
    "SessionHookEvent",
    "AgentHookEvent",
    "SystemHookEvent",
    "HookHandler",
    "AsyncHookHandler",
    
    # Utils
    "create_command_event",
    "create_session_event",
    "create_agent_event",
    "create_system_event",
]
