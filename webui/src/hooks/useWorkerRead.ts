import { useEffect, useState } from 'react';

/** Poll one session at a time. Keep the last good snapshot during a transient error. */
export function useWorkerRead<T>(
  sessionId: string | null,
  read: (id: string, signal: AbortSignal) => Promise<T>,
  nextDelay: (data: T) => number | null,
) {
  const [snapshot, setSnapshot] = useState<{ id: string; data?: T; stale: boolean }>();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    const controller = new AbortController();
    let timer: number | undefined;
    let pending = false;
    let lastGood: T | undefined;
    const load = async () => {
      if (pending || document.hidden || controller.signal.aborted) return;
      window.clearTimeout(timer);
      pending = true;
      let delay: number | null = 8000;
      try {
        lastGood = await read(sessionId, controller.signal);
        if (controller.signal.aborted) return;
        setSnapshot({ id: sessionId, data: lastGood, stale: false });
        delay = nextDelay(lastGood);
      } catch {
        if (!controller.signal.aborted) {
          setSnapshot((previous) => ({ id: sessionId, data: previous?.id === sessionId ? previous.data : undefined, stale: true }));
        }
      } finally {
        pending = false;
        if (!controller.signal.aborted && delay !== null) timer = window.setTimeout(load, delay);
      }
    };
    void load();
    document.addEventListener('visibilitychange', load);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [sessionId, read, nextDelay, revision]);

  return { ...(snapshot?.id === sessionId ? snapshot : undefined), refresh: () => setRevision((value) => value + 1) };
}
