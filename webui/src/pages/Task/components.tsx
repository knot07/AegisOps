import WorkspaceGlyph from '@/components/common/WorkspaceGlyph';
import { Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaskStatus, ExecutionMode, DashboardCounts, ExecutionTriggerType } from '@/api/task';
import { STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG } from './helpers';

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation('task');
  const cfg = STATUS_CONFIG[status] ?? { icon: 'paused', color: 'text-ui-secondary' };
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${cfg.color}`}>
      <WorkspaceGlyph kind={cfg.icon} size="micro" /> {t(`status.${status}`, { defaultValue: status })}
    </span>
  );
}

export function ExecutionTriggerBadge({ type }: { type: ExecutionTriggerType }) {
  const { t } = useTranslation('task');
  return <span className="inline-flex rounded-full bg-ui-hover px-2 py-0.5 text-xs text-ui-secondary">{t(`executionTrigger.${type}`, { defaultValue: t('executionTrigger.unknown') })}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const { t } = useTranslation('task');
  const c = PRIORITY_CONFIG[priority] ?? { color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {t(`priority.${priority}`, { defaultValue: priority })}
    </span>
  );
}

export function SourceBadge({ sourceType }: { sourceType: string }) {
  const { t } = useTranslation('task');
  const c = SOURCE_CONFIG[sourceType] ?? { color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      {t(`source.${sourceType}`, { defaultValue: sourceType })}
    </span>
  );
}

export function ModeBadge({ mode, agent }: { mode: ExecutionMode; agent: string }) {
  if (mode === 'workflow')
    return <span className="inline-flex items-center gap-1 text-xs text-purple-600"><WorkspaceGlyph kind="flow" size="micro" /> Workflow</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-slate-600"><WorkspaceGlyph kind="agent" size="micro" /> {agent}</span>;
}

export function ActionButton({ icon, label, onClick, color }: {
  icon: React.ReactNode; label: string; onClick: () => void; color: string;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-sky-50 text-sky-800 hover:bg-sky-100',
    green:  'bg-green-50 text-green-700 hover:bg-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    red:    'bg-red-50 text-red-700 hover:bg-red-100',
    gray:   'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${colors[color] ?? colors.gray}`}>
      {icon} {label}
    </button>
  );
}

export function DashboardCards({ counts }: { counts: DashboardCounts | null }) {
  const { t } = useTranslation('task');
  const cards = [
    { label: t('dashboard.completedWeek'),   value: counts?.completed_week ?? 0,  icon: <WorkspaceGlyph kind="check" size="lg" />, bg: 'bg-emerald-50' },
    { label: t('dashboard.scheduledActive'), value: counts?.scheduled_active ?? 0, icon: <WorkspaceGlyph kind="schedule" size="lg" />,     bg: 'bg-purple-50' },
    { label: t('dashboard.running'),         value: counts?.running ?? 0,          icon: <WorkspaceGlyph kind="running" size="lg" />,         bg: 'bg-sky-50' },
    { label: t('dashboard.failedWeek'),      value: counts?.failed_week ?? 0,      icon: <WorkspaceGlyph kind="fail" size="lg" />,      bg: 'bg-red-50' },
  ];
  return (
    <div className="yushu-task-overview grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className={`${card.bg} rounded-xl p-4 flex items-center gap-3 max-md:gap-2 max-md:p-3`}>
          {card.icon}
          <div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
