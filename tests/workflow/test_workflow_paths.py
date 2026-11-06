"""
Tests for workflow canonical path changes.

Verifies that:
- resolve_global_workflow_roots() includes plugins/workflows/ as new canonical path
- resolve_project_workflow_roots() includes plugins/workflows/ as new canonical path
- scan_skill_workflows() discovers workflows from plugins/workflows/ directories
- Legacy paths (workflow/, plugins/workflow/) are still scanned for compat
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from aegisops.workflow import center
from aegisops.workflow.center import (
    resolve_global_workflow_roots,
    resolve_project_workflow_roots,
)
from aegisops.storage.storage import Storage


# ---------------------------------------------------------------------------
# Path resolution unit tests
# ---------------------------------------------------------------------------

class TestResolveGlobalWorkflowRoots:
    """Global roots hang off the runtime root (``AEGISOPS_ROOT`` → ``~/.aegisops``).

    They used to be spelled ``Path.home() / ".aegisops"`` here, which only held
    when no ``AEGISOPS_ROOT`` was exported: an instance started with one must not
    read (or write) the default user's workflows, so the resolver follows
    ``get_aegisops_root()`` and these tests pin the root explicitly.
    """

    @pytest.fixture
    def aegisops_root(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
        root = tmp_path / "instance-root"
        monkeypatch.setenv("AEGISOPS_ROOT", str(root))
        return root

    def test_includes_new_canonical_path(self, aegisops_root: Path):
        roots = resolve_global_workflow_roots()
        assert aegisops_root / "plugins" / "workflows" in roots

    def test_canonical_path_is_highest_priority(self, aegisops_root: Path):
        """plugins/workflows/ must be last (highest priority, last-wins)."""
        roots = resolve_global_workflow_roots()
        assert roots[-1] == aegisops_root / "plugins" / "workflows"

    def test_includes_legacy_compat_paths(self, aegisops_root: Path):
        roots = resolve_global_workflow_roots()
        assert aegisops_root / "plugins" / "workflow" in roots
        assert aegisops_root / "workflow" in roots

    def test_returns_three_paths(self, aegisops_root: Path):
        roots = resolve_global_workflow_roots()
        assert len(roots) == 3

    def test_defaults_to_home_dot_aegisops_without_aegisops_root(self, monkeypatch: pytest.MonkeyPatch):
        monkeypatch.delenv("AEGISOPS_ROOT", raising=False)
        roots = resolve_global_workflow_roots()
        assert roots[-1] == Path.home() / ".aegisops" / "plugins" / "workflows"


class TestResolveProjectWorkflowRoots:
    def test_includes_new_canonical_path(self, tmp_path: Path):
        roots = resolve_project_workflow_roots(tmp_path)
        canonical = tmp_path / ".aegisops" / "plugins" / "workflows"
        assert canonical in roots

    def test_canonical_path_is_highest_priority(self, tmp_path: Path):
        roots = resolve_project_workflow_roots(tmp_path)
        canonical = tmp_path / ".aegisops" / "plugins" / "workflows"
        assert roots[-1] == canonical

    def test_includes_legacy_compat_paths(self, tmp_path: Path):
        roots = resolve_project_workflow_roots(tmp_path)
        legacy_plugin = tmp_path / ".aegisops" / "plugins" / "workflow"
        legacy_main = tmp_path / ".aegisops" / "workflow"
        assert legacy_plugin in roots
        assert legacy_main in roots

    def test_returns_three_paths(self, tmp_path: Path):
        roots = resolve_project_workflow_roots(tmp_path)
        assert len(roots) == 3


# ---------------------------------------------------------------------------
# Scan integration tests
# ---------------------------------------------------------------------------

def _workflow_payload(name: str) -> dict:
    return {
        "id": f"{name}-id",
        "name": name,
        "start": "n1",
        "nodes": [{"id": "n1", "type": "python", "code": "outputs['ok'] = True"}],
        "edges": [],
    }


@pytest.fixture
async def isolated_storage(tmp_path: Path):
    Storage._initialized = False
    Storage._db_path = None
    await Storage.init(tmp_path / "test.db")
    yield
    Storage._initialized = False
    Storage._db_path = None


@pytest.mark.asyncio
async def test_scan_discovers_new_canonical_path(
    tmp_path: Path,
    isolated_storage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Workflows placed in plugins/workflows/ (new canonical) are discovered."""
    wf_dir = tmp_path / ".aegisops" / "plugins" / "workflows" / "my-wf"
    wf_dir.mkdir(parents=True)
    (wf_dir / "workflow.json").write_text(
        json.dumps(_workflow_payload("my-wf")), encoding="utf-8"
    )
    monkeypatch.chdir(tmp_path)
    # Isolate from real global ~/.aegisops/ workflows
    monkeypatch.setattr(center, "resolve_global_workflow_roots", lambda: [])

    results = await center.scan_skill_workflows(tmp_path)
    assert len(results) == 1
    assert results[0]["name"] == "my-wf"
    assert results[0]["sourceType"] == "project"


@pytest.mark.asyncio
async def test_scan_still_discovers_legacy_workflow_path(
    tmp_path: Path,
    isolated_storage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Workflows in old .aegisops/workflow/ (legacy) are still discovered."""
    wf_dir = tmp_path / ".aegisops" / "workflow" / "legacy-wf"
    wf_dir.mkdir(parents=True)
    (wf_dir / "workflow.json").write_text(
        json.dumps(_workflow_payload("legacy-wf")), encoding="utf-8"
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(center, "resolve_global_workflow_roots", lambda: [])

    results = await center.scan_skill_workflows(tmp_path)
    assert len(results) == 1
    assert results[0]["name"] == "legacy-wf"


@pytest.mark.asyncio
async def test_new_canonical_path_wins_over_legacy(
    tmp_path: Path,
    isolated_storage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When same directory name exists in both legacy and new canonical path, new wins."""
    for subdir in [
        tmp_path / ".aegisops" / "workflow" / "shared-wf",
        tmp_path / ".aegisops" / "plugins" / "workflows" / "shared-wf",
    ]:
        subdir.mkdir(parents=True)
        payload = _workflow_payload(
            "shared-wf" if "workflows" not in str(subdir) else "shared-wf-new"
        )
        (subdir / "workflow.json").write_text(json.dumps(payload), encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(center, "resolve_global_workflow_roots", lambda: [])

    results = await center.scan_skill_workflows(tmp_path)
    # The new canonical path (plugins/workflows/) has higher priority and wins
    assert [r["name"] for r in results] == ["shared-wf-new"]


@pytest.mark.asyncio
async def test_scan_and_registry_prefer_user_workflow_over_project_bundle(
    tmp_path: Path,
    isolated_storage,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    project_root = tmp_path / "project"
    user_root = tmp_path / "user"
    for root, name in (
        (project_root, "project bundle"),
        (user_root, "user customization"),
    ):
        workflow_dir = root / "shared-workflow"
        workflow_dir.mkdir(parents=True)
        (workflow_dir / "workflow.json").write_text(
            json.dumps(_workflow_payload(name)),
            encoding="utf-8",
        )

    monkeypatch.setattr(
        center,
        "resolve_project_workflow_roots",
        lambda _base: [project_root],
    )
    monkeypatch.setattr(center, "resolve_global_workflow_roots", lambda: [user_root])

    scanned = await center.scan_skill_workflows(tmp_path)
    registered = await center.list_registry_entries()

    assert len(scanned) == 1
    assert scanned[0]["name"] == "user customization"
    assert scanned[0]["sourceType"] == "global"
    matching_registry_entries = [
        entry
        for entry in registered
        if entry.get("logicalWorkflowId") == "shared-workflow"
        and Path(str(entry.get("workflowPath"))).is_relative_to(tmp_path)
    ]
    assert len(matching_registry_entries) == 1
    assert matching_registry_entries[0]["name"] == "user customization"


@pytest.mark.asyncio
@pytest.mark.parametrize("invalid_user_workflow", ["invalid_json", "hidden"])
async def test_registry_falls_back_when_user_workflow_is_no_longer_discoverable(
    tmp_path: Path,
    isolated_storage,
    monkeypatch: pytest.MonkeyPatch,
    invalid_user_workflow: str,
) -> None:
    project_root = tmp_path / "project"
    user_root = tmp_path / "user"
    project_dir = project_root / "shared-workflow"
    user_dir = user_root / "shared-workflow"
    project_dir.mkdir(parents=True)
    user_dir.mkdir(parents=True)
    (project_dir / "workflow.json").write_text(
        json.dumps(_workflow_payload("project bundle")),
        encoding="utf-8",
    )
    user_workflow_path = user_dir / "workflow.json"
    user_workflow_path.write_text(
        json.dumps(_workflow_payload("user customization")),
        encoding="utf-8",
    )

    monkeypatch.setattr(
        center,
        "resolve_project_workflow_roots",
        lambda _base: [project_root],
    )
    monkeypatch.setattr(center, "resolve_global_workflow_roots", lambda: [user_root])

    await center.scan_skill_workflows(tmp_path)
    if invalid_user_workflow == "invalid_json":
        user_workflow_path.write_text("{", encoding="utf-8")
    else:
        (user_dir / "meta.json").write_text(
            json.dumps({"hidden": True}),
            encoding="utf-8",
        )

    scanned = await center.scan_skill_workflows(tmp_path)
    registered = await center.list_registry_entries()
    matching_registry_entries = [
        entry
        for entry in registered
        if entry.get("logicalWorkflowId") == "shared-workflow"
        and Path(str(entry.get("workflowPath"))).is_relative_to(tmp_path)
    ]

    assert [entry["name"] for entry in scanned] == ["project bundle"]
    assert [entry["name"] for entry in matching_registry_entries] == ["project bundle"]
