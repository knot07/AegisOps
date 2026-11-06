"""
ACP (Agent Client Protocol) module

Provides integration with editors like Zed through the Agent Client Protocol.
Based on AegisOps' ported src/acp/

The ACP protocol enables AI agents to communicate with IDE clients through:
- JSON-RPC over stdio
- Session management
- Tool execution notifications
- Permission requests
"""

from aegisops.acp.types import ACPConfig, ACPSessionState
from aegisops.acp.session import ACPSessionManager
from aegisops.acp.agent import ACPAgent, ACP


__all__ = [
    "ACPConfig",
    "ACPSessionState",
    "ACPSessionManager",
    "ACPAgent",
    "ACP",
]
