import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Bot, Check, Clock3, RefreshCw, Workflow, Wrench, BookOpen, Plus, CalendarClock } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useStats } from '@/hooks/useStats';
import { taskAPI, type TaskExecution, type DashboardCounts } from '@/api/task';
import { DAY, taskTrend } from './trends';

const statusNames: Record<string, string> = { completed: '已完成', failed: '失败', running: '进行中', queued: '排队中', pending: '待执行', cancelled: '已取消' };
function Empty({ text }: { text: string }) { return <div className="aegis-empty"><Clock3 /><span>{text}</span></div>; }

export default function Home() {
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
    } else setError('任务趋势暂时无法加载，请重试。');
    setCounts(results[1].status === 'fulfilled' ? results[1].value.data : null);
    setBusy(false);
  };
  useEffect(() => { void refresh(); return () => { requestRef.current++; }; }, []);
  const trend = taskTrend(tasks, days, now);
  const weekly = taskTrend(tasks, 7, now);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const recent = tasks.filter(t => Date.parse(t.startedAt || '') >= todayStart.getTime()).slice(0, 6);
  const hour = new Date(now).getHours();
  const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
  const value = (n: number | undefined) => n === undefined ? '—' : n.toLocaleString();
  const resources = [
    { label: '智能体', value: stats?.agents.total, to: '/agents', icon: Bot },
    { label: '工作流', value: stats?.workflows.total, to: '/workflows', icon: Workflow },
    { label: '技能', value: stats?.skills.total, to: '/skills', icon: BookOpen },
    { label: '工具', value: stats?.tools.total, to: '/tools', icon: Wrench },
  ];
  const resourceTotal = resources.reduce((sum, r) => sum + (r.value || 0), 0);
  const period = days === 1 ? '近 24 小时' : `近 ${days} 天`;
  const chart = (bar = false) => <ResponsiveContainer width="100%" height="100%">{bar ?
    <BarChart data={weekly.points} margin={{ top: 16, right: 8, left: -30, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--aegis-grid)" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={16} tick={{ fill: '#919c97', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#919c97', fontSize: 10 }} domain={[0, 'auto']} /><Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, '执行任务']} cursor={{ fill: '#84bc4a10' }} /><Bar dataKey="count" fill="#a0c879" radius={[5, 5, 0, 0]} maxBarSize={26} /></BarChart> :
    <AreaChart data={trend.points} margin={{ top: 18, right: 12, left: -24, bottom: 0 }}><defs><linearGradient id="task-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#97c961" stopOpacity={0.32} /><stop offset="100%" stopColor="#97c961" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="2 6" vertical={false} stroke="var(--aegis-grid)" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={42} tick={{ fill: '#919c97', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} domain={[0, (max: number) => Math.max(2, max)]} tick={{ fill: '#919c97', fontSize: 10 }} /><Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [v, '执行任务']} /><Area type="monotone" dataKey="count" stroke="#7fa957" strokeWidth={2.5} fill="url(#task-area)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 3 }} /></AreaChart>
  }</ResponsiveContainer>;
  return <div className="aegis-dashboard" aria-busy={busy}>
    <header className="aegis-dashboard-heading"><div><p>{new Date(now).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p><h1>{greeting}，{user?.username || '欢迎回来'}</h1><span>任务执行趋势、能力资产与今日工作动态。</span></div><Link className="aegis-dashboard-primary" to="/sessions" state={{ skipLastSelectedSessionRestore: true }}><Plus size={15} />开始对话</Link></header>
    {(error || statsError || partial) && <div className="aegis-dashboard-notice" role="status">{error || (partial ? '当前展示最近 5,000 条执行记录，统计为部分数据。' : '部分资源数据暂不可用。')}{error && <button onClick={() => void refresh()}>重新加载</button>}</div>}
    <div className="aegis-dashboard-grid">
      <section className="aegis-card aegis-trend"><div className="aegis-card-heading"><h2>任务脉搏</h2><div className="aegis-range" aria-label="趋势时间范围">{[1, 7, 30].map(d => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d === 1 ? '24 小时' : `${d} 天`}</button>)}</div></div><div className="aegis-trend-content"><div className="aegis-trend-summary"><div className="aegis-big-number">{ready ? value(trend.current.length) : '—'}<small>次</small></div><p className="aegis-comparison"><span>{!ready ? '—' : trend.change === null ? (trend.previous === 0 && trend.current.length === 0 ? '持平' : '新增') : `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(0)}%`}</span>较上一周期</p><div className="aegis-trend-facts"><div>峰值<strong>{ready ? trend.peak : '—'}</strong></div><div>{days === 1 ? '每小时均值' : '每日均值'}<strong>{ready ? trend.average.toFixed(1) : '—'}</strong></div><div>范围<strong>{period}</strong></div></div><div className="aegis-trend-actions"><Link className="aegis-dashboard-primary" to="/tasks">查看任务<ArrowRight size={14} /></Link><button disabled={busy} onClick={() => void refresh()}><RefreshCw size={14} className={busy ? 'animate-spin' : ''} />刷新</button></div><span className="aegis-updated" aria-live="polite">{busy ? '正在更新…' : updated ? `更新于 ${new Date(updated).toLocaleTimeString('zh-CN')}` : '等待数据'}</span></div><div className="aegis-main-chart" role="img" aria-label={`${period}执行任务趋势，共${ready ? trend.current.length : '未知'}次`}>{chart()}{!ready && <span className="aegis-chart-note">{busy ? '正在加载趋势' : '趋势数据暂不可用'}</span>}</div></div></section>
      <div className="aegis-side-metrics"><Link className="aegis-card aegis-metric" to="/tasks"><div><h2>当前任务 · 执行队列</h2><Activity /></div><strong>{value(counts?.running)}<small>进行中</small></strong><p>{value(counts?.queued)} 个任务等待执行</p></Link><Link className="aegis-card aegis-metric" to="/tasks"><div><h2>计划任务 · 自动化</h2><CalendarClock /></div><strong>{value(counts?.scheduled_active)}<small>个</small></strong><p>已启用的定时任务</p></Link></div>
      <section className="aegis-card aegis-weekly"><div className="aegis-card-heading"><h2>近 7 天执行量</h2><span>{ready ? weekly.current.length : '—'} 次</span></div><div className="aegis-small-chart" role="img" aria-label={`近7天执行${ready ? weekly.current.length : '未知'}次`}>{chart(true)}</div></section>
      <section className="aegis-card aegis-success"><div className="aegis-card-heading"><h2>任务成功率</h2><span>{period}</span></div><div className="aegis-success-body"><div className="aegis-gauge" style={{ '--rate': trend.rate ?? 0 } as React.CSSProperties}><div><strong>{ready && trend.rate !== null ? trend.rate.toFixed(0) : '—'}<small>%</small></strong><span>成功</span></div></div><dl><dt>已完成</dt><dd>{ready ? trend.completed : '—'}</dd><dt>失败</dt><dd>{ready ? trend.failed : '—'}</dd><dt>仅统计已结束任务</dt></dl></div></section>
      <section className="aegis-card aegis-resources"><div className="aegis-card-heading"><h2>能力资产</h2><span>{value(stats ? resourceTotal : undefined)} 项</span></div><div className="aegis-resource-list">{resources.map(r => <Link key={r.to} to={r.to}><r.icon size={16} /><span>{r.label}</span><div><i style={{ width: `${resourceTotal ? (r.value || 0) / resourceTotal * 100 : 0}%` }} /></div><strong>{value(r.value)}</strong><ArrowRight size={12} /></Link>)}</div></section>
      <section className="aegis-card aegis-today"><div className="aegis-card-heading"><h2>今日执行轨迹</h2><Link to="/tasks">任务中心<ArrowRight size={14} /></Link></div>{recent.length ? <div className="aegis-timeline">{recent.map(t => <Link to="/tasks" key={t.id}><span className={`aegis-status-dot ${t.status}`} /><time>{new Date(t.startedAt!).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time><strong>{t.title}</strong><span>{statusNames[t.status] || t.status}</span></Link>)}</div> : <Empty text={ready ? '今天还没有执行记录' : busy ? '正在加载执行记录' : '执行记录暂不可用'} />}</section>
      <section className="aegis-card aegis-quick-start"><div className="aegis-card-heading"><h2>工作入口</h2><span>随时开始</span></div><Link to="/sessions" state={{ skipLastSelectedSessionRestore: true }}><Bot /><div><strong>与智能体对话</strong><span>让想法成为下一步行动</span></div><ArrowRight size={16} /></Link><Link to="/workflows"><Workflow /><div><strong>编排工作流</strong><span>串联能力，自动处理重复任务</span></div><ArrowRight size={16} /></Link><div className="aegis-health"><Check size={14} />{stats?.system.status === 'healthy' ? '服务运行正常' : stats ? '部分服务需要关注' : '正在获取服务状态'}</div></section>
    </div>
  </div>;
}
