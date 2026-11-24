/**
 * DelegateTaskCard — 子 Agent 委派卡片
 *
 * 当 ChatToolPart 检测到 delegate_task 工具时，
 * 替代普通工具卡片，展示子 Agent 名称、任务描述、执行状态和结果摘要。
 */

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Clock3, ListChecks, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { MessagePart, ToolState } from '@/types';
import { stripTaskMetadata } from '@/features/session-chat/display';
import DelegateDetailSheet from './DelegateDetailSheet';
import { WorkerIdentity, WorkerStateBadge, useWorkerToolLabel, workerDisplayName } from './WorkerPresentation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DELEGATE_TOOLS = new Set(['delegate_task', 'task']);

export function isDelegateTool(toolName: string): boolean {
  return DELEGATE_TOOLS.has(toolName);
}

export function shouldRenderDelegateTaskCard(part: MessagePart): boolean {
  // 1. Explicit delegate tool: render the card.
  if (part.tool && isDelegateTool(part.tool)) {
    return true;
  }

  const state: Partial<ToolState> = part.state || {};
  const input = state.input || {};

  // 2. Unknown/missing tool: only upgrade if the part *also* carries
  //    delegate-shaped input. This prevents MCP tools (e.g. wecom_mcp,
  //    threatbook_mcp) from being misclassified just because their output
  //    happens to contain a `<task_metadata>` block.
  if (!part.tool || part.tool === 'unknown') {
    const hasDelegateInput =
      (typeof input.subagent_type === 'string' && input.subagent_type.trim()) ||
      (typeof input.category === 'string' && input.category.trim());
    if (!hasDelegateInput) {
      return false;
    }
    const output = typeof state.output === 'string' ? state.output : undefined;
    return !!extractSessionId(state.metadata, output);
  }
  return false;
}

interface ActivityStep {
  tool: string;
  title: string;
  status: 'running' | 'completed' | 'error';
}

interface DelegateInfo {
  agentName: string;
  description: string;
  isBackground: boolean;
  childSessionId?: string;
  status: string;
  error?: string;
  output?: string;
  durationMs: number | null;
  steps: ActivityStep[];
  stepCount: number;
  currentText: string;
  elapsed: number;
}

function extractSessionId(
  meta: Record<string, any> | undefined,
  output: string | undefined,
): string | undefined {
  // Top-level meta only trusts the canonical `sessionId` key. Variant
  // casings (sessionID / session_id) are accepted only in the nested
  // `metadata` envelope to avoid matching arbitrary tool metadata that
  // happens to use snake_case or PascalCase.
  const innerMeta = meta?.metadata as Record<string, any> | undefined;
  const sessionId =
    meta?.sessionId ??
    innerMeta?.sessionId ??
    innerMeta?.sessionID ??
    innerMeta?.session_id;

  if (typeof sessionId === 'string' && sessionId.trim()) {
    return sessionId.trim();
  }

  if (!output) return undefined;
  const match = output.match(/<task_metadata>[\s\S]*?session_id:\s*([^\n<]+)[\s\S]*?<\/task_metadata>/i);
  return match?.[1]?.trim() || undefined;
}

export function extractDelegateInfo(state: Partial<ToolState>, subTaskLabel: string): DelegateInfo {
  const input = state.input || {};
  const agentRaw = input.subagent_type || input.category || 'unknown';
  const agentName = typeof agentRaw === 'string'
    ? agentRaw.charAt(0).toUpperCase() + agentRaw.slice(1)
    : String(agentRaw);

  let durationMs: number | null = null;
  if (state.time?.start) {
    const end = state.time.end || Date.now();
    durationMs = end - state.time.start;
  }

  let output: string | undefined;
  if (state.output !== undefined && state.output !== null) {
    output = typeof state.output === 'string' ? state.output : JSON.stringify(state.output);
  }

  // metadata can be flat { sessionId, ... } (completed state / ToolResult)
  // or double-nested { title, metadata: { sessionId, ... } } (ctx.metadata callback during running)
  const meta = state.metadata as Record<string, any> | undefined;
  const innerMeta = meta?.metadata as Record<string, any> | undefined;

  const childSessionId = extractSessionId(meta, typeof state.output === 'string' ? state.output : undefined);
  const steps = (meta?.steps ?? innerMeta?.steps ?? []) as ActivityStep[];
  const stepCount = (meta?.stepCount ?? innerMeta?.stepCount ?? 0) as number;
  const currentText = (meta?.currentText ?? innerMeta?.currentText ?? '') as string;
  const elapsed = (meta?.elapsed ?? innerMeta?.elapsed ?? 0) as number;
  const isBackground = !!input.run_in_background || Boolean(meta?.background ?? innerMeta?.background);
  const submitted = Boolean(meta?.submitted ?? innerMeta?.submitted);
  const runtimeStatus = meta?.status ?? innerMeta?.status;
  if (submitted) {
    output = meta?.result ?? innerMeta?.result;
    const finishedAt = meta?.finished_at ?? innerMeta?.finished_at;
    durationMs = state.time?.start ? (finishedAt || Date.now()) - state.time.start : null;
  }
  if (output !== undefined && output !== null) {
    output = stripTaskMetadata(typeof output === 'string' ? output : JSON.stringify(output)).trim() || undefined;
  }
  const error = state.error ? stripTaskMetadata(state.error).trim() || undefined : undefined;
  const backgroundStatus = isBackground
    ? (typeof runtimeStatus === 'string' && runtimeStatus.trim()
      ? runtimeStatus
      : state.status === 'completed' && childSessionId
        ? 'running'
        : undefined)
    : undefined;

  return {
    agentName,
    description: input.description || subTaskLabel,
    isBackground,
    childSessionId,
    status: (submitted ? runtimeStatus : backgroundStatus) || state.status || 'pending',
    error: submitted && runtimeStatus === 'error' ? output : error,
    output,
    durationMs,
    steps,
    stepCount,
    currentText,
    elapsed,
  };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = Math.round(secs % 60);
  return `${mins}m${remainSecs}s`;
}

function truncateOutput(text: string, maxLen = 300): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export interface DelegateTaskCardProps {
  part: MessagePart;
  processStep?: boolean;
}

export default function DelegateTaskCard({ part, processStep = false }: DelegateTaskCardProps) {
  const { t } = useTranslation('common');
  const toolLabel = useWorkerToolLabel();
  const state: Partial<ToolState> = part.state ?? {};
  let info: DelegateInfo;
  try {
    info = extractDelegateInfo(state, t('delegate.subTask'));
  } catch {
    info = extractDelegateInfo({}, t('delegate.subTask'));
  }
  const agent = info.agentName === 'Unknown' ? t('worker.defaultName') : workerDisplayName(info.agentName);
  const startedAt = state.time?.start;
  const running = info.status === 'running';
  const [sheetOpen, setSheetOpen] = useState(false);
  const [now, setNow] = useState(Date.now);
  const elapsed = running && startedAt ? Math.max(0, now - startedAt) : info.durationMs ?? info.elapsed;
  const latest = running && Array.isArray(info.steps)
    ? [...info.steps].reverse().find((step) => step?.status === 'running') ?? info.steps[info.steps.length - 1]
    : undefined;
  const canShowError = ['error', 'failed', 'interrupted', 'stopped'].includes(info.status);

  useEffect(() => {
    if (!running || !startedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [running, startedAt]);

  return (
    <>
      <div
        data-testid={processStep ? 'chat-process-delegate-step' : 'chat-delegate-card'}
        className="min-w-0 rounded-xl border border-ui-border bg-ui-surface text-ui-text"
      >
        <div className="flex items-start gap-2.5 px-3 py-2.5 sm:gap-3">
          <WorkerIdentity name={agent} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="break-words text-sm font-semibold [overflow-wrap:anywhere]">{t('delegate.delegatedTo', { agent })}</span>
              {info.isBackground && <span className="rounded-full bg-ui-hover px-2 py-0.5 text-xs font-medium text-ui-secondary">{t('delegate.background')}</span>}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ui-secondary [overflow-wrap:anywhere]">{info.description}</p>
          </div>
          <WorkerStateBadge state={info.status} />
        </div>

        {(elapsed > 0 || info.stepCount > 0 || latest?.tool || info.childSessionId) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ui-border px-3 py-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ui-secondary">
              {elapsed > 0 && <span className="inline-flex items-center gap-1 tabular-nums"><Clock3 className="size-3.5" aria-hidden="true" />{t(running ? 'delegate.elapsedRunning' : 'delegate.elapsedDone')} {formatDuration(elapsed)}</span>}
              {info.stepCount > 0 && <span className="inline-flex items-center gap-1 tabular-nums"><ListChecks className="size-3.5" aria-hidden="true" />{info.stepCount} {t('delegate.steps')}</span>}
              {latest?.tool && <span className="min-w-0 truncate">{toolLabel(latest.tool)}</span>}
            </div>
            {info.childSessionId && (
              <button type="button" onClick={() => setSheetOpen(true)} className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ui-border bg-ui-canvas px-2.5 py-1.5 text-xs font-semibold worker-accent-ink transition-colors hover:bg-ui-selected focus-visible:outline focus-visible:outline-2">
                {t('delegate.viewExecution')}<ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {canShowError && info.error && (
          <div className="flex items-start gap-1.5 border-t border-ui-border px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
            <XCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="break-words [overflow-wrap:anywhere]">{info.error}</span>
          </div>
        )}

        {info.status === 'completed' && info.output && (
          <details className="group/delegate-result border-t border-ui-border px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded text-xs font-medium text-ui-secondary hover:text-ui-text [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-3.5 transition-transform group-open/delegate-result:rotate-180" aria-hidden="true" />
              {t('delegate.resultSummary')}
            </summary>
            <p className="worker-reading-card worker-summary-text mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{truncateOutput(info.output)}</p>
          </details>
        )}
      </div>

      {sheetOpen && info.childSessionId && (
        <DelegateDetailSheet open onClose={() => setSheetOpen(false)} sessionId={info.childSessionId} agentName={agent} description={info.description} status={info.status} />
      )}
    </>
  );
}
