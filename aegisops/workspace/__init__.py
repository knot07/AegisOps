"""
Workspace module

Manages the user-facing workspace directory (~/.aegisops/workspace/).
Provides file management for uploads, agent outputs, and knowledge base files.
"""

from aegisops.workspace.manager import WorkspaceManager

__all__ = ["WorkspaceManager"]
