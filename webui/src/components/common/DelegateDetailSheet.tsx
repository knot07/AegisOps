import { useEffect, useId, useRef } from 'react';
import { ListChecks, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sessionApi, type WorkerDetail } from '@/api/session';
import { useWorkerRead } from '@/hooks/useWorkerRead';
import { StreamingMarkdown } from './StreamingMarkdown';
import { WorkerDuration, WorkerIdentity, WorkerStateBadge, useWorkerToolLabel, workerDisplayName, workerIsActive, workerText } from './WorkerPresentation';

export interface DelegateDetailSheetProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  agentName: string;
  description: string;
  status: string;
}

const detailDelay = (data: WorkerDetail) => workerIsActive(data.state) ? 2200 : null;

export default function DelegateDetailSheet({ open, onClose, sessionId, agentName, description, status }: DelegateDetailSheetProps) {
  const { t } = useTranslation('common');
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const { data, stale, refresh } = useWorkerRead(open ? sessionId : null, sessionApi.getWorkerDetail, detailDelay);
  const toolLabel = useWorkerToolLabel();
  const name = data?.agent || agentName;
  const state = data?.state ?? status;

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    element.showModal();
    return () => element.close();
  }, [open]);

  if (!open) return null;
  return (
    <dialog ref={dialog} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-4xl border-l border-ui-border bg-ui-surface p-0 text-ui-text shadow-2xl backdrop:bg-black/45">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-ui-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <WorkerIdentity name={name} />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-base font-semibold">{t('worker.detail')}</h2>
              <p className="truncate text-sm text-ui-secondary">{workerDisplayName(name)}</p>
            </div>
            <WorkerStateBadge state={state} />
            <button type="button" aria-label={t('worker.close')} onClick={onClose} className="rounded-lg p-2 hover:bg-ui-hover"><X className="size-5" /></button>
          </div>
          <div className="worker-reading-card worker-brief mt-3 bg-ui-subtle">
            <p>{workerText(data?.description || description)}</p>
            {data?.created != null && <div className="mt-1 text-xs text-ui-secondary"><WorkerDuration task={data} /></div>}
          </div>
        </header>
        {stale && <div role="status" className="flex items-center gap-3 border-b border-ui-border px-5 py-2 text-sm text-ui-secondary">
          {t('worker.stale')} <button type="button" onClick={refresh} className="font-semibold underline">{t('worker.retry')}</button>
        </div>}
        {!data && !stale && <p role="status" className="p-5 text-sm text-ui-secondary">{t('worker.loading')}</p>}
        {data && <div className="worker-detail-body min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:overflow-hidden">
          <section aria-label={t('worker.steps')} className="min-w-0 border-b border-ui-border p-4 md:overflow-y-auto md:border-b-0 md:border-r md:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4" />{t('worker.steps')}</h3>
            {data.steps.length > 0 ? <ol className="space-y-2">
              {data.steps.map((step) => <li key={step.id} className="flex items-center justify-between gap-2 rounded-lg border border-ui-border bg-ui-surface px-3 py-2 text-[13px] leading-relaxed">
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{workerText(toolLabel(step.tool))}</span><WorkerStateBadge state={step.status} />
              </li>)}
            </ol> : <p className="text-sm text-ui-secondary">{t('worker.noSteps')}</p>}
            {data.hasOlderSteps && <p className="mt-3 text-xs text-ui-secondary">{t('worker.olderSteps')}</p>}
          </section>
          <section aria-label={t('worker.result')} className="min-w-0 p-4 md:overflow-y-auto md:p-5">
            <h3 className="mb-3 text-sm font-semibold">{t('worker.result')}</h3>
            {data.report ? <div className="worker-reading-card worker-report-card">
              <StreamingMarkdown content={workerText(data.report)} isStreaming={false} />
              {data.reportMayBeTruncated && <p className="worker-report-meta">{t('worker.truncated')}</p>}
            </div> : <p className="worker-reading-card text-sm text-ui-secondary">{t(workerIsActive(state) ? 'worker.waitingResult' : 'worker.noResult')}</p>}
          </section>
        </div>}
      </div>
    </dialog>
  );
}
