import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from aegisops.agent import scheduling
from aegisops.agent.agent import AgentInfo
from aegisops.session import superagent_dispatch as dispatch
from aegisops.session.agent_inbox import AgentInbox
from aegisops.session.session import Session
from aegisops.session.session_loop import SessionLoop, LoopResult
from aegisops.storage.storage import Storage
from aegisops.tool.registry import ToolContext, ToolRegistry
from aegisops.tool.agent.delegate_task import delegate_task_tool


@pytest.fixture(autouse=True)
async def clean(monkeypatch):
    token = scheduling._mode.set('superagent')
    dispatch._records.clear(); dispatch._locks.clear(); dispatch._slots.clear()
    monkeypatch.setattr(AgentInbox, 'wake', lambda *args: None)
    yield
    for _, job in list(AgentInbox._children.values()): job.cancel()
    await asyncio.gather(*(job for _, job in list(AgentInbox._children.values())), return_exceptions=True)
    await asyncio.sleep(0)
    AgentInbox._children.clear(); AgentInbox._inboxes.clear(); AgentInbox._wakes.clear()
    dispatch._records.clear(); dispatch._locks.clear(); dispatch._slots.clear()
    scheduling._mode.reset(token)


async def parent(tmp_path, mode='superagent'):
    return await Session.create(project_id='p', directory=str(tmp_path), agent='rex', scheduling_mode=mode)


def ctx(p, call):
    return ToolContext(p.id, 'msg-'+call, call_id=call, agent='rex', extra={'agent_execution_session':True})


async def test_modes_isolated_and_default_legacy(tmp_path):
    p1=await parent(tmp_path); p2=await parent(tmp_path, 'legacy')
    gate=asyncio.Event()
    @scheduling.session_mode
    async def run(cls, session_id):
        before=scheduling.enabled()
        await gate.wait()
        return before,scheduling.enabled()
    a=asyncio.create_task(run(None,p1.id)); b=asyncio.create_task(run(None,p2.id))
    await asyncio.sleep(0); gate.set()
    assert await a == (True, True)
    assert await b == (False, False)
    assert (await Session.get_by_id(p1.id)).scheduling_mode == 'superagent'
    assert (await Session.create(project_id='p',directory=str(tmp_path),agent='rex')).scheduling_mode == 'legacy'


async def test_runtime_policy_never_mutates_shared_agent():
    agent=AgentInfo(name='rex',mode='primary',prompt='legacy prompt',tools=['shell'])
    router=scheduling.runtime_agent(agent,'unknown')
    assert router is not agent and set(router.tools) == scheduling.ROUTER_TOOLS
    assert 'persistent Router' in router.prompt
    assert agent.prompt=='legacy prompt' and agent.tools==['shell']
    token=scheduling._mode.set('legacy')
    try: assert scheduling.runtime_agent(agent,'unknown') is agent
    finally: scheduling._mode.reset(token)


async def test_router_cannot_execute_even_after_tool_search(tmp_path):
    p=await parent(tmp_path)
    result=await ToolRegistry.execute('shell',ctx=ctx(p,'execute'),command='must never run')
    assert not result.success and 'Router' in result.error


async def test_task_reuse_idempotency_separate_tasks_and_stop(tmp_path,monkeypatch):
    p=await parent(tmp_path)
    monkeypatch.setattr('aegisops.tool.agent.delegate_task.is_delegatable',lambda _:True)
    release=asyncio.Event(); started=[]
    async def run(sid,**kwargs):
        started.append(sid); await release.wait(); return LoopResult(action='stop')
    monkeypatch.setattr(SessionLoop,'run',run)
    async def submit(key,call,prompt='Original scoped task'):
        return await delegate_task_tool(ctx(p,call),subagent_type='explore',prompt=prompt,description='task',task_key=key)
    one=await asyncio.wait_for(submit('one','1'),2)
    two=await asyncio.wait_for(submit('two','2'),2)
    first=one.output['child_session_id']; second=two.output['child_session_id']
    assert first != second and one.success and two.success
    follow=await submit('one','3','Explicit follow-up')
    assert follow.success and follow.output['reused'] and follow.output['child_session_id']==first
    assert len(await dispatch.records(p.id))==2
    pending=list(AgentInbox.get(first).messages)
    assert len(pending)==1 and pending[0].content=='Explicit follow-up'
    await submit('one','3','Explicit follow-up')
    assert len(AgentInbox.get(first).messages)==1
    await dispatch.acknowledge(first,pending[0].id)
    AgentInbox.get(first).messages.clear()
    await submit('one','3','Explicit follow-up')
    assert not AgentInbox.get(first).messages
    dispatch.stop_records(first)
    denied=await submit('one','4')
    assert not denied.success and 'stopped' in denied.error
    await dispatch.update(first,'completed','late result')
    assert dispatch._records[first]['state']=='stopped'
    release.set()
    await asyncio.gather(*(job for _,job in list(AgentInbox._children.values())),return_exceptions=True)


async def test_parent_and_agent_scope_boundaries(tmp_path):
    p=await parent(tmp_path); other=await parent(tmp_path)
    child=await Session.create(project_id='p', directory=str(tmp_path),parent_id=p.id,agent='explore')
    await dispatch.register(ctx(p,'original'),child.id,'explore','shared','Task scope')
    assert await dispatch.try_reuse(ctx(other,'new'),'shared','follow-up','explore') is None
    wrong=await dispatch.try_reuse(ctx(p,'wrong'),'shared','follow-up','another-agent')
    assert not wrong.success


async def test_concurrency_cap_and_recovery_without_auto_replay(tmp_path,monkeypatch):
    p=await parent(tmp_path)
    monkeypatch.setattr(scheduling,'settings',lambda:{'max_workers':2})
    for i in range(4): await dispatch.register(ctx(p,str(i)),str(i),'explore',str(i),'Scope')
    gate=asyncio.Event(); active=0; high=0; started=asyncio.Event()
    async def work(worker):
        nonlocal active,high
        async with dispatch.worker_slot(worker):
            active+=1; high=max(high,active)
            if active==2:started.set()
            await gate.wait(); active-=1
    jobs=[asyncio.create_task(work(str(i))) for i in range(4)]
    await asyncio.wait_for(started.wait(),2)
    assert high==2 and sum(row['state']=='running' for row in dispatch._records.values())==2
    gate.set(); await asyncio.gather(*jobs)
    dispatch._records.clear()
    await dispatch.recover()
    assert all(row['state']=='interrupted' for row in await dispatch.records(p.id))
    assert not AgentInbox._children and not AgentInbox._wakes


async def test_session_mode_schema_and_api_guard():
    from aegisops.server.routes.session import SessionUpdateRequest, PromptRequest
    from pydantic import ValidationError
    assert SessionUpdateRequest(scheduling_mode='legacy').scheduling_mode=='legacy'
    assert PromptRequest(schedulingMode='superagent').scheduling_mode=='superagent'
    with pytest.raises(ValidationError): SessionUpdateRequest(scheduling_mode='unknown')
