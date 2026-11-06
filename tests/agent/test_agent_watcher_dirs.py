"""The agent and tool watchers must not watch the same directory.

macOS FSEvents refuses a second observer on a path another observer already
watches ("Cannot add watch ... it is already scheduled"), and that watcher then
never reloads anything.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from aegisops.agent.registry import AgentFileWatcher
from aegisops.tool.registry import ToolFileWatcher


@pytest.fixture
def plugin_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    from aegisops.plugin import loader

    root = tmp_path / "home" / ".aegisops" / "plugins"
    root.mkdir(parents=True)
    monkeypatch.setattr(loader, "DEFAULT_PLUGIN_ROOT", root)
    project = tmp_path / "project"
    (project / ".aegisops" / "plugins" / "agents").mkdir(parents=True)
    monkeypatch.chdir(project)
    return root


def test_the_agent_watcher_watches_agent_directories_only(plugin_root: Path):
    dirs = AgentFileWatcher()._collect_watch_dirs()

    assert dirs == {str(plugin_root / "agents"), str(Path.cwd() / ".aegisops" / "plugins" / "agents")}
    assert (plugin_root / "agents").is_dir(), "created up front, so a first saved agent is covered"


def test_a_project_with_plugins_gets_its_agents_directory_watched(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Its first agent may only be created after startup."""
    from aegisops.plugin import loader

    root = tmp_path / "home" / ".aegisops" / "plugins"
    root.mkdir(parents=True)
    monkeypatch.setattr(loader, "DEFAULT_PLUGIN_ROOT", root)
    project = tmp_path / "project"
    (project / ".aegisops" / "plugins" / "tools").mkdir(parents=True)  # plugins, but no agents yet
    monkeypatch.chdir(project)

    dirs = AgentFileWatcher()._collect_watch_dirs()

    assert str(project / ".aegisops" / "plugins" / "agents") in dirs
    assert (project / ".aegisops" / "plugins" / "agents").is_dir()


def test_a_project_without_plugins_is_left_alone(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    from aegisops.plugin import loader

    root = tmp_path / "home" / ".aegisops" / "plugins"
    root.mkdir(parents=True)
    monkeypatch.setattr(loader, "DEFAULT_PLUGIN_ROOT", root)
    project = tmp_path / "plain-project"
    project.mkdir()
    monkeypatch.chdir(project)

    assert AgentFileWatcher()._collect_watch_dirs() == {str(root / "agents")}
    assert not (project / ".aegisops").exists()


def test_no_directory_is_watched_by_both_watchers(plugin_root: Path):
    agent_dirs = AgentFileWatcher()._collect_watch_dirs()
    tool_dirs = ToolFileWatcher()._collect_watch_dirs()

    assert tool_dirs and agent_dirs
    assert not agent_dirs & tool_dirs
