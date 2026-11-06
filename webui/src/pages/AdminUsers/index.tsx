import { Search, RotateCcw, RefreshCw, Download, ChevronLeft, ChevronRight, KeyRound, Users, UserPlus, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserDialog, { vulnRoles } from './UserDialog';
import { authApi, type LocalUser, type VulnOpsPermission } from '@/api/auth';
import CopyButton from '@/components/common/CopyButton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { useConfirm } from '@/components/common/ConfirmDialog';

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, { hour12: false });
}

function roleLabel(role: string, t: (key: string) => string) {
  return role === 'admin' ? t('admin.roleAdmin') : t('admin.roleMember');
}

/** Current local account: who is signed in, and a one-time password reset for it. */
export default function AdminUsersPage() {
  const { t, i18n } = useTranslation('auth');
  const { user, logout, refresh } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [filters, setFilters] = useState({ keyword: '', status: 'all' });
  const [refreshing, setRefreshing] = useState(false);
  const zh = i18n.language.startsWith('zh');
  const label = (cn: string, en: string) => zh ? cn : en;
  const isAdmin = user?.role === 'admin';
  const [accounts, setAccounts] = useState<LocalUser[]>(user ? [user] : []);
  const [permissions, setPermissions] = useState<VulnOpsPermission[]>([]);
  const [sceneAvailable, setSceneAvailable] = useState(false);
  const [listError, setListError] = useState('');
  const [dialog, setDialog] = useState<'create' | LocalUser | null>(null);
  const [page, setPage] = useState(1);
  const loadAccounts = async () => {
    if (!isAdmin) { setAccounts(user ? [user] : []); return; }
    const items = await authApi.listUsers(); setAccounts(items); setListError('');
    try { setPermissions(await authApi.listVulnOpsPermissions()); setSceneAvailable(true); }
    catch { setSceneAvailable(false); }
  };
  useEffect(() => { void loadAccounts().catch(() => setListError(label('账号列表加载失败，请刷新重试', 'Could not load accounts. Refresh to retry.'))); }, [user?.id, isAdmin]);
  const visibleUsers = accounts.filter(account => account.username.toLowerCase().includes(filters.keyword.trim().toLowerCase()) && (filters.status === 'all' || account.status === filters.status));
  const pages = Math.max(1, Math.ceil(visibleUsers.length / 10));
  const currentPage = Math.min(page, pages);
  const pageUsers = visibleUsers.slice((currentPage - 1) * 10, currentPage * 10);
  const exportAccounts = () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [[label('账号', 'Account'), label('角色', 'Role'), label('状态', 'Status'), label('最近登录', 'Last login')], ...visibleUsers.map(account => [account.username, roleLabel(account.role, t), account.status, formatDateTime(account.last_login_at, i18n.language)])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'aegisops-accounts.csv'; anchor.click(); URL.revokeObjectURL(url);
  };
  const toast = useToast();
  const confirm = useConfirm();
  const [credentialModal, setCredentialModal] = useState<{
    username: string;
    password: string;
    description: string;
    doneText: string;
    warning: string;
    logoutAfterClose: boolean;
  } | null>(null);

  const closeCredentialModal = () => {
    const shouldLogout = credentialModal?.logoutAfterClose;
    setCredentialModal(null);
    if (shouldLogout) {
      void logout();
    }
  };

  const resetOwnPassword = async () => {
    const confirmed = await confirm({
      title: t('admin.resetConfirmTitle'),
      description: t('admin.resetConfirmDescription'),
      confirmText: t('admin.resetConfirmButton'),
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      const result = await authApi.resetPassword();
      if (result.temporary_password && user) {
        setCredentialModal({
          username: user.username,
          password: result.temporary_password,
          description: t('admin.resetDialogDescription'),
          doneText: t('admin.resetDialogDone'),
          warning: t('admin.resetDialogWarning'),
          logoutAfterClose: true,
        });
      } else {
        toast.success(t('admin.resetSuccessToast'));
        await logout();
      }
    } catch (err: any) {
      toast.error(
        t('admin.resetFailedToast'),
        err?.response?.data?.detail || err?.message || t('admin.resetFailedToast'),
      );
    }
  };

  return (
    <div data-yushu-page="adminusers" className="space-y-6">
      <form className="yushu-account-filters" onSubmit={event => { event.preventDefault(); setFilters({ keyword, status }); setPage(1); }}>
        <label><span>{label('账号搜索', 'Search accounts')}</span><div className="yushu-search-field"><Search aria-hidden="true" className="h-4 w-4" /><input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder={label('输入账号名称', 'Enter account name')} /></div></label>
        <label><span>{label('账号状态', 'Account status')}</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">{label('全部状态', 'All statuses')}</option><option value="active">{label('正常', 'Active')}</option><option value="disabled">{label('已停用', 'Disabled')}</option></select></label>
        <div className="yushu-filter-actions"><button type="submit" className="yushu-primary"><Search className="h-4 w-4" />{label('查询', 'Search')}</button><button type="button" onClick={() => { setKeyword(''); setStatus('all'); setFilters({ keyword: '', status: 'all' }); }}><RotateCcw className="h-4 w-4" />{label('重置', 'Reset')}</button></div>
      </form>
      {listError && <p role="alert" className="text-sm text-red-600">{listError}</p>}
      <section className="yushu-account-table">
        <header><div><Users className="h-4 w-4" /><h2>{label('账号列表', 'Accounts')}</h2><span className="yushu-count">{visibleUsers.length}</span></div><div>{isAdmin && <button type="button" className="yushu-primary" onClick={() => setDialog('create')}><UserPlus className="h-4 w-4" />{label('新增用户', 'Add user')}</button>}<button type="button" disabled={refreshing} aria-label={label('刷新账号', 'Refresh accounts')} onClick={async () => { setRefreshing(true); try { await refresh(); await loadAccounts(); } catch { setListError(label('账号列表加载失败，请刷新重试', 'Could not load accounts. Refresh to retry.')); } finally { setRefreshing(false); } }}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />{label('刷新', 'Refresh')}</button><button type="button" onClick={exportAccounts}><Download className="h-4 w-4" />{label('导出', 'Export')}</button></div></header>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[650px]"><thead><tr><th>{t('admin.columnUsername')}</th><th>{t('admin.columnRole')}</th><th>{label('状态', 'Status')}</th><th>{t('admin.columnLastLogin')}</th><th>{t('admin.columnActions')}</th></tr></thead><tbody>
          {pageUsers.length ? pageUsers.map(account => {
            const permission = permissions.find(p => p.host_id === account.id);
            return <tr key={account.id}><td><div className="flex items-center gap-3"><span className="yushu-account-avatar">{account.username.slice(0, 1).toUpperCase()}</span><div><div className="font-medium">{account.username}</div>{account.id === user?.id && <span className="text-xs text-ui-muted">{t('admin.currentAccountTag')}</span>}</div></div></td><td><span className="yushu-role-badge">{roleLabel(account.role, t)}</span>{permission && <span className="mt-1 block text-xs text-ui-muted">{label('漏洞运营 · ', 'VulnOps · ')}{vulnRoles[permission.role]}{!permission.active ? label(' · 场景已停用', ' · Scene disabled') : ''}</span>}</td><td><span className={`yushu-status-badge ${account.status === 'active' ? 'is-active' : ''}`}><i />{account.status === 'active' ? label('正常', 'Active') : label('已停用', 'Disabled')}</span></td><td className="whitespace-nowrap text-ui-secondary">{formatDateTime(account.last_login_at, i18n.language)}</td><td><div className="flex flex-wrap gap-4">{isAdmin && sceneAvailable && <button type="button" className="yushu-table-action" onClick={() => setDialog(account)}><ShieldCheck className="h-3.5 w-3.5" />{label('成员与权限', 'Member permissions')}</button>}{account.id === user?.id && <button type="button" className="yushu-table-action" onClick={() => void resetOwnPassword()}><KeyRound className="h-3.5 w-3.5" />{t('admin.resetAction')}</button>}</div></td></tr>;
          }) : <tr><td colSpan={5}><div className="yushu-account-empty"><Users className="h-7 w-7" /><span>{label('没有符合条件的账号', 'No matching accounts')}</span></div></td></tr>}

        </tbody></table></div>
        <footer><span>{label(`共 ${visibleUsers.length} 条记录`, `${visibleUsers.length} records`)}</span><div><span>{label('10 条 / 页', '10 / page')}</span><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label={label('上一页', 'Previous page')}><ChevronLeft className="h-4 w-4" /></button><span className="yushu-current-page">{currentPage}</span><button type="button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)} aria-label={label('下一页', 'Next page')}><ChevronRight className="h-4 w-4" /></button></div></footer>
      </section>

      {dialog && <UserDialog user={dialog === 'create' ? undefined : dialog} permission={dialog === 'create' ? undefined : permissions.find(p => p.host_id === dialog.id)} sceneAvailable={sceneAvailable} zh={zh} onClose={() => setDialog(null)} onSaved={(saved, permission, warning) => {
        setAccounts(current => current.some(item => item.id === saved.id) ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved]);
        if (permission) setPermissions(current => [...current.filter(item => item.host_id !== saved.id), permission]);
        setKeyword(''); setStatus('all'); setFilters({ keyword: '', status: 'all' }); setPage(1); setDialog(null);
        if (warning) toast.error(label('权限需要重试', 'Retry permissions'), warning); else toast.success(label('保存成功', 'Saved'));
      }} />}
      {credentialModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeCredentialModal} />
          <div data-yushu-create-overlay className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('admin.resetDialogTitle')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{credentialModal.description}</p>
                </div>
                <button
                  type="button"
                  onClick={closeCredentialModal}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  {t('admin.resetDialogClose')}
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="rounded-lg border border-amber-200 bg-white px-3 py-3">
                    <div className="text-xs text-gray-500">{t('admin.resetDialogUsernameLabel')}</div>
                    <div className="mt-1 font-medium text-gray-900">{credentialModal.username}</div>
                  </div>
                  <div className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-gray-500">{t('admin.resetDialogPasswordLabel')}</div>
                        <div className="mt-1 font-mono text-base font-semibold text-gray-900">
                          {credentialModal.password}
                        </div>
                      </div>
                      <CopyButton text={credentialModal.password} />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-amber-900">{credentialModal.warning}</div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeCredentialModal}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    {credentialModal.doneText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
