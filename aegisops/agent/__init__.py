"""
Agent management module.

Canonical import locations:
  aegisops.agent.agent         — AgentInfo, AgentModel, AgentPromptMetadata, …
  aegisops.agent.registry      — Agent class (load / get / list)
  aegisops.agent.agent_factory — scan_and_load, inject_dynamic_prompts
  aegisops.agent.prompt_utils  — prompt builder functions
  aegisops.session.prompt_strings     — PROMPT_COMPACTION/TITLE/SUMMARY/GENERATE

This __init__ exposes the public API via lazy imports to avoid circular
dependencies with session/runner.py.
"""

__all__ = [
    "Agent",
    "AgentInfo",
    "AgentModel",
    # Session management prompts
    "PROMPT_COMPACTION",
    "PROMPT_TITLE",
    "PROMPT_SUMMARY",
    # YAML config loader
    "yaml_to_agent_info",
]

_LAZY_MAP = {
    "Agent": "aegisops.agent.registry",
    "AgentInfo": "aegisops.agent.agent",
    "AgentModel": "aegisops.agent.agent",
    "PROMPT_COMPACTION": "aegisops.session.prompt_strings",
    "PROMPT_TITLE": "aegisops.session.prompt_strings",
    "PROMPT_SUMMARY": "aegisops.session.prompt_strings",
    "yaml_to_agent_info": "aegisops.agent.agent_factory",
}


def __getattr__(name: str):
    if name in _LAZY_MAP:
        import importlib
        module = importlib.import_module(_LAZY_MAP[name])
        return getattr(module, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
