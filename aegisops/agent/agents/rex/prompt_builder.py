"""
Atlas agent dynamic prompt builder.

Builds Atlas's stable orchestration policy plus agent-selection context.
Called by agent_factory.inject_dynamic_prompts() after all agents are loaded.
"""

from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from aegisops.agent.agent import (
        AgentInfo,
        AvailableAgent,
        AvailableTool,
        AvailableSkill,
        AvailableWorkflow,
    )


def inject(
    agent_info: "AgentInfo",
    available_agents: List["AvailableAgent"],
    tools: List["AvailableTool"],
    skills: List["AvailableSkill"],
    workflows: Optional[List["AvailableWorkflow"]] = None,
) -> None:
    """Build and inject Atlas's dynamic system prompt."""
    from aegisops.agent import scheduling
    scheduling._router_prompt = scheduling.router_prompt(available_agents, skills, workflows)
    agent_info.prompt = build_dynamic_rex_prompt(
        available_agents=available_agents,
        available_tools=tools,
        available_skills=skills,
        available_workflows=workflows or [],
    )


def build_dynamic_rex_prompt(
    available_agents: List["AvailableAgent"],
    available_tools: List["AvailableTool"],
    available_skills: List["AvailableSkill"],
    available_workflows: Optional[List["AvailableWorkflow"]] = None,
    use_task_system: bool = False,
) -> str:
    from aegisops.agent.prompt_utils import (
        build_agent_selection_table,
        build_key_triggers_section,
        build_workflows_section,
        build_anti_patterns_section,
    )
    from aegisops.agent.interaction_guidance import build_interaction_guidance

    _ = available_tools
    del use_task_system

    key_triggers = build_key_triggers_section(available_agents, available_skills)
    agent_selection = build_agent_selection_table(available_agents)
    skills_section = _build_rex_skills_section(available_skills)
    workflows_section = build_workflows_section(available_workflows or [])
    security_priority = _build_security_priority_section(available_agents)
    im_send_section = _build_im_send_pointer_section()
    anti_patterns = _build_rex_anti_patterns_section()
    command_guidance_section = _build_command_guidance_section()
    task_management_section = _task_management_section()
    todo_hook_note = "YOUR TODO CREATION WOULD BE TRACKED BY HOOK([SYSTEM REMINDER - TODO CONTINUATION])"

    from pathlib import Path
    from pathlib import Path
    template = Path(__file__).with_name("prompt.md").read_text(encoding="utf-8")
    template += "\n<AvailableCapabilities>\n__AGENT_SELECTION__\n__SKILLS_SECTION__\n__WORKFLOWS_SECTION__\n__SECURITY_PRIORITY__\n</AvailableCapabilities>\n__IM_SEND_SECTION__\n"
    prompt = template
    prompt = prompt.replace("__INTERACTION_GUIDANCE__", build_interaction_guidance())
    prompt = prompt.replace("__KEY_TRIGGERS__", key_triggers)
    prompt = prompt.replace("__AGENT_SELECTION__", agent_selection)
    prompt = prompt.replace("__SKILLS_SECTION__", skills_section)
    prompt = prompt.replace("__WORKFLOWS_SECTION__", workflows_section)
    prompt = prompt.replace("__SECURITY_PRIORITY__", security_priority)
    prompt = prompt.replace("__IM_SEND_SECTION__", im_send_section)
    prompt = prompt.replace("__ANTI_PATTERNS__", anti_patterns)
    prompt = prompt.replace("__COMMAND_GUIDANCE__", command_guidance_section)
    prompt = prompt.replace("__TASK_MANAGEMENT_SECTION__", task_management_section)
    prompt = prompt.replace("__TODO_HOOK_NOTE__", todo_hook_note)
    import re
    prompt = re.sub(r'\bAegisOps\b', 'AegisOps', prompt, flags=re.I)
    return prompt


def _build_rex_skills_section(available_skills: List["AvailableSkill"]) -> str:
    """Build a lightweight skills summary for Atlas orchestration."""
    if not available_skills:
        return ""

    lines = [
        "### Available Skills",
        "",
        "Call `skill_load` when the task clearly matches a skill's domain expertise.",
        "",
    ]
    for skill in available_skills:
        short_desc = (skill.description or "").split(".")[0].strip() or skill.name
        lines.append(f"- `{skill.name}`: {short_desc}")
    return "\n".join(lines)


def _build_rex_anti_patterns_section() -> str:
    """Merge hard blocks and anti-patterns into one Atlas section."""
    from aegisops.agent.prompt_utils import build_anti_patterns_section

    base_section = build_anti_patterns_section()
    if not base_section:
        return ""

    hard_block_rows = [
        "| **Hard Block** | Type error suppression (`as any`, `@ts-ignore`) |",
        "| **Hard Block** | Commit without explicit request |",
        "| **Hard Block** | Speculate about unread code |",
        "| **Hard Block** | Leave code in broken state after failures |",
    ]

    return base_section + "\n" + "\n".join(hard_block_rows)


def _build_command_guidance_section() -> str:
    return "Inspect `aegisops --help` and the installed deployment scripts before giving CLI commands. Use backend-only restart for explicitly authorized maintenance."


def _build_clarification_protocol() -> str:
    return """### Clarification Protocol

```
I want to make sure I understand correctly.

**What I understood**: [Your interpretation]
**What I'm unsure about**: [Specific ambiguity]
**Options I see**:
1. [Option A] - [effort/implications]
2. [Option B] - [effort/implications]

**My recommendation**: [suggestion with reasoning]

Should I proceed with [recommendation], or would you prefer differently?
```"""


def _task_management_section() -> str:
    clarification_protocol = _build_clarification_protocol()

    return f"""<Todo_Management>
## Todo Management

Use todos as the primary coordination mechanism for non-trivial execution work.

### When They Are Mandatory

| Trigger | Action |
|---------|--------|
| Multi-step work (2+ steps) | Create todos first |
| Uncertain scope | Create todos to structure the work |
| User request with multiple items | Create todos first |
| Complex single task | Break it into todos |

### Operating Rules

1. Start with `todo(action="write")` before implementation work begins.
2. ONLY add todos when the user wants execution, not when they only want analysis or planning.
3. Before each step, mark it `in_progress`. Keep only one item in progress.
4. After each step, mark it `completed` immediately. Never batch updates.
5. If scope changes, update the todos before continuing.

### Failure Modes

| Violation | Why It Breaks the Workflow |
|-----------|----------------------------|
| Skipping todos on non-trivial work | The user loses progress visibility and steps get dropped |
| Batch-completing multiple todos | Real-time tracking becomes meaningless |
| Proceeding without an in-progress item | It is unclear what is being worked on |
| Finishing without closing items | The work appears incomplete |

{clarification_protocol}
</Todo_Management>"""


def _build_security_priority_section(available_agents: List["AvailableAgent"]) -> str:
    """Build a Phase-0 security sub-agent priority routing section.

    Enumerates all security-tagged sub-agents and generates an explicit
    routing table with trigger signals, so Atlas reliably delegates security
    questions instead of attempting to answer them directly.
    """
    security_agents = [a for a in available_agents if a.metadata.category == "security"]
    if not security_agents:
        return ""

    # Curated routing hints for known security sub-agents.
    # Each entry provides a user-facing intent label and concrete trigger
    # phrases (in both Chinese and English) that Atlas should recognise.
    _ROUTING_HINTS: dict = {
        "ndr-analyst": {
            "intent": "网络流量日志 / NDR 告警分析",
            "signals": '"流量日志", "NDR", "告警分析", "网络攻击", "攻击是否成功", "network traffic", "alert analysis"',
        },
        "host-forensics-fast": {
            "intent": "Linux 主机快速排查 / 首轮研判",
            "signals": '"快速排查", "首轮排查", "快速研判", "快速看一下主机", "先看主机是否异常", "host triage", "quick triage"',
        },
        "host-forensics": {
            "intent": "Linux 主机入侵检测 / 取证",
            "signals": '"主机入侵", "挖矿", "后门", "webshell", "主机异常", "主机安全检查", "host compromise", "forensics"',
        },
        "phishing-detector": {
            "intent": "钓鱼邮件检测 / 可疑邮件分析",
            "signals": '"钓鱼邮件", "phishing", "suspicious email", "邮件 IOC", "email analysis"',
        },
        "asset-survey": {
            "intent": "互联网资产测绘 / 攻击面分析",
            "signals": '"资产测绘", "暴露面", "攻击面", "互联网资产", "asset survey", "attack surface", "recon"',
        },
        "vul-threat-intelligence": {
            "intent": "漏洞情报查询 / CVE 分析",
            "signals": '"漏洞情报", "CVE", "漏洞查询", "PoC", "KEV", "补丁", "vulnerability", "exploit"',
        },
        "hrti-threat-intelligence": {
            "intent": "热点威胁情报 / 攻击活动分析",
            "signals": '"威胁情报", "热点事件", "APT", "攻击活动", "安全事件", "threat intelligence", "threat actor"',
        },
    }

    rows: list = []
    for agent in security_agents:
        hint = _ROUTING_HINTS.get(agent.name)
        if hint:
            rows.append(
                f"| {hint['intent']} | `{agent.name}` | {hint['signals']} |"
            )
        else:
            # Fallback: derive from agent's declared triggers
            for trigger in agent.metadata.triggers:
                rows.append(
                    f"| {trigger.domain} | `{agent.name}` | {trigger.trigger} |"
                )

    if not rows:
        return ""

    routing_table = "\n".join(rows)
    agent_names = ", ".join(f"`{a.name}`" for a in security_agents)

    return f"""### Security Routing

当用户问题涉及网络安全主题时，先判断这是“轻量直查”还是“专家研判”，不要一律委派。
Available security specialists: {agent_names}

| 用户意图 | 优先委派 | 触发信号 |
|---------|---------|---------|
{routing_table}

**Routing rules:**
- Security specialists are subagents. Call them with `subagent_type=...`; do not place agent names inside `load_skills=[]`.
- Direct path: exactly one IOC, basic reputation or TI facts only, and no attribution, correlation, batching, or formal assessment needed.
- Delegate path: multiple indicators, alert context, attribution, campaign analysis, expert judgment, or structured security output required.
- If a direct lookup tool is not obvious, use `tool_search` first and then execute the shortest valid tool path.
- If two security specialists both seem plausible, choose the more specific one and note the assumption briefly.

**Lightweight direct lookup rules (Atlas handles directly):**
- Single IOC basic lookup only: one IP, domain, URL, or hash
- User intent is direct querying, checking reputation, or fetching basic TI facts
- No batching, attribution, multi-indicator correlation, campaign analysis, or expert report required
- Prefer: `tool_search` if needed -> direct TI query tool -> answer

**Mandatory delegation rules (use the specialist):**
- The request needs attribution, correlation, deep analysis, or expert judgment
- The user provides multiple IOCs, alert context, evidence, or asks for a structured security assessment
- The request matches one of the above specialist domains beyond a single direct lookup
- When ambiguous between two security agents, pick the more specific one and add a brief note

**Decision examples:**
- "查询 8.8.8.8 的情报" -> Atlas should directly query TI tools
- "分析这些 IOC 是否属于同一攻击活动" -> delegate to the appropriate specialist
- "结合告警上下文研判这批指标" -> delegate to the appropriate specialist

Security sub-agents still have dedicated toolsets and should be preferred for non-trivial security analysis."""


def _build_im_send_pointer_section() -> str:
    return """### IM Messaging

When the user wants to send a message to a connected messaging channel (including IM platforms and email), call `im_send_message`.
When creating a scheduled task that sends to a connected messaging channel later, resolve the target `session_id` with `im_send_message(resolve_only=true)` before calling `schedule_task(action="create", resource_type="scheduler", ...)`."""
