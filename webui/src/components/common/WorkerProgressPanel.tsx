import { useId, useState } from 'react';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sessionApi, type WorkerProgress, type WorkerTask } from '@/api/session';
import { useWorkerRead } from '@/hooks/useWorkerRead';
import DelegateDetailSheet from './DelegateDetailSheet';
import { WorkerDuration, WorkerIdentity, WorkerStateBadge, useWorkerToolLabel, workerDisplayName, workerIsActive, workerText } from './WorkerPresentation';

const progressDelay = (data: WorkerProgress) => !data.enabled ? 12000 : data.tasks.some((task) => workerIsActive(task.state)) ? 2200 : 4500;

export default function WorkerProgressPanel({ sessionId, accelerated }: { sessionId: string; accelerated: boolean }) {
  const { t } = useTranslation('common');
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<WorkerTask | null>(null);
  const { data, stale, refresh } = useWorkerRead(sessionId, sessionApi.getWorkerProgress, accelerated ? fastProgressDelay : progressDelay);
  const toolLabel = useWorkerToolLabel();

  if (!data?.enabled) return null;
  const tasks = data?.tasks ?? [];
  const active = tasks.filter((task) => workerIsActive(task.state)).length;
  const task = selected && (tasks.find((row) => row.sessionID === selected.sessionID) ?? selected);

  return <>
    <aside aria-label={t('worker.title')} className={"relative order-first shrink-0 border-b border-ui-border bg-ui-surface lg:order-none lg:flex lg:h-full lg:w-[min(300px,34%)] lg:flex-col lg:border-b-0 lg:border-l"}>
      <div className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold">
        <ListChecks className="size-4 shrink-0 worker-accent-ink" aria-hidden="true" />
        <span className="hidden flex-1 lg:block">{t('worker.title')}</span>
        <button type="button" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded((value) => !value)} className={"flex flex-1 items-center justify-between gap-2 text-left lg:hidden"}>
          {t('worker.title')} <ChevronRight className={`size-4 ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
        <span className="shrink-0 rounded-full bg-ui-hover px-2 py-0.5 text-xs text-ui-secondary">{active > 0 ? t('worker.activeCount', { count: active }) : t('worker.taskCount', { count: tasks.length })}</span>
      </div>
      <div id={listId} className={`${expanded ? 'block' : 'hidden'} absolute inset-x-0 top-full z-20 min-h-0 max-h-[55dvh] space-y-2 overflow-y-auto border-b border-ui-border bg-ui-surface p-3 shadow-lg lg:static lg:block lg:max-h-none lg:flex-1 lg:border-t lg:shadow-none`}>
        {stale && <p role="status" className="px-1 text-xs text-ui-secondary">{t('worker.stale')} <button type="button" onClick={refresh} className="font-semibold underline">{t('worker.retry')}</button></p>}
        {!tasks.length && !stale && <p className="px-1 py-2 text-sm text-ui-secondary">{t(data ? 'worker.empty' : 'worker.loading')}</p>}
        {tasks.map((row) => <button key={row.sessionID} type="button" onClick={() => setSelected(row)} className="block w-full rounded-xl border border-ui-border bg-ui-canvas p-3 text-left transition-colors hover:bg-ui-hover focus-visible:outline focus-visible:outline-2">
          <span className="flex items-center gap-2">
            <WorkerIdentity name={row.agent ?? ''} />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{workerDisplayName(row.agent) || t('worker.defaultName')}</span>
            <WorkerStateBadge state={row.state} />
          </span>
          <span className="mt-2 line-clamp-2 break-words text-sm [overflow-wrap:anywhere]">{workerText(row.description)}</span>
          {row.latestStep && <span className="mt-1 block truncate text-xs text-ui-secondary">{workerText(toolLabel(row.latestStep.tool))}</span>}
          <span className="mt-2 flex items-center gap-1 text-xs text-ui-secondary"><WorkerDuration task={row} /><span className="ml-auto font-medium">{t('worker.openDetails')}</span><ChevronRight className="size-3.5" /></span>
        </button>)}
        {data?.hasMore && <p className="px-1 text-xs text-ui-secondary">{t('worker.moreTasks')}</p>}
      </div>
    </aside>
    {task && <DelegateDetailSheet key={task.sessionID} open onClose={() => setSelected(null)} sessionId={task.sessionID} agentName={task.agent || t('worker.defaultName')} description={task.description} status={task.state} />}
  </>;
}

const fastProgressDelay = (data: WorkerProgress) => data.tasks.some((task) => workerIsActive(task.state)) ? 2200 : 4500;
