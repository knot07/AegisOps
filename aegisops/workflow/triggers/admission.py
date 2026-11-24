"""Per-trigger, process-local admission for event deliveries."""

from __future__ import annotations

import asyncio
from collections import deque
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from typing import AsyncIterator

from .dispatcher import TriggerDispatchError
from .models import TriggerConcurrency


class TriggerBusy(TriggerDispatchError):
    """The delivery was refused before any workflow side effect."""


@dataclass
class _State:
    running: int = 0
    limit: int = 1
    waiting: deque[asyncio.Future[bool]] = field(default_factory=deque)

    def admit_waiting(self) -> None:
        while self.waiting and self.running < self.limit:
            future = self.waiting.popleft()
            if not future.done():
                self.running += 1
                future.set_result(True)


class TriggerAdmission:
    def __init__(self) -> None:
        self._states: dict[tuple[str, str], _State] = {}

    @asynccontextmanager
    async def slot(self, key: tuple[str, str], settings: TriggerConcurrency) -> AsyncIterator[None]:
        # All bookkeeping is synchronous on the dispatcher event loop. Hand
        # slots directly to queued deliveries so a new arrival cannot jump them.
        state = self._states.setdefault(key, _State())
        state.limit = 1 if settings.policy == "no_overlap" else settings.maxParallel
        state.admit_waiting()
        acquired = False
        ticket: asyncio.Future[bool] | None = None
        try:
            if state.running < state.limit:
                state.running += 1
                acquired = True
            else:
                if settings.policy in {"allow", "no_overlap"}:
                    raise TriggerBusy("Workflow trigger is at its concurrency limit")
                if len(state.waiting) >= settings.queueSize:
                    if settings.policy != "drop_oldest":
                        raise TriggerBusy("Workflow trigger queue is full")
                    while len(state.waiting) >= settings.queueSize:
                        oldest = state.waiting.popleft()
                        if not oldest.done():
                            oldest.set_result(False)
                ticket = asyncio.get_running_loop().create_future()
                state.waiting.append(ticket)
                try:
                    acquired = await asyncio.wait_for(asyncio.shield(ticket), timeout=30)
                except asyncio.TimeoutError as exc:
                    raise TriggerBusy("Timed out waiting for a workflow trigger slot") from exc
                if not acquired:
                    raise TriggerBusy("Delivery was evicted from the workflow trigger queue")
            yield
        finally:
            if ticket is not None and not ticket.done():
                state.waiting.remove(ticket)
                ticket.cancel()
            # Cancellation may arrive after a slot was reserved, but before
            # await resumed and assigned acquired.
            if acquired or (ticket is not None and ticket.done() and not ticket.cancelled() and ticket.result()):
                state.running -= 1
            state.admit_waiting()
            if not state.running and not state.waiting:
                self._states.pop(key, None)
