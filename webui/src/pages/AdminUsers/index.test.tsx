import { authApi } from '@/api/auth';
// The open product's account page: the signed-in account and a one-time
// password reset for it (dev's markup; member management is the extension's).
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsersPage from './index';

const refresh = vi.fn(() => Promise.resolve());
const logout = vi.fn(() => Promise.resolve());
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', username: 'admin', role: 'admin', status: 'active', last_login_at: null }, logout, refresh }),
}));
vi.mock('@/api/auth', () => ({
  authApi: {
    listUsers: vi.fn(async () => [{id:'u1',username:'admin',role:'admin',status:'active',last_login_at:null}]),
    listVulnOpsPermissions: vi.fn(async () => [{host_id:'u1',id:1,name:'admin',department:'',role:'admin',active:true}]),
    createUser: vi.fn(async (payload) => ({...payload,id:'u2',status:'active',must_reset_password:false})),
    setVulnOpsPermission: vi.fn(async (id,payload) => ({...payload,host_id:id,id:2})),
    resetPassword: vi.fn(() => Promise.resolve({ success: true, temporary_password: 'OTP-1234-5678', must_reset_password: true })) },
}));
vi.mock('@/components/common/ConfirmDialog', () => ({ useConfirm: () => () => Promise.resolve(true) }));
vi.mock('@/components/common/Toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('@/components/common/CopyButton', () => ({ default: () => <button type="button">copy</button> }));
vi.mock('@/components/common/PageHeader', () => ({ default: ({ title, actions }: any) => <div><h1>{title}</h1>{actions}</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'zh-CN' } }) }));

describe('AdminUsersPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('lists the signed-in account with every column', () => {
    render(<AdminUsersPage />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'admin.columnUsername', 'admin.columnRole', '状态', 'admin.columnLastLogin', 'admin.columnActions',
    ]);
  });

  it('filters actual accounts by keyword and status, and resets both filters', () => {
    render(<AdminUsersPage />);
    fireEvent.change(screen.getByPlaceholderText('输入账号名称'), { target: { value: 'nobody' } });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
    expect(screen.getByText('没有符合条件的账号')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByText('admin')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'disabled' } });
    fireEvent.click(screen.getByRole('button', { name: '查询' }));
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('refreshes from the authenticated account source', async () => {
    render(<AdminUsersPage />);
    fireEvent.click(screen.getByRole('button', { name: '刷新账号' }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('shows the one-time password after a reset and logs out once it is acknowledged', async () => {
    render(<AdminUsersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'admin.resetAction' }));
    expect(await screen.findByText('OTP-1234-5678')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'admin.resetDialogDone' }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('OTP-1234-5678')).not.toBeInTheDocument();
  });
  it('creates a login account and assigns scene permissions from the same dialog', async () => {
    render(<AdminUsersPage />);
    await screen.findByText('漏洞运营 · 系统管理员');
    fireEvent.click(screen.getByRole('button', {name:'新增用户'}));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(screen.getByLabelText('用户名'),{target:{value:'analyst'}});
    fireEvent.change(screen.getByLabelText('密码'),{target:{value:'Password123!'}});
    fireEvent.change(screen.getByLabelText('确认密码'),{target:{value:'Password123!'}});
    fireEvent.change(screen.getByLabelText('姓名'),{target:{value:'分析员'}});
    fireEvent.change(screen.getByLabelText('场景角色'),{target:{value:'security'}});
    fireEvent.submit(dialog.querySelector('form')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(authApi.createUser).toHaveBeenCalledWith({username:'analyst',password:'Password123!',role:'member'});
    expect(authApi.setVulnOpsPermission).toHaveBeenCalledWith('u2',expect.objectContaining({name:'分析员',role:'security',active:true}));
    expect(screen.getByText('analyst')).toBeInTheDocument();
    expect(screen.getByText('漏洞运营 · 安全运营')).toBeInTheDocument();
  });

  it('rejects mismatched passwords and displays duplicate-name errors without closing', async () => {
    render(<AdminUsersPage />); await screen.findByText('漏洞运营 · 系统管理员');
    fireEvent.click(screen.getByRole('button',{name:'新增用户'}));
    fireEvent.change(screen.getByLabelText('用户名'),{target:{value:'analyst'}});
    fireEvent.change(screen.getByLabelText('密码'),{target:{value:'Password123!'}});
    const form=screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('两次输入的密码不一致');
    expect(authApi.createUser).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('确认密码'),{target:{value:'Password123!'}});
    vi.mocked(authApi.createUser).mockRejectedValueOnce({response:{data:{detail:'用户名已存在'}}});
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('用户名已存在'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(authApi.setVulnOpsPermission).not.toHaveBeenCalled();
  });

  it('edits existing scene permissions without recreating the login account', async () => {
    render(<AdminUsersPage />); await screen.findByText('漏洞运营 · 系统管理员');
    fireEvent.click(screen.getByRole('button',{name:'成员与权限'}));
    expect(screen.queryByLabelText('密码')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('所属部门'),{target:{value:'安全部'}});
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(authApi.createUser).not.toHaveBeenCalled();
    expect(authApi.setVulnOpsPermission).toHaveBeenCalledWith('u1',expect.objectContaining({department:'安全部',role:'admin'}));
  });

});
