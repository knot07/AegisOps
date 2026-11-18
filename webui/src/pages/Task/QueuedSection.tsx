import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ListTodo, Play, RotateCcw, XCircle, Trash2,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { useTaskExecutions } from '@/hooks/useTasks';
import { taskAPI, TaskExecution, TaskListParams } from '@/api/task';
import { copyText } from '@/utils/clipboard';
import { StatusBadge, PriorityBadge, SourceBadge, ModeBadge, ActionButton } from './components';
import { formatTime, formatDuration, PAGE_SIZE } from './helpers';
import { extractErrorMessage } from '@/utils/error';
import ModuleEmblem from '@/components/common/ModuleEmblem';
import './execution-detail.css';
import ExecutionFilters, { type ExecutionSearchParams } from './ExecutionFilters';

const DETAIL_POLL_INTERVAL_MS = 30000;
const LazySessionChat = lazy(() => import('@/components/common/SessionChat'));

function SessionChatFallback() {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center text-gray-400">
      <LoadingSpinner />
    </div>
  );
}

export default function QueuedSection({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const { t } = useTranslation('task');
  const [filterKey, setFilterKey] = useState('all');
  const [searchFilters, setSearchFilters] = useState<ExecutionSearchParams>({});
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [detailTask, setDetailTask] = useState<TaskExecution | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const QUEUED_FILTERS: { key: string; label: string; filter: Partial<TaskListParams> }[] = [
    { key: 'all',       label: t('queued.filterAll'),       filter: {} },
    { key: 'completed', label: t('queued.filterCompleted'), filter: { status: 'completed' } },
    { key: 'failed',    label: t('queued.filterFailed'),    filter: { status: 'failed' } },
  ];

  const currentFilter = QUEUED_FILTERS.find(f => f.key === filterKey)?.filter ?? {};
  const listParams = { ...searchFilters, ...currentFilter, offset: page * PAGE_SIZE, limit: PAGE_SIZE };
  const hasFilters = filterKey !== 'all' || Object.values(searchFilters).some(Boolean);

  const { tasks, total, loading, error, refetch } = useTaskExecutions(listParams, { pollInterval: 5000 });
  const effectiveTasks = useMemo(() => {
    if (!detailTask) return tasks;
    return tasks.map((task) => (task.id === detailTask.id ? detailTask : task));
  }, [tasks, detailTask]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const refresh = useCallback(() => { refetch(); onRefreshGlobal(); }, [refetch, onRefreshGlobal]);
  const visibleSelectedIds = effectiveTasks
    .filter(task => selectedTasks.has(task.id))
    .map(task => task.id);
  const hasVisibleSelection = visibleSelectedIds.length > 0;
  const allVisibleSelected = effectiveTasks.length > 0 && effectiveTasks.every(task => selectedTasks.has(task.id));

  // Keep detailTask in sync: update from list data when available,
  // but never clear it just because the task left the current page.
  useEffect(() => {
    if (!selectedId) { setDetailTask(null); return; }
    if (detailTask?.id === selectedId) return;
    const found = tasks.find(t => t.id === selectedId);
    if (found) setDetailTask(found);
  }, [tasks, selectedId, detailTask?.id]);

  // Selection is scoped to the current visible list so users never batch
  // operate on hidden rows from a previous page or filter.
  useEffect(() => {
    setSelectedTasks(prev => {
      let changed = false;
      const visibleIds = new Set(effectiveTasks.map(task => task.id));
      const next = new Set<string>();
      prev.forEach(id => {
        if (visibleIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [effectiveTasks]);

  const markViewedIfNeeded = useCallback(async (task: TaskExecution) => {
    if (task.status !== 'completed' || task.deliveryStatus !== 'unread') {
      return task;
    }
    try {
      const res = await taskAPI.markExecutionViewed(task.id);
      refresh();
      return res.data;
    } catch {
      return task;
    }
  }, [refresh]);

  // When the user selects a task, also fetch it directly to be sure
  // we have the latest data even if it's not on the current page.
  const fetchDetailTask = useCallback(async (taskId: string) => {
    try {
      const res = await taskAPI.getExecution(taskId);
      const detail = await markViewedIfNeeded(res.data);
      setDetailTask(detail);
    } catch { /* ignore — list sync will cover it */ }
  }, [markViewedIfNeeded]);

  // The detail drawer is intentionally kept open across page/filter changes,
  // so we must refresh it by ID rather than looking it up in the current page.
  const refreshWithDetail = useCallback(() => {
    refresh();
    if (selectedId) {
      fetchDetailTask(selectedId);
    }
  }, [refresh, selectedId, fetchDetailTask]);

  // The execution detail drawer must stay in sync even when the selected row
  // disappears from the current list/filter (for example when a stale
  // "completed" item becomes running again, or vice versa). Poll by ID while
  // the drawer is open so the badge and SessionChat live-state reflect the
  // latest backend truth instead of the last list snapshot.
  useEffect(() => {
    if (!selectedId) return;

    const timerId = window.setInterval(() => {
      void fetchDetailTask(selectedId);
    }, DETAIL_POLL_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [selectedId, fetchDetailTask]);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetailTask(null);
  }, []);

  const openDetail = useCallback((task: TaskExecution) => {
    if (selectedId === task.id) {
      closeDetail();
      return;
    }
    setSelectedId(task.id);
    setDetailTask(task);
    fetchDetailTask(task.id);
  }, [selectedId, closeDetail, fetchDetailTask]);

  const handleAction = async (action: string, taskId: string) => {
    try {
      switch (action) {
        case 'cancel':
          await taskAPI.cancelExecution(taskId);
          break;
        case 'retry':  await taskAPI.retryExecution(taskId);  break;
        case 'continue': await taskAPI.continueExecution(taskId); break;
        case 'rerun':
          await taskAPI.rerunExecution(taskId);
          break;
        case 'delete': {
          const ok = await confirm({
            description: t('queued.confirmDelete'),
            variant: 'danger',
            confirmText: t('common:button.delete'),
          });
          if (!ok) return;
          await taskAPI.deleteExecution(taskId);
          if (selectedId === taskId) closeDetail();
          break;
        }
      }
      refresh();
      if (selectedId === taskId) {
        fetchDetailTask(taskId);
      }
    } catch (err: unknown) {
      toast.error(t('queued.actionFailed'), extractErrorMessage(err));
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedTasks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleBatchCancel = async () => {
    if (!hasVisibleSelection) return;
    const executionIds = [...new Set(visibleSelectedIds)];
    const ok = await confirm({
      description: t('queued.confirmBatchCancel', { count: executionIds.length }),
      variant: 'warning',
      confirmText: t('queued.confirmBatchCancelBtn'),
    });
    if (!ok) return;
    try {
      await taskAPI.batchCancelExecutions(executionIds);
      setSelectedTasks(new Set());
      refresh();
    } catch (err: unknown) {
      toast.error(t('queued.actionFailed'), extractErrorMessage(err));
    }
  };

  const handleBatchDelete = async () => {
    if (!hasVisibleSelection) return;
    const executionIds = [...new Set(visibleSelectedIds)];
    const ok = await confirm({
      description: t('queued.confirmBatchDelete', { count: executionIds.length }),
      variant: 'danger',
      confirmText: t('common:button.delete'),
    });
    if (!ok) return;
    try {
      await taskAPI.batchDeleteExecutions(executionIds);
      setSelectedTasks(new Set());
      if (selectedId && selectedTasks.has(selectedId)) closeDetail();
      refresh();
    } catch (err: unknown) {
      toast.error(t('queued.actionFailed'), extractErrorMessage(err));
    }
  };

  const handleToggleSelectAll = () => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        effectiveTasks.forEach(task => next.delete(task.id));
      } else {
        effectiveTasks.forEach(task => next.add(task.id));
      }
      return next;
    });
  };

  const handleFilterChange = (nextFilterKey: string) => {
    setFilterKey(nextFilterKey);
    setPage(0);
    setSelectedTasks(new Set());
    closeDetail();
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSelectedTasks(new Set());
  };

  const handleSearch = (filters: ExecutionSearchParams) => {
    setSearchFilters(filters);
    setPage(0);
    setSelectedTasks(new Set());
    closeDetail();
  };

  return (
    <div className="space-y-3">
      <ExecutionFilters
        onSearch={handleSearch}
        onReset={() => { setFilterKey('all'); handleSearch({}); }}
      />
      <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-2">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-md:max-w-full max-md:overflow-x-auto">
          {QUEUED_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors max-md:shrink-0 max-md:whitespace-nowrap ${
                filterKey === f.key ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {hasVisibleSelection && (
          <div className="flex items-center gap-2 max-md:flex-wrap">
            <span className="text-sm text-gray-500">{t('queued.selectedCount', { count: visibleSelectedIds.length })}</span>
            <button onClick={handleBatchCancel} className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100">{t('queued.batchCancel')}</button>
            <button onClick={handleBatchDelete} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100">{t('queued.batchDelete')}</button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-md:overflow-x-auto">
        {loading && effectiveTasks.length === 0 ? (
          <div className="flex justify-center py-12"><LoadingSpinner delayMs={180} /></div>
        ) : error ? (
          <div role="alert" className="text-center py-12 text-red-500">{error}</div>
        ) : effectiveTasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="w-8 h-8" />}
            title={t(hasFilters ? 'queued.filterEmptyTitle' : 'queued.emptyTitle')}
            description={t(hasFilters ? 'queued.filterEmptyDescription' : 'queued.emptyDescription')}
          />
        ) : (
          <>
            <table className="w-full text-sm max-md:min-w-[44rem]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colStatus')}</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colSource')}</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colName')}</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colMode')}</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colPriority')}</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-600">{t('queued.colTime')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {effectiveTasks.map(task => (
                  <tr
                    key={task.id}
                    onClick={() => openDetail(task)}
                    className={`cursor-pointer transition-colors ${selectedId === task.id ? 'bg-slate-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedTasks.has(task.id)} onChange={() => toggleSelect(task.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-3 py-3"><SourceBadge sourceType={task.source?.sourceType ?? 'user_conversation'} /></td>
                    <td className="px-3 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {task.deliveryStatus === 'unread' && task.status === 'completed' && (
                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full inline-block mr-1.5 mb-0.5 align-middle" />
                      )}
                      {task.title}
                    </td>
                    <td className="px-3 py-3"><ModeBadge mode={task.executionMode} agent={task.agentName} /></td>
                    <td className="px-3 py-3"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {task.startedAt
                        ? formatTime(task.startedAt)
                        : task.queuedAt
                        ? formatTime(task.queuedAt)
                        : formatTime(task.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">
                {t('queued.pagination', { total, page: page + 1, totalPages })}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailTask && (
        <QueuedDetailPanel task={detailTask} onClose={closeDetail} onAction={handleAction} onRefresh={refreshWithDetail} />
      )}
    </div>
  );
}

function QueuedDetailPanel({ task, onClose, onAction, onRefresh }: {
  task: TaskExecution;
  onClose: () => void;
  onAction: (action: string, taskId: string) => void;
  onRefresh?: () => void;
}) {
  const { t } = useTranslation('task');
  const sessionId = task.sessionID;
  const isWorkflowExecution = task.executionMode === 'workflow';
  const shouldStreamSession = Boolean(sessionId);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = document.querySelector<HTMLElement>('.execution-drawer');
    panel?.querySelector<HTMLElement>('button')?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,input,textarea,[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
        const first=items[0], last=items[items.length-1];
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {document.removeEventListener('keydown',handleKey);previous?.focus();};
  }, [onClose]);
  const emptyText = ['pending', 'queued'].includes(task.status)
    ? t('queued.detailWaiting')
    : t('queued.detailNoRecord');
  return (
    <>
      <div className="execution-backdrop fixed inset-0 z-40" onClick={onClose} />
      <div data-yushu-drawer
        role="dialog" aria-modal="true" aria-label={task.title} className="execution-drawer fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl max-md:!w-full"
        style={{ width: 720, maxWidth: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="execution-heading flex items-center justify-between px-6 py-4 border-b flex-shrink-0 max-md:px-4">
          <div className="execution-title"><ModuleEmblem kind="task" size="nav"/><div><small>任务中心 · 执行详情</small><h3 className="font-semibold text-gray-900 pr-2">{task.title}</h3></div></div>
          <button aria-label="关闭执行详情" onClick={onClose} className="execution-close p-1 rounded hover:bg-gray-100 flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="execution-meta px-6 py-4 border-b border-gray-100 flex-shrink-0 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <ModeBadge mode={task.executionMode} agent={task.agentName} />
            {task.durationMs != null && (
              <span className="text-xs text-gray-400">{formatDuration(task.durationMs)}</span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 break-words">{task.description}</p>
          )}

          {(task.executionInputSnapshot?.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.executionInputSnapshot.tags.map((tag: string) => <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>)}
            </div>
          )}

          {task.status === 'failed' && task.retry?.blockedReason === 'unverified_effects' && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <p>{t('queued.heldForVerification')}</p>
              {(task.retry.unverifiedEffects?.length ?? 0) > 0 && (
                <p className="mt-1 break-all font-mono">{task.retry.unverifiedEffects!.join(', ')}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {!['completed', 'cancelled', 'failed'].includes(task.status) && (
              <ActionButton icon={<XCircle className="w-3 h-3" />} label={t('queued.actionCancel')} onClick={() => onAction('cancel', task.id)} color="gray" />
            )}
            {task.status === 'failed' && task.retry?.blockedReason === 'unverified_effects' && task.sessionID && (
              <ActionButton icon={<Play className="w-3 h-3" />} label={t('queued.actionResume')} onClick={() => onAction('continue', task.id)} color="blue" />
            )}
            {task.status === 'failed' && (
              <ActionButton icon={<RotateCcw className="w-3 h-3" />} label={t('queued.actionRetry')} onClick={() => onAction('retry', task.id)} color="blue" />
            )}
            {['completed', 'cancelled', 'failed'].includes(task.status) && (
              <ActionButton icon={<Play className="w-3 h-3" />} label={t('queued.actionRerun')} onClick={() => onAction('rerun', task.id)} color="green" />
            )}
            <ActionButton icon={<Trash2 className="w-3 h-3" />} label={t('queued.actionDelete')} onClick={() => onAction('delete', task.id)} color="red" />
          </div>
        </div>

        {isWorkflowExecution ? (
          <QueuedWorkflowDetail task={task} emptyText={emptyText} />
        ) : (
          <Suspense fallback={<SessionChatFallback />}>
            <LazySessionChat
              sessionId={sessionId}
              live={shouldStreamSession}
              hideInput
              display={{
                compact: false,
                fullWidth: true,
                pageCanvas: true,
                showTimestamp: true,
                collapseIntermediateSteps: true,
                processGroupsDefaultOpen: false,
                processGroupsOpenWhileActive: true,
              }}
              emptyText={emptyText}
              className="flex-1 min-h-0"
              onSSEEvent={(event) => {
                if (event.type === 'task.updated' && event.properties?.executionID === task.id) {
                  onRefresh?.();
                }
              }}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}

function QueuedWorkflowDetail({ task, emptyText }: { task: TaskExecution; emptyText: string }) {
  const { t } = useTranslation('task');
  const { t: tCommon } = useTranslation('common');
  const toast = useToast();
  const inputPayload = getWorkflowInputPayload(task);
  const parsedResult = parseStructuredResult(task.resultSummary);
  const hasInputPayload = Object.keys(inputPayload).length > 0;
  const resultText = task.resultSummary?.trim();
  const inputText = JSON.stringify(inputPayload, null, 2);
  const formattedResultText = parsedResult ? JSON.stringify(parsedResult, null, 2) : null;
  const [showFormattedResult, setShowFormattedResult] = useState(false);
  const displayedResultText = showFormattedResult && formattedResultText
    ? formattedResultText
    : resultText;

  useEffect(() => {
    setShowFormattedResult(false);
  }, [task.id, task.resultSummary]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await copyText(text);
      toast.success(tCommon('clipboard.copySuccessTitle'));
    } catch (error) {
      toast.error(
        tCommon('clipboard.copyFailedTitle'),
        error instanceof Error ? error.message : tCommon('clipboard.copyFailedDescription'),
      );
    }
  }, [tCommon, toast]);

  const match = parsedResult && typeof parsedResult === 'object' && 'match_result' in parsedResult
    ? (parsedResult as Record<string, unknown>).match_result : null;
  const metrics = match && typeof match === 'object' ? match as Record<string, unknown> : null;
  return (
    <div className="execution-body flex-1 min-h-0 overflow-y-auto">
      <section className="execution-overview">
        <div className="execution-section-title"><ModuleEmblem kind="workflow" size="nav"/><div><h4>工作流执行概览</h4><code>{task.workflowID || '--'}</code></div></div>
        <div className="execution-time-grid">
          <div><small>开始时间</small><strong>{task.startedAt ? formatTime(task.startedAt) : '尚未开始'}</strong></div>
          <div><small>结束时间</small><strong>{task.completedAt ? formatTime(task.completedAt) : '尚未结束'}</strong></div>
          <div><small>执行耗时</small><strong>{task.durationMs != null ? formatDuration(task.durationMs) : '—'}</strong></div>
        </div>
      </section>
      <section className="execution-result">
        <div className="execution-section-title"><span className="execution-result-mark">{task.status === 'completed' ? '✓' : task.status === 'failed' ? '!' : '…'}</span><div><h4>{t('queued.workflowResult')}</h4><small>{task.status === 'completed' ? '本次执行已完成，以下为实际返回结果' : '以执行状态与实际输出为准'}</small></div></div>
        {metrics && <div className="execution-metrics">
          {typeof metrics.checked === 'number' && <div><small>核对情报</small><strong>{metrics.checked.toLocaleString()}<em>条</em></strong></div>}
          {typeof metrics.count === 'number' && <div><small>新增 / 更新线索</small><strong>{metrics.count.toLocaleString()}<em>条</em></strong></div>}
          {typeof metrics.since === 'string' && <div><small>匹配起始日期</small><strong className="date-value">{metrics.since}</strong></div>}
        </div>}
        {metrics && metrics.count === 0 && <p className="execution-note">本次未产生新的影响线索。匹配依据为已登记产品，结果不等同于资产无漏洞。</p>}
        {Boolean(parsedResult) && !metrics && <ResultFields value={parsedResult}/>}
        {!parsedResult && resultText && <div className="execution-prose">{resultText}</div>}
        {!resultText && !task.error && <div className="execution-pending">{emptyText}</div>}
        {task.error && <div className="execution-error"><h4>{t('queued.workflowError')}</h4><p>{task.error}</p></div>}
      </section>
      {hasInputPayload && <details className="execution-advanced">
        <summary>{t('queued.workflowInput')}<span>展开查看参数</span></summary>
        <div className="execution-code-actions"><button type="button" onClick={() => void handleCopy(inputText)}>{tCommon('button.copy')}</button></div>
        <pre>{inputText}</pre>
      </details>}
      {displayedResultText && <details className="execution-advanced">
        <summary>原始执行输出<span>展开查看 / 复制</span></summary>
        <div className="execution-code-actions"><button type="button" onClick={() => void handleCopy(displayedResultText)}>{tCommon('button.copy')}</button><button type="button" onClick={() => setShowFormattedResult(true)} disabled={!formattedResultText || showFormattedResult}>{t('queued.workflowJsonFormat')}</button></div>
        <pre>{displayedResultText}</pre>
      </details>}
    </div>
  );
}

const resultLabels: Record<string, string> = {result:'执行结果',match_result:'资产匹配',count:'数量',checked:'已检查',since:'起始日期',keywords:'关键词',search_success:'查询成功',result_count:'结果数量',message:'说明',status:'状态',error:'错误',items:'记录',total:'总数'};
function ResultFields({value, depth = 0}: {value: unknown; depth?: number}) {
  if (value === null || value === undefined) return <span className="execution-null">未提供</span>;
  if (typeof value !== 'object') return <span>{typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}</span>;
  if (depth >= 4) return <pre>{JSON.stringify(value, null, 2)}</pre>;
  const entries = Object.entries(value);
  return <dl className="execution-fields">{entries.slice(0, 30).map(([key, item]) => <div key={key}><dt>{Array.isArray(value) ? `记录 ${Number(key)+1}` : (resultLabels[key] || key)}</dt><dd><ResultFields value={item} depth={depth+1}/></dd></div>)}{entries.length > 30 && <p className="execution-note">其余 {entries.length - 30} 项可在原始输出中查看。</p>}{!entries.length && <span className="execution-null">暂无记录</span>}</dl>;
}

function getWorkflowInputPayload(task: TaskExecution): Record<string, unknown> {
  const snapshot = task.executionInputSnapshot ?? {};
  const context = snapshot.context;
  if (context && typeof context === 'object' && !Array.isArray(context) && Object.keys(context).length > 0) {
    return context as Record<string, unknown>;
  }
  return snapshot;
}

function parseStructuredResult(value?: string): unknown | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return isStructuredResult(parsed) ? parsed : null;
  } catch {
    try {
      const parsed = parsePythonLikeLiteral(trimmed);
      return isStructuredResult(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function isStructuredResult(value: unknown): value is Record<string, unknown> | unknown[] {
  return (Array.isArray(value) || (typeof value === 'object' && value !== null));
}

function parsePythonLikeLiteral(source: string): unknown {
  let index = 0;

  const skipWhitespace = () => {
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }
  };

  const expect = (char: string) => {
    if (source[index] !== char) {
      throw new Error(`Expected ${char} at ${index}`);
    }
    index += 1;
  };

  const parseString = (): string => {
    const quote = source[index];
    if (quote !== '\'' && quote !== '"') {
      throw new Error(`Expected string at ${index}`);
    }
    index += 1;
    let result = '';
    while (index < source.length) {
      const char = source[index];
      if (char === quote) {
        index += 1;
        return result;
      }
      if (char === '\\') {
        index += 1;
        if (index >= source.length) {
          throw new Error('Unterminated escape sequence');
        }
        const escaped = source[index];
        switch (escaped) {
          case 'n': result += '\n'; break;
          case 'r': result += '\r'; break;
          case 't': result += '\t'; break;
          case 'b': result += '\b'; break;
          case 'f': result += '\f'; break;
          case '\\': result += '\\'; break;
          case '\'': result += '\''; break;
          case '"': result += '"'; break;
          case 'u': {
            const hex = source.slice(index + 1, index + 5);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new Error(`Invalid unicode escape at ${index}`);
            }
            result += String.fromCharCode(parseInt(hex, 16));
            index += 4;
            break;
          }
          case 'x': {
            const hex = source.slice(index + 1, index + 3);
            if (!/^[0-9a-fA-F]{2}$/.test(hex)) {
              throw new Error(`Invalid hex escape at ${index}`);
            }
            result += String.fromCharCode(parseInt(hex, 16));
            index += 2;
            break;
          }
          default:
            result += escaped;
            break;
        }
        index += 1;
        continue;
      }
      result += char;
      index += 1;
    }
    throw new Error('Unterminated string literal');
  };

  const parseNumber = (): number => {
    const match = source.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) {
      throw new Error(`Invalid number at ${index}`);
    }
    index += match[0].length;
    return Number(match[0]);
  };

  const parseArray = (): unknown[] => {
    const values: unknown[] = [];
    expect('[');
    skipWhitespace();
    if (source[index] === ']') {
      index += 1;
      return values;
    }
    while (index < source.length) {
      values.push(parseValue());
      skipWhitespace();
      if (source[index] === ',') {
        index += 1;
        skipWhitespace();
        if (source[index] === ']') {
          index += 1;
          return values;
        }
        continue;
      }
      if (source[index] === ']') {
        index += 1;
        return values;
      }
      throw new Error(`Expected , or ] at ${index}`);
    }
    throw new Error('Unterminated array');
  };

  const parseTuple = (): unknown[] => {
    const values: unknown[] = [];
    expect('(');
    skipWhitespace();
    if (source[index] === ')') {
      index += 1;
      return values;
    }
    while (index < source.length) {
      values.push(parseValue());
      skipWhitespace();
      if (source[index] === ',') {
        index += 1;
        skipWhitespace();
        if (source[index] === ')') {
          index += 1;
          return values;
        }
        continue;
      }
      if (source[index] === ')') {
        index += 1;
        return values;
      }
      throw new Error(`Expected , or ) at ${index}`);
    }
    throw new Error('Unterminated tuple');
  };

  const parseObject = (): Record<string, unknown> => {
    const obj: Record<string, unknown> = {};
    expect('{');
    skipWhitespace();
    if (source[index] === '}') {
      index += 1;
      return obj;
    }
    while (index < source.length) {
      const key = parseValue();
      skipWhitespace();
      expect(':');
      skipWhitespace();
      obj[String(key)] = parseValue();
      skipWhitespace();
      if (source[index] === ',') {
        index += 1;
        skipWhitespace();
        if (source[index] === '}') {
          index += 1;
          return obj;
        }
        continue;
      }
      if (source[index] === '}') {
        index += 1;
        return obj;
      }
      throw new Error(`Expected , or } at ${index}`);
    }
    throw new Error('Unterminated object');
  };

  const parseIdentifier = (): unknown => {
    if (source.startsWith('True', index)) {
      index += 4;
      return true;
    }
    if (source.startsWith('False', index)) {
      index += 5;
      return false;
    }
    if (source.startsWith('None', index)) {
      index += 4;
      return null;
    }
    if (source.startsWith('null', index)) {
      index += 4;
      return null;
    }
    throw new Error(`Unexpected token at ${index}`);
  };

  const parseValue = (): unknown => {
    skipWhitespace();
    const char = source[index];
    if (char === '{') return parseObject();
    if (char === '[') return parseArray();
    if (char === '(') return parseTuple();
    if (char === '\'' || char === '"') return parseString();
    if (char === '-' || /\d/.test(char)) return parseNumber();
    return parseIdentifier();
  };

  const parsed = parseValue();
  skipWhitespace();
  if (index !== source.length) {
    throw new Error(`Unexpected trailing input at ${index}`);
  }
  return parsed;
}
