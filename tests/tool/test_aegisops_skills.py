"""
Tests for aegisops/tool/skill/aegisops_skills.py

Coverage:
- Tool registration in ToolRegistry
- Subcommand allow-list enforcement
- Missing aegisops executable guard
- Successful execution (mocked subprocess)
- Failed execution (non-zero exit code)
- Timeout handling and proc.kill()
- Structured subcommand arguments
- Output truncation
"""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from aegisops.tool.registry import ToolRegistry, ToolContext, ToolResult
import aegisops.tool.skill.aegisops_skills  # noqa: F401 — ensure module is imported


def make_ctx() -> ToolContext:
    ctx = MagicMock(spec=ToolContext)
    ctx.ask = AsyncMock(return_value=None)
    ctx.metadata = MagicMock()
    ctx.aborted = False
    ctx.extra = {}
    return ctx


def make_proc(stdout: bytes = b"", stderr: bytes = b"", returncode: int = 0):
    proc = MagicMock()
    proc.communicate = AsyncMock(return_value=(stdout, stderr))
    proc.returncode = returncode
    proc.kill = MagicMock()
    return proc


def test_tool_is_registered():
    """aegisops_skills must appear in ToolRegistry after module import."""
    tools = {t.name for t in ToolRegistry.list_tools()}
    assert "aegisops_skills" in tools


def test_tool_has_expected_parameters():
    tool = next(t for t in ToolRegistry.list_tools() if t.name == "aegisops_skills")
    param_names = {p.name for p in tool.parameters}
    assert {
        "subcommand",
        "query",
        "source",
        "skill_name",
        "scope",
    } == param_names


@pytest.mark.asyncio
async def test_unknown_subcommand_returns_error():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    result = await aegisops_skills(ctx, subcommand="hack")
    assert result.success is False
    assert "Unknown subcommand" in (result.error or "")


@pytest.mark.asyncio
async def test_all_allowed_subcommands_accepted():
    """Ensure none of the valid subcommands are rejected by the allow-list."""
    from aegisops.tool.skill.aegisops_skills import (
        aegisops_skills,
        _ALLOWED_SUBCOMMANDS,
        _READ_ONLY_SUBCOMMANDS,
    )

    proc = make_proc(stdout=b"ok", returncode=0)
    from aegisops.skill.installer import SkillInstallResult

    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/local/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc),
        patch(
            "aegisops.skill.installer.SkillInstaller.install_from_source",
            AsyncMock(
                return_value=SkillInstallResult(
                    success=True,
                    skill_name="demo",
                    location="/tmp/demo/SKILL.md",
                    message="installed",
                )
            ),
        ),
    ):
        for sub in _ALLOWED_SUBCOMMANDS:
            ctx = make_ctx()
            kwargs = {}
            if sub == "find":
                kwargs["query"] = "demo"
            elif sub == "install":
                kwargs["source"] = "github:owner/repo/demo"
            elif sub in {"install-deps", "remove"}:
                kwargs["skill_name"] = "demo"
            result = await aegisops_skills(ctx, subcommand=sub, **kwargs)
            assert result.success is True, f"subcommand {sub!r} should succeed"
            if sub in _READ_ONLY_SUBCOMMANDS:
                ctx.ask.assert_not_called()
            else:
                ctx.ask.assert_called_once()


@pytest.mark.asyncio
async def test_missing_aegisops_executable():
    ctx = make_ctx()
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    with patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value=None):
        result = await aegisops_skills(ctx, subcommand="status")
    assert result.success is False
    assert "not found" in (result.error or "").lower()


@pytest.mark.asyncio
async def test_status_success():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = make_proc(stdout=b"find-ioc  ndr-alert\n", returncode=0)
    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc) as mock_exec,
    ):
        result = await aegisops_skills(ctx, subcommand="status")

    assert result.success is True
    assert "find-ioc" in (result.output or "")
    cmd_args = mock_exec.call_args[0]
    assert "skills" in cmd_args
    assert "status" in cmd_args
    ctx.ask.assert_not_called()


@pytest.mark.asyncio
async def test_find_passes_structured_query():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = make_proc(stdout=b"phishing analysis skill\n", returncode=0)
    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc) as mock_exec,
    ):
        result = await aegisops_skills(
            ctx,
            subcommand="find",
            query="phishing analysis",
        )

    assert result.success is True
    cmd_args = mock_exec.call_args[0]
    assert cmd_args == ("/usr/bin/aegisops", "skills", "find", "phishing analysis")
    ctx.ask.assert_not_called()


@pytest.mark.asyncio
async def test_remove_accepts_structured_skill_name_and_appends_yes():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = make_proc(stdout=b"removed\n", returncode=0)
    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc) as mock_exec,
    ):
        result = await aegisops_skills(
            ctx,
            subcommand="remove",
            skill_name="old-skill",
        )

    assert result.success is True
    cmd_args = mock_exec.call_args[0]
    assert cmd_args == ("/usr/bin/aegisops", "skills", "remove", "old-skill", "--yes")
    ctx.ask.assert_called_once()


@pytest.mark.asyncio
async def test_nonzero_exit_returns_failure():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills
    from aegisops.skill.installer import SkillInstallResult

    ctx = make_ctx()
    with patch(
        "aegisops.skill.installer.SkillInstaller.install_from_source",
        AsyncMock(return_value=SkillInstallResult(success=False, error="skill not found")),
    ):
        result = await aegisops_skills(
            ctx,
            subcommand="install",
            source="github:bad/source",
        )

    assert result.success is False
    assert "skill not found" in (result.error or "")
    ctx.ask.assert_called_once()


@pytest.mark.asyncio
async def test_install_forwards_safeskill_source():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills
    from aegisops.skill.installer import SkillInstallResult

    source = "safeskill://tbx/6ef3925b1f6245bcbd7da39f23c28652/onesig-use@1.0.0"
    ctx = make_ctx()
    installer = AsyncMock(
        return_value=SkillInstallResult(
            success=True,
            skill_name="onesig-use",
            location="/tmp/onesig-use/SKILL.md",
            message="installed",
        )
    )

    with patch("aegisops.skill.installer.SkillInstaller.install_from_source", installer):
        result = await aegisops_skills(
            ctx,
            subcommand="install",
            source=source,
            scope="global",
        )

    assert result.success is True
    installer.assert_awaited_once_with(source, scope="global", yes=True)
    ctx.ask.assert_called_once()
    assert ctx.ask.call_args.kwargs["patterns"] == [
        f"aegisops skills install {source} --scope global --yes"
    ]


@pytest.mark.asyncio
async def test_install_timeout_returns_failure():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills
    from aegisops.skill.installer import SkillInstallResult

    ctx = make_ctx()
    with patch(
        "aegisops.skill.installer.SkillInstaller.install_from_source",
        AsyncMock(
            return_value=SkillInstallResult(
                success=False,
                error="Command timed out after 45s",
            )
        ),
    ):
        result = await aegisops_skills(
            ctx,
            subcommand="install",
            source="clawhub:slow-skill",
        )

    assert result.success is False
    assert "timed out" in (result.error or "").lower()
    ctx.ask.assert_called_once()


@pytest.mark.asyncio
async def test_remove_timeout_kills_process():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = MagicMock()
    proc.kill = MagicMock()
    proc.communicate = AsyncMock(side_effect=[asyncio.TimeoutError(), (b"", b"")])
    proc.returncode = None

    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc),
    ):
        result = await aegisops_skills(
            ctx,
            subcommand="remove",
            skill_name="old-skill",
        )

    assert result.success is False
    assert "timed out" in (result.error or "").lower()
    proc.kill.assert_called_once()
    ctx.ask.assert_called_once()


@pytest.mark.asyncio
async def test_status_does_not_append_arguments_to_cmd():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = make_proc(stdout=b"", returncode=0)

    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc) as mock_exec,
    ):
        await aegisops_skills(ctx, subcommand="status")

    cmd_args = mock_exec.call_args[0]
    # Exactly: aegisops, skills, status — nothing more
    assert cmd_args == ("/usr/bin/aegisops", "skills", "status")


@pytest.mark.asyncio
async def test_stderr_merged_into_output():
    """stderr content must appear in the returned output on success."""
    from aegisops.tool.skill.aegisops_skills import aegisops_skills

    ctx = make_ctx()
    proc = make_proc(stdout=b"stdout line\n", stderr=b"warning: deprecated\n", returncode=0)
    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc),
    ):
        result = await aegisops_skills(ctx, subcommand="status")

    assert result.success is True
    assert "stdout line" in (result.output or "")
    assert "warning: deprecated" in (result.output or "")


@pytest.mark.asyncio
async def test_long_output_is_truncated():
    from aegisops.tool.skill.aegisops_skills import aegisops_skills, _MAX_OUTPUT

    ctx = make_ctx()
    long_output = b"x" * (_MAX_OUTPUT + 500)
    proc = make_proc(stdout=long_output, returncode=0)
    with (
        patch("aegisops.tool.skill.aegisops_skills._aegisops_executable", return_value="/usr/bin/aegisops"),
        patch("aegisops.tool.skill.aegisops_skills.asyncio.create_subprocess_exec", return_value=proc),
    ):
        result = await aegisops_skills(ctx, subcommand="status")

    assert result.success is True
    assert len(result.output or "") <= _MAX_OUTPUT + 100  # allow for truncation notice
    assert "truncated" in (result.output or "").lower()
