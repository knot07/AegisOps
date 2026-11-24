"""Audit scheduler changes without persisting prompts or task inputs."""
from aegisops.audit import emit_audit_event
from aegisops.auth.context import get_current_auth_user
from aegisops.utils.log import Log

log = Log.create(service="task.audit")


async def record_task_action(action: str, resource_id: str, *, resource: str = "scheduler") -> None:
    user = get_current_auth_user()
    payload = {
        "actor_id": user.id if user else None,
        "resource": resource,
        "resource_id": resource_id,
        "action": action,
    }
    # The default community audit sink is a no-op; keep a local structured
    # record as well. An optional external sink must not replay a task write.
    log.info("task.audit.change", payload)
    try:
        await emit_audit_event("task.audit.change", payload)
    except Exception:
        log.warning("task.audit.sink_failed", {"resource_id": resource_id, "action": action})
