import UtilityGlyph from '@/components/common/UtilityGlyph';
import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpCircle, CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AuthContext } from '@/contexts/authState';
import './system-update.css';

type Job = { phase: string; progress?: number; message?: string; job_id?: string; backup?: string };
type Status = { current_version: string; can_install: boolean; reason: string; job: Job };
type Release = { latest_version: string; available: boolean; release_url: string; notes: string; can_install: boolean; reason: string };
const busyPhases = ['downloading', 'verifying', 'restarting', 'installing'];
async function api<T>(path: string, data?: object): Promise<T> {
  const response = await fetch('/api/system-update/' + path, { credentials: 'same-origin', ...(data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : '操作未完成，请重试');
  return result;
}

export default function SystemUpdateButton({ className }: { className: string }) {
  const auth = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [checking, setChecking] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const job = status?.job;
  const busy = !!job && busyPhases.includes(job.phase);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    let alive = true;
    setChecking(true); setError(''); setConfirm(false);
    void Promise.allSettled([api<Status>('status'), api<Release>('check')]).then(results => {
      if (!alive) return;
      if (results[0].status === 'fulfilled') setStatus(results[0].value);
      if (results[1].status === 'fulfilled') setRelease(results[1].value);
      const failed = results.find(r => r.status === 'rejected');
      if (failed?.status === 'rejected') setError(String(failed.reason?.message || '检查更新失败'));
      setChecking(false);
    });
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (!open || !busy) return;
    let alive = true;
    const timer = window.setInterval(() => {
      void api<Status>('status').then(next => {
        if (!alive) return;
        setStatus(next); setError('');
        if (['completed', 'rolled_back'].includes(next.job.phase)) setConfirm(false);
      }).catch(() => {
        if (alive && ['restarting', 'installing'].includes(job?.phase || '')) setError('服务正在重启，页面会自动重新连接…');
      });
    }, 2000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [open, busy, job?.phase]);

  async function check() {
    setChecking(true); setError('');
    try { setRelease(await api<Release>('check?force=true')); setStatus(await api<Status>('status')); }
    catch (e) { setError((e as Error).message); }
    finally { setChecking(false); }
  }
  async function action(kind: 'stage' | 'apply') {
    setActing(true); setError('');
    try {
      await api(kind, kind === 'apply' ? { job_id: job?.job_id } : {});
      setStatus(await api<Status>('status')); setConfirm(false);
    } catch (e) { setError((e as Error).message); }
    finally { setActing(false); }
  }
  function close() { setOpen(false); window.setTimeout(() => trigger.current?.focus(), 0); }
  if (auth?.user?.role !== 'admin') return null;
  return <>
    <button ref={trigger} type="button" title="在线更新" aria-label="在线更新" className={className} onClick={() => setOpen(true)}><UtilityGlyph kind="update" /></button>
    {open && createPortal(<dialog ref={dialog} className="aegis-update-dialog" aria-labelledby="system-update-title" onCancel={e => { e.preventDefault(); close(); }} onClose={close}>
      <header><span className="update-emblem"><ArrowUpCircle /></span><div><p>AEGISOPS / SYSTEM UPDATE</p><h2 id="system-update-title">在线更新</h2></div><button type="button" aria-label="关闭更新窗口" onClick={close}><X size={20}/></button></header>
      <div className="update-content">
        <div className="update-version"><div><span>当前版本</span><strong>{status?.current_version || '读取中…'}</strong></div><span className="update-version-arrow">→</span><div><span>GitHub 稳定版</span><strong>{release?.latest_version || '待检查'}</strong></div><button type="button" disabled={checking || busy || acting} onClick={() => void check()}><RefreshCw size={15} className={checking ? 'animate-spin' : ''}/>{checking ? '检查中' : '检查更新'}</button></div>
        {release && !release.available && !busy && job?.phase !== 'ready' && <div className="update-current"><CheckCircle2 size={18}/>当前版本已是最新版本</div>}
        <div className="update-protection"><ShieldCheck size={19}/><div><strong>先备份，再更新</strong><p>校验官方更新包，保留账号、密钥、业务数据和自定义插件；新版启动失败会恢复原版本及备份数据。</p></div></div>
        {release?.notes && <section className="update-notes"><h3>版本说明</h3><div>{release.notes.replace(/^SHA256 .+$/gm, '').trim()}</div></section>}
        {status?.reason && <p className="update-mode-note">{status.reason}</p>}
        {job && job.phase !== 'idle' && <section className="update-job" role="status"><div>{busy && <Loader2 size={16} className="animate-spin"/>}<strong>{job.message}</strong><span>{job.progress !== undefined && busy ? `${job.progress}%` : ''}</span></div>{busy && <progress max={100} value={job.progress || 0}/>} {job.backup && <p>备份位置：{job.backup}</p>}</section>}
        {confirm && <div className="update-confirm"><strong>安装期间服务会短暂中断</strong><p>请等待正在运行的会话和应急调查结束，并保持启动器运行。系统将先备份数据，再安装并自动重启。</p><div><button type="button" onClick={() => setConfirm(false)}>暂不安装</button><button type="button" className="update-primary" disabled={acting} onClick={() => void action('apply')}>确认备份并安装</button></div></div>}
        {error && <p className="update-error" role="alert">{error}</p>}
      </div>
      <footer><a href={release?.release_url || 'https://github.com/knot07/AegisOps/releases/latest'} target="_blank" rel="noreferrer"><ExternalLink size={14}/>GitHub 发行版</a><div>{job?.phase === 'completed' && <button type="button" className="update-primary" onClick={() => window.location.reload()}>刷新使用新版</button>}{job?.phase === 'ready' && status?.can_install && !confirm && <button type="button" className="update-primary" onClick={() => setConfirm(true)}>备份并安装</button>}{release?.available && !busy && job?.phase !== 'ready' && status?.can_install && <button type="button" className="update-primary" disabled={acting || checking} onClick={() => void action('stage')}><Download size={15}/>下载并校验</button>}<button type="button" onClick={close}>关闭</button></div></footer>
    </dialog>, document.body)}
  </>;
}
