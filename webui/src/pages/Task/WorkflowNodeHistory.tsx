import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workflowAPI, type WorkflowExecution } from '@/api/workflow';
import type { TaskExecution } from '@/api/task';

export default function WorkflowNodeHistory({ task }: { task: TaskExecution }) {
  const { t } = useTranslation('task');
  const [history, setHistory] = useState<WorkflowExecution[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<WorkflowExecution | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const workflowId = task.workflowID;

  useEffect(() => {
    if (!workflowId || !task.startedAt) return;
    let current = true;
    setError(false);
    void (async () => {
      try {
        const { data } = await workflowAPI.getHistory(workflowId, { triggerId: task.id, triggerType: 'task', limit: 20 });
        if (current) setHistory(data);
      } catch {
        if (current) setError(true);
      }
    })();
    return () => { current = false; };
  }, [workflowId, task.id, task.startedAt, task.updatedAt, task.status, revision]);

  const selected = history?.find((row) => row.id === selectedId) ?? history?.[0];
  const id = selected?.id;
  const phase = selected?.status;
  const stepOffset = Math.max(0, (selected?.stepCount ?? 0) - 30);
  useEffect(() => {
    if (!workflowId || !id || phase === 'running') return;
    let current = true;
    void (async () => {
      try {
        const { data } = await workflowAPI.getExecution(workflowId, id, { stepOffset, stepLimit: 30 });
        if (current) setDetail(data);
      } catch {
        if (current) setError(true);
      }
    })();
    return () => { current = false; };
  }, [workflowId, id, phase, stepOffset, revision]);

  if (!workflowId || !task.startedAt) return null;
  const log = detail?.id === id ? detail : null;
  return (
    <section className="mt-3 rounded-xl border border-ui-border bg-ui-surface p-4" aria-label={t('nodeHistory.title')}>
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="mr-auto text-sm font-semibold text-ui-text">{t('nodeHistory.title')}</h4>
        <button type="button" onClick={() => setRevision((value) => value + 1)} className="rounded border border-ui-border px-2 py-1 text-xs text-ui-action hover:bg-ui-hover">{t('nodeHistory.refresh')}</button>
        {history && history.length > 1 && <select aria-label={t('nodeHistory.attempt')} value={id} onChange={(event) => setSelectedId(event.target.value)} className="rounded border border-ui-border bg-ui-canvas px-2 py-1 text-xs text-ui-text">
          {history.map((row) => <option key={row.id} value={row.id}>{t('nodeHistory.attemptNumber', { count: row.attempt ?? 1 })} · {new Date(row.startedAt).toLocaleString()}</option>)}
        </select>}
      </div>
      {error && <p role="status" className="mt-2 text-sm text-ui-secondary">{t('nodeHistory.error')}</p>}
      {!error && !selected && <p className="mt-2 text-sm text-ui-secondary">{t(history ? 'nodeHistory.empty' : 'nodeHistory.loading')}</p>}
      {selected?.status === 'running' && <p className="mt-2 text-sm text-ui-secondary">{t('nodeHistory.running')}</p>}
      {selected?.currentNodeId && <p className="mt-2 text-sm text-ui-text [overflow-wrap:anywhere]">{t(selected.status === 'error' || selected.status === 'timeout' ? 'nodeHistory.lastNodeAfterError' : 'nodeHistory.lastNode')}: <code>{selected.currentNodeId}</code></p>}
      {log && log.executionLog.length > 0 && <ol className="mt-2 space-y-2">
        {log.executionLog.map((step, index) => <li key={`${step.node_id}-${index}`} className="rounded-lg bg-ui-canvas px-3 py-2 text-xs text-ui-text [overflow-wrap:anywhere]">
          <code className="font-semibold">{step.node_id}</code>{step.node_type && <span className="ml-2 text-ui-secondary">{step.node_type}</span>}
          {step.error && <p className="mt-1 whitespace-pre-wrap text-rose-700 dark:text-rose-300">{step.error}</p>}
        </li>)}
      </ol>}
      {log && stepOffset > 0 && <p className="mt-2 text-xs text-ui-secondary">{t('nodeHistory.recentOnly')}</p>}
    </section>
  );
}
