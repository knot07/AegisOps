import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModuleEmblem from '@/components/common/ModuleEmblem';
import { ArrowRight, Check, RefreshCw, Plus, Pause, Play } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useStats } from '@/hooks/useStats';
import { taskAPI, type TaskExecution, type DashboardCounts } from '@/api/task';
import { DAY, taskTrend } from './trends';
import WorkspaceGlyph from '@/components/common/WorkspaceGlyph';
import ClockTicks, { CLOCK_TICK_COUNT } from '@/components/common/ClockTicks';

const translatedStatuses = new Set(['completed', 'failed', 'running', 'queued', 'pending', 'cancelled']);
function Empty({ text }: { text: string }) { return <div className="aegis-empty"><WorkspaceGlyph kind="timeline" size="empty" /><span>{text}</span></div>; }

const reduceMotionQuery = '(prefers-reduced-motion: reduce)';
const systemReducesMotion = () => window.matchMedia?.(reduceMotionQuery).matches ?? false;
function subscribeToMotionPreference(notify: () => void) {
  const query = window.matchMedia?.(reduceMotionQuery);
  query?.addEventListener?.('change', notify);
  return () => query?.removeEventListener?.('change', notify);
}

export default function Home() {
  const { t, i18n } = useTranslation('home', { keyPrefix: 'dashboard' });
  const locale = i18n.resolvedLanguage || i18n.language || 'zh-CN';
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, systemReducesMotion, () => true);
  const [gaugeMotionOverride, setGaugeMotionOverride] = useState<boolean | null>(null);
  const gaugeMotion = gaugeMotionOverride ?? !reducedMotion;
  const { user } = useAuth();
  const { stats, error: statsError, refetch } = useStats();
  const [days, setDays] = useState(7);
  const [tasks, setTasks] = useState<TaskExecution[]>([]);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [partial, setPartial] = useState(false);
  const [updated, setUpdated] = useState<number | null>(null);
  const requestRef = useRef(0);
  const refresh = async () => {
    const request = ++requestRef.current;
    setBusy(true);
    const timestamp = Date.now();
    const results = await Promise.allSettled([
      (async () => {
        const items: TaskExecution[] = [];
        let total = 0;
        do {
          const response = await taskAPI.listExecutions({ limit: 100, offset: items.length, startedAfter: new Date(timestamp - 60 * DAY).toISOString(), startedBefore: new Date(timestamp).toISOString(), sortBy: 'started_at', sortOrder: 'desc' });
          total = response.data.total;
          const page = response.data.items;
          items.push(...page);
          if (!page.length) break;
        } while (items.length < total && items.length < 5000);
        return { items: [...new Map(items.map(t => [t.id, t])).values()], partial: items.length < total };
      })(), taskAPI.dashboard(), refetch(),
    ]);
    if (request !== requestRef.current) return;
    if (results[0].status === 'fulfilled') {
      setTasks(results[0].value.items); setPartial(results[0].value.partial); setNow(timestamp); setReady(true); setUpdated(timestamp); setError('');
    } else setError('trendUnavailable');
    setCounts(results[1].status === 'fulfilled' ? results[1].value.data : null);
    setBusy(false);
  };
  useEffect(() => { void refresh(); return () => { requestRef.current++; }; }, []);
  const trend = taskTrend(tasks, days, now, locale);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const recent = tasks.filter(t => Date.parse(t.startedAt || '') >= todayStart.getTime()).slice(0, 6);
  const hour = new Date(now).getHours();
  const greeting = t(hour < 6 ? 'greetingLate' : hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening');
  const value = (n: number | undefined) => n === undefined ? '—' : n.toLocaleString(locale);
  const resources = [
    { label: t('agent'), value: stats?.agents.total, to: '/agents', icon: 'agent' },
    { label: t('workflow'), value: stats?.workflows.total, to: '/workflows', icon: 'flow' },
    { label: t('skill'), value: stats?.skills.total, to: '/skills', icon: 'skill' },
    { label: t('tools'), value: stats?.tools.total, to: '/tools', icon: 'tools' },
  ] as const;
  const resourceTotal = resources.reduce((sum, r) => sum + (r.value || 0), 0);
  const successRate = ready && trend.rate !== null ? Math.round(trend.rate) : null;
  const litTicks = successRate === 100 ? CLOCK_TICK_COUNT : successRate
    ? Math.min(CLOCK_TICK_COUNT - 1, Math.max(1, Math.round(successRate * CLOCK_TICK_COUNT / 100)))
    : 0;
  const period = days === 1 ? t('periodHours') : t('periodDays', { count: days });
  const chart = (bar = false) => <ResponsiveContainer width="100%" height="100%">{bar ?
    <BarChart data={trend.points} margin={{ top: 16, right: 8, left: -30, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--aegis-grid)" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={16} tick={{ fill: 'rgb(var(--ui-muted))', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--ui-muted))', fontSize: 10 }} domain={[0, 'auto']} /><Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, t('executions')]} cursor={{ fill: 'var(--skin-selected,#84bc4a10)' }} /><Bar dataKey="count" fill="var(--skin-buttonTo,#a0c879)" radius={[5, 5, 0, 0]} maxBarSize={26} /></BarChart> :
    <AreaChart data={trend.points} margin={{ top: 18, right: 12, left: -24, bottom: 0 }}><defs><linearGradient id="task-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--skin-accent,#97c961)" stopOpacity={0.32} /><stop offset="100%" stopColor="var(--skin-accent,#97c961)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="2 6" vertical={false} stroke="var(--aegis-grid)" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={42} tick={{ fill: 'rgb(var(--ui-muted))', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, (max: number) => Math.max(2, max)]} tick={{ fill: 'rgb(var(--ui-muted))', fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, t('executions')]} /><Area type="monotone" dataKey="count" stroke="var(--skin-accent,#7fa957)" strokeWidth={2.5} fill="url(#task-area)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 3 }} /></AreaChart>
  }</ResponsiveContainer>;
  return <div className="aegis-dashboard" aria-busy={busy}>
    <header className="aegis-dashboard-heading"><div className="aegis-dashboard-identity min-w-0"><ModuleEmblem kind="home" /><div className="min-w-0"><p>{new Date(now).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p><h1>{user?.username ? t('welcomeUser', { greeting, user: user.username }) : t('welcome')}</h1><span>{t('subtitle')}</span></div></div><Link className="aegis-dashboard-primary" to="/sessions" state={{ skipLastSelectedSessionRestore: true }}><Plus size={15} />{t('startChat')}</Link></header>
    {(error || statsError || partial) && <div className="aegis-dashboard-notice" role="status">{t(error || (partial ? 'partial' : 'statsUnavailable'))}{error && <button onClick={() => void refresh()}>{t('reload')}</button>}</div>}
    <div className="aegis-dashboard-grid">
      <section className="aegis-card aegis-trend"><div className="aegis-card-heading"><h2>{t('pulse')}</h2><div className="aegis-range" aria-label={t('trendRange')}>{[1, 7, 30].map(d => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d === 1 ? t('hours') : t('days', { count: d })}</button>)}</div></div><div className="aegis-trend-content"><div className="aegis-trend-summary"><div className="aegis-big-number">{ready ? value(trend.current.length) : '—'}<small>{t('runs')}</small></div><p className="aegis-comparison"><span>{!ready ? '—' : trend.change === null ? (trend.previous === 0 && trend.current.length === 0 ? t('steady') : t('new')) : `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(0)}%`}</span>{t('previous')}</p><div className="aegis-trend-facts"><div>{t('peak')}<strong>{ready ? trend.peak : '—'}</strong></div><div>{days === 1 ? t('hourly') : t('daily')}<strong>{ready ? trend.average.toFixed(1) : '—'}</strong></div><div>{t('range')}<strong>{period}</strong></div></div><div className="aegis-trend-actions"><Link className="aegis-dashboard-primary" to="/tasks">{t('viewTasks')}<ArrowRight size={14} /></Link><button disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} className={busy ? 'motion-safe:animate-spin' : ''} />{t('refresh')}</button></div><span className="aegis-updated" aria-live="polite">{busy ? t('updating') : updated ? t('updatedAt', { time: new Date(updated).toLocaleTimeString(locale) }) : t('waitingData')}</span></div><div className="aegis-main-chart" role="img" aria-label={t('trendChart', { period, total: ready ? value(trend.current.length) : t('unknown') })}>{chart()}{!ready && <span className="aegis-chart-note">{busy ? t('loadingTrend') : t('noTrend')}</span>}</div></div></section>
      <div className="aegis-side-metrics"><Link className="aegis-card aegis-metric" to="/tasks"><div><h2>{t('queue')}</h2><WorkspaceGlyph kind="queue" size="lg" /></div><strong>{value(counts?.running)}<small>{t('running')}</small></strong><p>{t('waitingTasks', { countText: value(counts?.queued) })}</p></Link><Link className="aegis-card aegis-metric" to="/tasks"><div><h2>{t('schedule')}</h2><WorkspaceGlyph kind="schedule" size="lg" /></div><strong>{value(counts?.scheduled_active)}<small>{t('items')}</small></strong><p>{t('activeSchedules')}</p></Link></div>
      <section className="aegis-card aegis-weekly"><div className="aegis-card-heading"><h2>{t('executionVolume', { period })}</h2><span>{t('executionVolumeTotal', { count: ready ? trend.current.length : undefined, total: ready ? value(trend.current.length) : '—' })}</span></div><div className="aegis-small-chart" role="img" aria-label={t('executionVolumeChart', { period, count: ready ? trend.current.length : undefined, total: ready ? value(trend.current.length) : t('unknown') })}>{chart(true)}</div></section>
      <section className="aegis-card aegis-success">
        <div className="aegis-card-heading">
          <h2>{t('successRate')}</h2>
          <div className="aegis-gauge-actions">
            <span>{period}</span>
            {litTicks > 0 && <button type="button" className="aegis-gauge-motion"
              aria-label={t('motionLabel')} aria-pressed={gaugeMotion} title={gaugeMotion ? t('pauseMotion') : t('playMotion')}
              onClick={() => setGaugeMotionOverride(!gaugeMotion)}>
              {gaugeMotion ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />} {t('motion')}
            </button>}
          </div>
        </div>
        <div className="aegis-success-body">
          <div className="aegis-gauge" data-filled={litTicks ? '' : undefined}
            data-motion={gaugeMotion ? 'on' : 'off'}>
            <ClockTicks lit={litTicks} layered />
            <div className="aegis-gauge-label"><strong>{successRate === null ? '—' : <>{successRate}<small>%</small></>}</strong><span>{successRate === null ? t('noStats') : t('success')}</span></div>
          </div>
          <dl><dt>{t('completed')}</dt><dd>{ready ? trend.completed : '—'}</dd><dt>{t('failed')}</dt><dd>{ready ? trend.failed : '—'}</dd><dt>{t('endedOnly')}</dt></dl>
        </div>
      </section>
      <section className="aegis-card aegis-resources"><div className="aegis-card-heading"><h2>{t('resources')}</h2><span>{t('resourcesTotal', { total: value(stats ? resourceTotal : undefined) })}</span></div><div className="aegis-resource-list">{resources.map(r => <Link key={r.to} to={r.to}><WorkspaceGlyph kind={r.icon} size="xs" /><span>{r.label}</span><div><i style={{ width: `${resourceTotal ? (r.value || 0) / resourceTotal * 100 : 0}%` }} /></div><strong>{value(r.value)}</strong><ArrowRight size={12} /></Link>)}</div></section>
      <section className="aegis-card aegis-today"><div className="aegis-card-heading"><h2>{t('today')}</h2><Link to="/tasks">{t('taskCenter')}<ArrowRight size={14} /></Link></div>{recent.length ? <div className="aegis-timeline">{recent.map(task => <Link to="/tasks" key={task.id}><span className={`aegis-status-dot ${task.status}`} /><time>{new Date(task.startedAt!).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time><strong>{task.title}</strong><span>{translatedStatuses.has(task.status) ? t(`status.${task.status}`) : task.status}</span></Link>)}</div> : <Empty text={ready ? t('noRuns') : busy ? t('loadingRuns') : t('unavailableRuns')} />}</section>
      <section className="aegis-card aegis-quick-start"><div className="aegis-card-heading"><h2>{t('quickStart')}</h2><span>{t('ready')}</span></div><Link to="/sessions" state={{ skipLastSelectedSessionRestore: true }}><WorkspaceGlyph kind="chat" size="lg" /><div><strong>{t('chatAgent')}</strong><span>{t('chatHint')}</span></div><ArrowRight size={16} /></Link><Link to="/workflows"><WorkspaceGlyph kind="flow" size="lg" /><div><strong>{t('createWorkflow')}</strong><span>{t('workflowHint')}</span></div><ArrowRight size={16} /></Link><div className="aegis-health"><Check size={14} />{stats?.system.status === 'healthy' ? t('healthy') : stats ? t('attention') : t('checking')}</div></section>
    </div>
  </div>;
}
