import asyncio
import sys
import types
from types import SimpleNamespace

import pytest

from aegisops.memory.config import MemoryConfig
from aegisops.server import app as app_module


class _DummyLogger:
    def info(self, *_args, **_kwargs) -> None:
        return None

    def warning(self, *_args, **_kwargs) -> None:
        return None

    def warn(self, *_args, **_kwargs) -> None:
        return None


@pytest.mark.asyncio
async def test_lifespan_cleans_replaced_files_without_upgrade_recovery(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    events: list[str] = []

    def cleanup_replaced_files() -> None:
        events.append("cleanup_replaced_files")

    async def fake_storage_init() -> None:
        return None

    async def fake_config_get():
        return SimpleNamespace(memory=MemoryConfig(dream={"enabled": False}))

    async def fake_to_thread(func, *args, **kwargs):
        return func(*args, **kwargs)

    async def fake_async_noop(*_args, **_kwargs) -> None:
        return None

    dream_scheduler_events: list[str] = []

    async def start_dream_scheduler() -> None:
        dream_scheduler_events.append("start")

    async def stop_dream_scheduler() -> None:
        dream_scheduler_events.append("stop")

    monkeypatch.setattr(app_module.Log, "_writer", object())
    monkeypatch.setattr(app_module.Log, "create", lambda service: _DummyLogger())
    monkeypatch.setattr(app_module, "init_observability", lambda: None)
    monkeypatch.setattr(app_module, "shutdown_observability", lambda: None)
    monkeypatch.setattr(app_module.Storage, "init", fake_storage_init)
    monkeypatch.setattr(app_module.Config, "get", fake_config_get)
    monkeypatch.setattr(app_module.asyncio, "to_thread", fake_to_thread)
    monkeypatch.setattr(app_module.asyncio, "sleep", fake_async_noop)

    monkeypatch.setitem(
        sys.modules,
        "aegisops.updater.updater",
        types.SimpleNamespace(
            cleanup_replaced_files=cleanup_replaced_files,
        ),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.config.config_writer",
        types.SimpleNamespace(ensure_config_files=lambda: None),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.hooks.builtin",
        types.SimpleNamespace(register_builtin_hooks=lambda: None),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.memory.evolution.scheduler",
        types.SimpleNamespace(
            MemoryEvolutionScheduler=types.SimpleNamespace(
                start=start_dream_scheduler,
                stop=stop_dream_scheduler,
            ),
        ),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.tool.question_handler",
        types.SimpleNamespace(setup_api_question_handler=lambda: None),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.provider.credential",
        types.SimpleNamespace(migrate_env_credentials=lambda: 0),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.server.routes.custom_provider",
        types.SimpleNamespace(load_custom_providers_on_startup=fake_async_noop),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.mcp",
        types.SimpleNamespace(MCP=types.SimpleNamespace(init=fake_async_noop, shutdown=fake_async_noop)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.server.routes.workflow",
        types.SimpleNamespace(sync_workflows_from_filesystem=lambda: fake_async_noop() or 0),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.task.manager",
        types.SimpleNamespace(TaskManager=types.SimpleNamespace(start=fake_async_noop, stop=fake_async_noop)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.task.plugin",
        types.SimpleNamespace(seed_tasks_from_plugin=lambda: fake_async_noop() or 0),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.skill.skill",
        types.SimpleNamespace(Skill=types.SimpleNamespace(start_watcher=lambda: None, stop_watcher=lambda: None)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.agent.registry",
        types.SimpleNamespace(Agent=types.SimpleNamespace(start_watcher=lambda: None)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.tool.registry",
        types.SimpleNamespace(ToolRegistry=types.SimpleNamespace(init=lambda: None, start_watcher=lambda: None)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.channel.gateway.manager",
        types.SimpleNamespace(
            default_manager=types.SimpleNamespace(start_all=fake_async_noop, stop_all=fake_async_noop),
        ),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.server.routes.event",
        types.SimpleNamespace(
            EventBroadcaster=types.SimpleNamespace(
                get=lambda: types.SimpleNamespace(client_count=0, shutdown=fake_async_noop),
            ),
        ),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.session.core.status",
        types.SimpleNamespace(SessionStatus=types.SimpleNamespace(get_busy_session_ids=lambda: [])),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.task.store",
        types.SimpleNamespace(TaskStore=types.SimpleNamespace(close=fake_async_noop)),
    )
    monkeypatch.setitem(
        sys.modules,
        "aegisops.project.instance",
        types.SimpleNamespace(Instance=types.SimpleNamespace(dispose_all=fake_async_noop)),
    )

    import aegisops.extensions as extensions

    monkeypatch.setattr(extensions, "_shutdown_hooks", [])
    monkeypatch.setattr(extensions, "_startup_hooks", [])
    extensions.register_shutdown_hook("test.extension", lambda: dream_scheduler_events.append("extension"))
    extension_started = asyncio.Event()

    async def start_extension() -> None:
        extension_started.set()

    extensions.register_startup_hook("test.extension", start_extension)

    async with app_module.lifespan(SimpleNamespace()):
        # Extension services start on the server's loop once startup is ready.
        await asyncio.wait_for(extension_started.wait(), timeout=2)

    assert events == ["cleanup_replaced_files"]
    # Extension services stop before the runtime services they depend on.
    assert dream_scheduler_events == ["start", "extension", "stop"]
