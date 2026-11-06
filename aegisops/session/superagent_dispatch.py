"""Persist task ownership while reusing the existing asynchronous session runtime.

Task identity and Worker lifetime are independent of a Router inference turn.
Source: DeepSeek dsh-superagent-prototype concepts; independent native implementation.
"""
import asyncio
import hashlib
import time
from contextlib import asynccontextmanager
from aegisops.storage.storage import Storage

PREFIX = 'superagent.dispatch.'
_records = {}
_locks = {}
_slots = {}


def lock_for(parent):
    key = (id(asyncio.get_running_loop()), parent)
    return _locks.setdefault(key, asyncio.Lock())


def record_key(parent, task_key):
    return PREFIX + parent + '.' + hashlib.sha256(task_key.encode()).hexdigest()


async def records(parent):
    result = []
    for key in await Storage.list_keys(PREFIX + parent + '.'):
        row = await Storage.get(key)
        if isinstance(row, dict):
            # Process-local stop wins over an async persistence still in flight.
            cached = _records.get(row.get('worker'))
            result.append(cached if cached and cached.get('state') == 'stopped' else row)
    return result


async def register(ctx, worker, agent, task_key, scope):
    row = {'key':record_key(ctx.session_id, task_key), 'parent':ctx.session_id,
           'worker':worker, 'agent':agent, 'task_key':task_key, 'scope':scope,
           'state':'queued', 'created':time.time(), 'updated':time.time(),
           'inputs':[], 'report':'', 'input_calls':[ctx.call_id or ctx.message_id]}
    from aegisops.auth.context import get_current_auth_user
    user = get_current_auth_user()
    row['owner'] = user.id if user else None
    _records[worker] = row
    await Storage.set(row['key'], row)
    return row


async def update(worker, state, report=None):
    row = _records.get(worker)
    if not row:
        return
    async with lock_for(row['parent']):
        row = dict(_records[worker])
        if row['state'] == 'stopped' and state != 'stopped':
            return
        row.update(state=state, updated=time.time())
        if report is not None:
            row['report'] = str(report)[:12000]
        _records[worker] = row
        await Storage.set(row['key'], row)


@asynccontextmanager
async def worker_slot(worker):
    from aegisops.agent.scheduling import settings
    if worker not in _records:
        yield
        return
    limit = max(1, min(8, int(settings().get('max_workers', 3))))
    key = (id(asyncio.get_running_loop()), limit)
    semaphore = _slots.setdefault(key, asyncio.Semaphore(limit))
    async with semaphore:
        row = _records.get(worker)
        if row and row['state'] == 'stopped':
            raise asyncio.CancelledError()
        await update(worker, 'running')
        yield


async def try_reuse(ctx, task_key, prompt, agent):
    from aegisops.session.agent_inbox import AgentInbox, AgentMessage, authorize_message
    from aegisops.tool.registry import ToolResult
    if not task_key:
        return None
    row = await Storage.get(record_key(ctx.session_id, task_key))
    if not isinstance(row, dict):
        return None
    cached = _records.get(row['worker'])
    if cached and cached['state'] == 'stopped':
        row = cached
    if row['state'] == 'stopped':
        return ToolResult(success=False, error='This task was stopped. Use a new task_key for newly authorized work.')
    if row['agent'] != agent:
        return ToolResult(success=False, error='The task belongs to another Worker. Reuse its agent or choose a new task_key.')
    target = await authorize_message(ctx.session_id, row['worker'])
    if target.parent_id != ctx.session_id:
        return ToolResult(success=False, error='Worker does not belong to this Router.')
    _records[target.id] = row
    call = ctx.call_id or ctx.message_id
    if call not in row['input_calls']:
        from aegisops.utils.id import Identifier
        event = {'id':Identifier.create('message'), 'text':prompt, 'call':call}
        row = {**row, 'inputs':[*row['inputs'], event],
               'input_calls':[*row['input_calls'], call], 'state': 'running' if row['state'] == 'running' else 'queued', 'updated':time.time()}
        _records[target.id] = row
        await Storage.set(row['key'], row)
    else:
        event = next((x for x in row['inputs'] if x['call'] == call), None)
    if event:
        box = AgentInbox.get(target.id)
        box.parent_id, box.category = ctx.session_id, 'task'
        bind_result(target.id, ctx.event_publish_callback)
        for pending in row['inputs']:
            if not any(m.id == pending['id'] for m in box.messages):
                AgentInbox.post(target.id, AgentMessage(ctx.session_id, ctx.agent, pending['text'], id=pending['id']),
                                publisher=ctx.event_publish_callback, inbox=box)
    ctx.metadata({'title':task_key,'metadata':{'sessionId':target.id,'submitted':True,'status':'running','reused':True}})
    return ToolResult(success=True, title=task_key,
                      output={'status':'submitted','child_session_id':target.id,'task_key':task_key,'reused':True},
                      metadata={'sessionId':target.id,'submitted':True,'status':'running','reused':True})


async def acknowledge(worker, message_id):
    row = _records.get(worker)
    if not row or not any(x['id'] == message_id for x in row['inputs']):
        return
    async with lock_for(row['parent']):
        row = {**_records[worker], 'inputs':[x for x in _records[worker]['inputs'] if x['id'] != message_id]}
        _records[worker] = row
        await Storage.set(row['key'], row)


def bind_result(worker, publisher=None):
    from aegisops.session.agent_inbox import AgentInbox, AgentMessage
    from aegisops.session.message import Message
    from aegisops.session.session import Session
    row = _records[worker]
    box = AgentInbox.get(worker)
    # Use the existing result callback when first launched; this callback is
    # installed for explicit continuations, including after server recovery.
    parent_box = AgentInbox.get(row['parent'])
    async def result(outcome):
        if parent_box.stopped or box.stopped or _records[worker]['state'] == 'stopped':
            await update(worker, 'stopped')
            return
        aborted = bool((getattr(outcome, 'metadata', None) or {}).get('aborted'))
        state = 'interrupted' if aborted else 'completed' if outcome.action == 'stop' else 'failed'
        text = await Message.get_text_content(outcome.last_message) if getattr(outcome, 'last_message', None) else ''
        if not text:
            text = 'Worker interrupted; inspect existing effects before an explicit continuation.' if aborted else 'Worker ended without a text result.'
        await update(worker, state, text)
        if await Session.get_by_id(row['parent']):
            AgentInbox.post(row['parent'], AgentMessage(worker, row['agent'], f'Task {state}:\n{text}'),
                            publisher=publisher, inbox=parent_box)
    box.on_result = result
    box.result_callback_factory = lambda: result


def stop_records(session_id):
    """Called synchronously with Stop so a late report cannot reopen a mandate."""
    rows = [dict(row, state='stopped', updated=time.time()) for row in _records.values()
            if row['parent'] == session_id or row['worker'] == session_id]
    for row in rows:
        _records[row['worker']] = row
    if rows:
        from aegisops.session.core.task_utils import fire_and_forget
        async def save():
            for row in rows:
                async with lock_for(row['parent']):
                    await Storage.set(row['key'], row)
        fire_and_forget(save(), label='superagent.stop')


async def recover():
    """Recover task ownership, never replay unconfirmed external effects."""
    for key in await Storage.list_keys(PREFIX):
        row = await Storage.get(key)
        if not isinstance(row, dict) or not row.get('worker'):
            continue
        if row['state'] in {'queued', 'running'}:
            row.update(state='interrupted', updated=time.time(), report='服务重启中断了执行；明确继续后检查已有结果，再恢复原 Worker。')
            await Storage.set(key, row)
        _records[row['worker']] = row


def install():
    from aegisops.extensions import register_startup_hook
    register_startup_hook('aegis-superagent-dispatch', recover)
