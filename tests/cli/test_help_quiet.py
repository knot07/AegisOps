from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NOISY_MARKERS = (
    "plugin.scan",
    "plugin.project.scan",
    "tool.yaml.loaded",
    "plugin.yaml_dispatched",
    "tool_registry.api_service_sync",
    "tool.registry.revision.bumped",
    "tool.watcher.reloaded",
)


def _run_aegisops(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["uv", "run", "aegisops", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=120,
    )


def _assert_help_is_quiet(result: subprocess.CompletedProcess[str]) -> None:
    combined = f"{result.stdout}\n{result.stderr}"
    assert "Usage:" in result.stdout
    assert result.stderr == ""
    for marker in NOISY_MARKERS:
        assert marker not in combined


def test_aegisops_help_is_quiet() -> None:
    result = _run_aegisops("--help")

    assert result.returncode == 0
    _assert_help_is_quiet(result)


def test_aegisops_without_args_is_quiet() -> None:
    result = _run_aegisops()

    assert result.returncode in {0, 2}
    _assert_help_is_quiet(result)
