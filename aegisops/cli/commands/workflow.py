"""Workflow discovery and foreground execution."""
import asyncio
from contextlib import chdir
from dataclasses import asdict
import json
from pathlib import Path

import typer
from aegisops.cli.commands.platform_output import run_and_render

workflow_app = typer.Typer(help="Discover and run workflows", no_args_is_help=True)


@workflow_app.command("list")
def workflow_list(
    directory: Path = typer.Option(Path("."), "-C", "--cd", exists=True, file_okay=False, resolve_path=True),
    format: str = typer.Option("table", "--format"),
):
    async def collect():
        from aegisops.workflow.center import scan_skill_workflows
        from aegisops.workflow.store import WorkflowStore
        try:
            return await scan_skill_workflows(directory)
        finally:
            await WorkflowStore.close()
    run_and_render(collect(), format, ("logicalWorkflowId", "name", "workflowPath"))


@workflow_app.command("run")
def workflow_run(
    workflow: str = typer.Argument(..., help="workflow.json path or discovered workflow ID"),
    inputs: str = typer.Option("{}", "--inputs", help="JSON object of workflow inputs"),
    directory: Path = typer.Option(Path("."), "-C", "--cd", exists=True, file_okay=False, resolve_path=True),
    timeout: float = typer.Option(300.0, "--timeout", min=0.001),
):
    from aegisops.cli.managed import refuse_local_runtime_when_managed

    refuse_local_runtime_when_managed("aegisops workflow run")
    try:
        values = json.loads(inputs)
        if not isinstance(values, dict):
            raise ValueError("--inputs must be a JSON object")
    except ValueError as exc:
        raise typer.BadParameter(str(exc)) from exc
    async def execute():
        from aegisops.workflow.center import scan_skill_workflows
        from aegisops.workflow.runner import run_workflow
        from aegisops.workflow.store import WorkflowStore
        from aegisops.workflow.tool_context import build_workflow_tool_context, cleanup_workflow_tool_context
        context = None
        try:
            path = Path(workflow).expanduser()
            if not path.is_file():
                entries = await scan_skill_workflows(directory)
                match = next((e for e in entries if workflow in {e["workflowId"], e["logicalWorkflowId"]}), None)
                if match is None:
                    raise ValueError(f"Workflow not found: {workflow}")
                path = Path(match["workflowPath"])
            context = await build_workflow_tool_context(workflow_id=path.parent.name, action_name="cli")
            result = await asyncio.to_thread(run_workflow, workflow=path, inputs=values, timeout_s=timeout, tool_context=context)
            return asdict(result)
        finally:
            if context is not None:
                await cleanup_workflow_tool_context(context)
            await WorkflowStore.close()
    with chdir(directory):
        result = run_and_render(execute())
    if result["status"] != "SUCCEEDED":
        raise typer.Exit(1)
