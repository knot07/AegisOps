"""Close stores owned by a foreground CLI invocation before its loop exits."""


async def close_cli_resources() -> None:
    from aegisops.channel.inbound.session_binding import close_binding_db
    from aegisops.storage.storage import Storage
    from aegisops.workflow.store import WorkflowStore

    try:
        await WorkflowStore.close()
    finally:
        try:
            await close_binding_db()
        finally:
            await Storage.shutdown()
