import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, ShieldCheck, X, Loader2 } from 'lucide-react';
import PasswordInput from '@/components/common/PasswordInput';
import { authApi, type LocalUser, type VulnOpsPermission, type VulnOpsPermissionInput } from '@/api/auth';

export const vulnRoles = { admin: '系统管理员', security: '安全运营', owner: '整改负责人', viewer: '只读观察员' };
export default function UserDialog({ user, permission, sceneAvailable, onClose, onSaved, zh }: {
  user?: LocalUser; permission?: VulnOpsPermission; sceneAvailable: boolean; zh: boolean;
  onClose: () => void; onSaved: (user: LocalUser, permission?: VulnOpsPermission, warning?: string) => void;
}) {
  const label = (cn: string, en: string) => zh ? cn : en;
  const [username, setUsername] = useState(user?.username ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>(user?.role ?? 'member');
  const [profile, setProfile] = useState<VulnOpsPermissionInput>({ name: permission?.name ?? user?.username ?? '', department: permission?.department ?? '', role: permission?.role ?? 'viewer', active: permission?.active ?? true });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const title = user ? label('成员与权限', 'Member permissions') : label('新增用户', 'Add user');
  useEffect(() => {
    const original = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('input,select')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!busyRef.current) onClose(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)') ?? []).filter(e => e.tabIndex >= 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); original?.focus(); };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busyRef.current) return;
    if (!user && password !== confirmation) { setError(label('两次输入的密码不一致', 'Passwords do not match')); return; }
    if (!user && (username.trim().length < 3 || /\s/.test(username.trim()))) { setError(label('用户名至少 3 个字符，且不能包含空白', 'Username needs at least 3 characters without whitespace')); return; }
    busyRef.current = true; setBusy(true); setError('');
    try {
      const saved = user ?? await authApi.createUser({ username: username.trim(), password, role });
      let savedPermission: VulnOpsPermission | undefined;
      let warning: string | undefined;
      if (sceneAvailable) {
        try { savedPermission = await authApi.setVulnOpsPermission(saved.id, { ...profile, name: profile.name.trim() || saved.username, role: saved.role === 'admin' ? 'admin' : profile.role }); }
        catch (err: any) {
          if (user) throw err;
          warning = label('账号已创建，可正常登录；漏洞运营权限保存失败，请通过“成员与权限”重试。', 'Account created and ready to sign in. Retry saving its scene permissions from Member permissions.');
        }
      }
      onSaved(saved, savedPermission, warning);
    } catch (err: any) { setError(typeof err?.response?.data?.detail === 'string' ? err.response.data.detail : err?.message || label('保存失败，请重试', 'Could not save. Try again.')); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return createPortal(<div className="aegis-user-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget && !busyRef.current) onClose(); }}>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="aegis-user-dialog-title" className="aegis-user-dialog">
      <header><span className="aegis-user-dialog-icon">{user ? <ShieldCheck size={20} /> : <UserPlus size={20} />}</span><div><h2 id="aegis-user-dialog-title">{title}</h2><p>{user ? user.username : label('创建可登录工作台的本地账号', 'Create a local account for this workbench')}</p></div><button type="button" onClick={onClose} disabled={busy} aria-label={label('关闭', 'Close')}><X size={18} /></button></header>
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
        {!user && <><label>{label('用户名', 'Username')}<input value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={64} autoComplete="off" placeholder={label('3–64 个字符', '3–64 characters')} /></label>
        <div className="aegis-user-form-grid"><label>{label('密码', 'Password')}<PasswordInput value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" placeholder={label('至少 8 位', 'At least 8 characters')} /></label><label>{label('确认密码', 'Confirm password')}<PasswordInput value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" /></label></div>
        <label>{label('系统角色', 'System role')}<select value={role} onChange={e => setRole(e.target.value as 'admin' | 'member')}><option value="member">{label('普通用户', 'Member')}</option><option value="admin">{label('管理员', 'Administrator')}</option></select></label><p className="aegis-user-hint">{role === 'admin' ? label('可使用业务功能，并管理账号和系统配置。', 'Business features, account management and system configuration.') : label('可使用对话及授权业务功能，系统配置由管理员管理。', 'Conversations and permitted business features; system configuration is managed by administrators.')}</p></>}
        {sceneAvailable && <section className="aegis-user-scene"><h3>{label('漏洞运营权限', 'Vulnerability operations')}</h3><div className="aegis-user-form-grid"><label>{label('姓名', 'Display name')}<input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} maxLength={60} placeholder={username || user?.username} /></label><label>{label('所属部门', 'Department')}<input value={profile.department} onChange={e => setProfile({ ...profile, department: e.target.value })} maxLength={80} /></label></div>
        <label>{label('场景角色', 'Scene role')}<select value={role === 'admin' ? 'admin' : profile.role} disabled={role === 'admin'} onChange={e => setProfile({ ...profile, role: e.target.value as VulnOpsPermissionInput['role'] })}>{Object.entries(vulnRoles).map(([value, name]) => <option key={value} value={value}>{zh ? name : ({admin:'Administrator',security:'Security operations',owner:'Remediation owner',viewer:'Read-only observer'}[value])}</option>)}</select></label>
        <p className="aegis-user-hint">{label('安全运营：登记、分派与复测；整改负责人：仅处理分配给自己的漏洞；只读观察员：查看与导出。', 'Security operations registers, assigns and retests; owners handle assigned vulnerabilities; observers view and export.')}</p>
        <label className="aegis-user-checkbox"><input type="checkbox" checked={profile.active} disabled={role === 'admin'} onChange={e => setProfile({ ...profile, active: e.target.checked })} />{label('允许访问漏洞运营', 'Allow access to vulnerability operations')}</label></section>}
        </fieldset>
        {error && <p className="aegis-user-error" role="alert">{error}</p>}
        <footer><button type="button" disabled={busy} onClick={onClose}>{label('取消', 'Cancel')}</button><button type="submit" className="yushu-primary" disabled={busy}>{busy && <Loader2 size={15} className="animate-spin" />}{busy ? label('保存中…', 'Saving…') : user ? label('保存权限', 'Save permissions') : label('创建用户', 'Create user')}</button></footer>
      </form>
    </div>
  </div>, document.body);
}
