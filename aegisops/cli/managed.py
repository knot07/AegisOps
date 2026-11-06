"""
CLI commands that would run a runtime of their own refuse in a managed install.

A managed install runs AegisOps under its service manager; that process is the
one the deployment verified and configured, with everything the deployment
registered -- policy, redaction, audit -- attached to it.  A runtime started
from a shell (an interactive or headless agent turn, a workflow run, an MCP or
ACP server) would carry none of that, so those commands stop and point at the
service instead.
"""

from __future__ import annotations

import typer

#: Exit status of a refused command (usage error, as for a bad argument).
MANAGED_REFUSAL_EXIT_CODE = 2


def managed_refusal_message(command: str) -> str:
    return (
        f"{command} is not available in a managed install: AegisOps runs under its service "
        "manager here. Use the WebUI, or `aegisops tui --host <host> --port <port>` to attach "
        "to the running service."
    )


def local_runtime_refused() -> bool:
    """Whether this install is managed, so no local runtime may start."""
    from aegisops.updater.deploy import declared_managed

    return declared_managed()


def refuse_local_runtime_when_managed(command: str) -> None:
    """Exit with :data:`MANAGED_REFUSAL_EXIT_CODE` when *command* would start a runtime here."""
    if not local_runtime_refused():
        return
    typer.echo(managed_refusal_message(command), err=True)
    raise typer.Exit(MANAGED_REFUSAL_EXIT_CODE)


def managed_service_message(command: str) -> str:
    """Why this CLI does not start, stop or report a managed install's service."""
    return (
        "[aegisops] error: 这台机器由外部管理进程托管（$AEGISOPS_ROOT/config/deployment.json 声明了 managed），"
        f"服务由它起停；这份 aegisops 的 `{command}` 不管理那个服务，在这里起一份会和它用同一份数据。"
        "请用该安装提供的 aegisops 命令或它的服务管理器（如 systemctl）。"
    )


def refuse_service_command_when_managed(command: str) -> None:
    """The open runtime's own supervisor (start/stop/restart/status/logs) is
    not what runs a managed install: refuse rather than start a second service
    on the same data, or report on a supervisor that is not there."""
    if not local_runtime_refused():
        return
    typer.echo(managed_service_message(command), err=True)
    raise typer.Exit(MANAGED_REFUSAL_EXIT_CODE)


__all__ = [
    "MANAGED_REFUSAL_EXIT_CODE",
    "local_runtime_refused",
    "managed_refusal_message",
    "managed_service_message",
    "refuse_local_runtime_when_managed",
    "refuse_service_command_when_managed",
]
