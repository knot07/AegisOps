import asyncio

import pytest

from aegisops.workflow.triggers.admission import TriggerAdmission, TriggerBusy
from aegisops.workflow.triggers.models import TriggerConcurrency


@pytest.mark.asyncio
async def test_no_overlap_and_different_triggers_are_isolated():
    admission = TriggerAdmission()
    policy = TriggerConcurrency(policy="no_overlap", maxParallel=5)
    async with admission.slot(("flow", "first"), policy):
        with pytest.raises(TriggerBusy):
            async with admission.slot(("flow", "first"), policy):
                pytest.fail("overlapping delivery ran")
        async with admission.slot(("flow", "second"), policy):
            pass
    assert not admission._states


@pytest.mark.asyncio
@pytest.mark.parametrize("policy", ["queue", "drop_newest", "drop_oldest"])
async def test_waiting_deliveries_obey_queue_policy(policy):
    admission = TriggerAdmission()
    key = ("flow", "hook")
    settings = TriggerConcurrency(policy=policy, queueSize=1)
    order = []

    async def receive(name):
        async with admission.slot(key, settings):
            order.append(name)

    async with admission.slot(key, settings):
        oldest = asyncio.create_task(receive("oldest"))
        await asyncio.sleep(0)
        newest = asyncio.create_task(receive("newest"))
        await asyncio.sleep(0)
        with pytest.raises(TriggerBusy):
            await asyncio.wait_for(oldest if policy == "drop_oldest" else newest, 1)
        assert order == []
    await asyncio.wait_for(newest if policy == "drop_oldest" else oldest, 1)
    assert order == ["newest" if policy == "drop_oldest" else "oldest"]
    assert not admission._states


@pytest.mark.asyncio
async def test_cancellation_after_reserving_slot_does_not_leak_capacity():
    admission = TriggerAdmission()
    key = ("flow", "hook")
    policy = TriggerConcurrency(policy="queue")

    async def receive():
        async with admission.slot(key, policy):
            pytest.fail("cancelled waiter ran")

    async with admission.slot(key, policy):
        waiting = asyncio.create_task(receive())
        await asyncio.sleep(0)
    waiting.cancel()
    with pytest.raises(asyncio.CancelledError):
        await waiting
    assert not admission._states
