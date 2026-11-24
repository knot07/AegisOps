import { Activity, Check, CirclePause, Clock3, OctagonX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WorkerTask } from '@/api/session';
import { AgentIdentity } from './VisualIdentity';
import './worker-cards.css';
import { resolveToolPresentation } from './toolPresentation';

export function workerDisplayName(name?: string | null) {
  if (!name) return '';
  return name.replace(/\brex[-_\s]junior\b/gi, 'Atlas Worker').replace(/\brex\b/gi, 'Atlas');
}

export function workerText(text: string) {
  return workerDisplayName(text);
}

export function workerIsActive(state: string) {
  return state === 'running' || state === 'queued' || state === 'pending';
}

export function WorkerIdentity({ name }: { name: string }) {
  const display = workerDisplayName(name);
  return <span aria-hidden="true" className="inline-flex shrink-0"><AgentIdentity name={/^atlas(?: worker)?$/i.test(display) ? 'atlas' : name} /></span>;
}

export function WorkerStateBadge({ state }: { state: string }) {
  const { t } = useTranslation('common');
  const normalized = state === 'error' ? 'failed' : state === 'pending' ? 'queued' : state;
  const Icon = normalized === 'running' ? Activity : normalized === 'completed' ? Check : normalized === 'failed' ? OctagonX : normalized === 'queued' ? Clock3 : CirclePause;
  const tone = normalized === 'running' || normalized === 'completed'
    ? 'bg-ui-selected worker-accent-ink'
    : normalized === 'failed' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-ui-hover text-ui-secondary';
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold leading-none ${tone}`}>
    <Icon className="size-3.5" aria-hidden="true" />{t(`worker.states.${normalized}`, { defaultValue: t('worker.states.unknown') })}
  </span>;
}

export function useWorkerToolLabel() {
  const { t } = useTranslation('session');
  return (tool: string) => resolveToolPresentation(tool, {}, t).label;
}

export function WorkerDuration({ task }: { task: WorkerTask }) {
  const { t } = useTranslation('common');
  if (!task.created) return null;
  const seconds = Math.max(0, Math.floor(((workerIsActive(task.state) ? Date.now() : task.updated ?? task.created) - task.created) / 1000));
  const min = Math.floor(seconds / 60);
  return <span className="tabular-nums">{min > 0 ? t('worker.durationMinutes', { min, sec: seconds % 60 }) : t('worker.durationSeconds', { sec: seconds })}</span>;
}
