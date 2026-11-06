"""
CLI Commands module

Exports all CLI command groups for registration in main.py
"""

from aegisops.cli.commands.acp import acp_app
from aegisops.cli.commands.agent import agent_app
from aegisops.cli.commands.debug import debug_app
from aegisops.cli.commands.export import export_app
from aegisops.cli.commands.import_ import import_app
from aegisops.cli.commands.mcp import mcp_app
from aegisops.cli.commands.browser import BROWSER_CONTEXT_SETTINGS, browser_command
from aegisops.cli.commands.doctor import doctor_command
from aegisops.cli.commands.session import session_app
from aegisops.cli.commands.skill import skill_app
from aegisops.cli.commands.stats import stats_app
from aegisops.cli.commands.task import task_app
from aegisops.cli.commands.admin import admin_app
from aegisops.cli.commands.exec import exec_command
from aegisops.cli.commands.workflow import workflow_app
from aegisops.cli.commands.device import device_app
from aegisops.cli.commands.model import model_app
from aegisops.cli.commands.plugin import plugin_app
from aegisops.cli.commands.enterprise import enterprise_app

__all__ = [
    "acp_app",
    "enterprise_app",
    "agent_app",
    "debug_app",
    "exec_command",
    "workflow_app",
    "device_app",
    "model_app",
    "plugin_app",
    "session_app",
    "mcp_app",
    "browser_command",
    "BROWSER_CONTEXT_SETTINGS",
    "doctor_command",
    "export_app",
    "import_app",
    "stats_app",
    "task_app",
    "skill_app",
    "admin_app",
]
