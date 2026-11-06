"""
Parity checks for Oh-My-AegisOps integration.
"""

import pytest

from aegisops.tool import ToolRegistry


class TestOmoToolParity:
    """Minimal parity checks for background tool removal."""

    def test_background_tools_not_exposed_to_models(self):
        tools = ToolRegistry.all_tool_ids()
        assert "background_output" not in tools
        assert "background_cancel" not in tools
