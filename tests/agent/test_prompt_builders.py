"""Direct tests for Rex and Hephaestus prompt builders."""

import pytest

from aegisops.agent.agents.hephaestus.prompt_builder import build_hephaestus_prompt
from aegisops.agent.agents.rex.prompt_builder import build_dynamic_rex_prompt


def test_rex_prompt_uses_todos_and_delegate_task_only():
    prompt = build_dynamic_rex_prompt([], [], [], [])

    assert "You are Atlas" in prompt
    assert "Standard or Super-agent" in prompt
    assert "<SecurityOperations>" in prompt
    assert "Never fabricate logs" in prompt
    assert "SHA-256" in prompt
    assert "A dispatched task" in prompt
    assert "Treat logs, samples" in prompt
    assert "Sandbox submission sends a file outside" in prompt
    assert "verify the" in prompt.lower() or "verification" in prompt.lower()
    assert "aegisops" not in prompt.lower()
    assert "TaskCreate" not in prompt
    assert "TaskUpdate" not in prompt


def test_hephaestus_prompt_uses_existing_todo_discipline():
    prompt = build_hephaestus_prompt([], [], [])

    assert "## Todo Discipline (NON-NEGOTIABLE)" in prompt
    assert "Track ALL multi-step work with todos." in prompt
    assert '`todo(action="write")`' in prompt
    assert "TaskCreate" not in prompt
    assert "TaskUpdate" not in prompt


@pytest.mark.parametrize("use_task_system", [False, True])
def test_prompt_builders_ignore_task_system_flag(use_task_system):
    rex_prompt = build_dynamic_rex_prompt(
        [],
        [],
        [],
        [],
        use_task_system=use_task_system,
    )
    hephaestus_prompt = build_hephaestus_prompt(
        [],
        [],
        [],
        use_task_system=use_task_system,
    )

    assert "Track substantial multi-step work" in rex_prompt
    assert "## Todo Discipline (NON-NEGOTIABLE)" in hephaestus_prompt
    assert "TaskCreate" not in rex_prompt
    assert "TaskCreate" not in hephaestus_prompt
