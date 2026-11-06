import { useContext } from 'react';
import { ThemeContext, type ThemeMode } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ListTodo,
  Languages,
  Monitor,
  Sun,
  Moon,
  Check,
  type LucideIcon,
} from 'lucide-react';
import type { UserNotification } from '@/api/notifications';
import type { NavWorkspaceId } from '@/utils/navPartitions';
import type { HeaderWorkspace } from './WorkspaceModuleNav';
export type { HeaderWorkspace } from './WorkspaceModuleNav';
import HeaderMenu, { MENU_ITEM_CLASS, MENU_LABEL_CLASS } from './HeaderMenu';

export const DOCS_URL = 'https://agentaegisops.github.io/aegisops-docs/';
export const FEEDBACK_URL = 'https://github.com/AgentAegisOps/aegisops/issues';

interface WorkspaceHeaderProps {
  productName: string;
  /** Without a logo the mark shows the product name's initial. */
  logoUrl?: string | null;
  workspaces: HeaderWorkspace[];
  /** Null while navigation data is loading. */
  currentWorkspace: NavWorkspaceId | null;
  onSelectWorkspace: (id: NavWorkspaceId) => void;
  hasUnseenSuites: boolean;
  onOpenSceneManager: () => void;
  notifications: UserNotification[];
  onOpenNotification: (notification: UserNotification) => void;
  taskCounts?: { running: number; queued: number } | null;
  onOpenMobileNav: () => void;
}

const ICON_BUTTON_CLASS =
  'relative flex h-8 w-8 shrink-0 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-ui-secondary transition-colors hover:bg-ui-hover hover:text-ui-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus [&_svg]:stroke-[1.75]';

/**
 * The bar above sidebar and content: product name, module navigation,
 * display preferences, notifications and help.
 */
export default function WorkspaceHeader({
  productName,
  logoUrl,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  hasUnseenSuites,
  onOpenSceneManager,
  notifications,
  onOpenNotification,
  taskCounts,
  onOpenMobileNav,
}: WorkspaceHeaderProps) {
  const { t, i18n } = useTranslation('nav');
  const { mode, setTheme } = useContext(ThemeContext);
  const ThemeIcon = mode === 'system' ? Monitor : mode === 'dark' ? Moon : Sun;
  const themeOptions: { mode: ThemeMode; label: string; icon: LucideIcon }[] = [
    { mode: 'system', label: t('systemTheme'), icon: Monitor },
    { mode: 'light', label: t('lightTheme'), icon: Sun },
    { mode: 'dark', label: t('darkTheme'), icon: Moon },
  ];
  const navigate = useNavigate();
  const activeTasks = (taskCounts?.running ?? 0) + (taskCounts?.queued ?? 0);
  const hasUnread = notifications.length > 0 || activeTasks > 0;
  const brandInitial = (productName.trim().charAt(0) || 'F').toUpperCase();

  return (
    <div data-sidebar-utilities className="aegisops-sidebar-utilities mb-2 flex justify-center border-b border-ui-border pb-2">
      <div className="flex flex-wrap justify-center items-center gap-0.5">
        <HeaderMenu placement="above" label={t('language')} align="right" menuClassName="yushu-utility-menu yushu-menu-language w-60" triggerClassName={ICON_BUTTON_CLASS} trigger={<Languages className="h-[18px] w-[18px]" />}>
          {(close) => (
            <>
              <div className={MENU_LABEL_CLASS}>{t('language')}</div>
              {[{ code: 'zh-CN', label: '简体中文' }, { code: 'en-US', label: 'English' }].map((language) => {
                const selected = i18n.language.startsWith(language.code.slice(0, 2));
                return (
                  <button key={language.code} type="button" role="menuitemradio" aria-checked={selected} className={MENU_ITEM_CLASS}
                    onClick={() => { void i18n.changeLanguage(language.code); close(true); }}>
                    <span className="yushu-language-mark">{language.code === 'zh-CN' ? '中' : 'EN'}</span><span className="flex-1">{language.label}<span className="yushu-menu-description">{language.code === 'zh-CN' ? 'Chinese, simplified' : 'English, United States'}</span></span>
                    {selected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </>
          )}
        </HeaderMenu>

        <HeaderMenu placement="above" label={t('theme')} align="right" menuClassName="yushu-utility-menu yushu-menu-theme w-72" triggerClassName={ICON_BUTTON_CLASS} trigger={<ThemeIcon className="h-[18px] w-[18px]" />}>
          {(close) => (
            <>
              <div className={MENU_LABEL_CLASS}>{t('theme')}</div>
              {themeOptions.map((option) => (
                <button key={option.mode} type="button" role="menuitemradio" aria-checked={mode === option.mode} className={MENU_ITEM_CLASS}
                  onClick={() => { setTheme(option.mode); close(true); }}>
                  <span className="yushu-theme-preview" data-theme-preview={option.mode} aria-hidden="true"><i /><i /><i /></span><option.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{option.label}</span>
                  {mode === option.mode && <Check className="h-4 w-4" />}
                </button>
              ))}
            </>
          )}
        </HeaderMenu>

        <HeaderMenu
          placement="above"
          label={t('notifications')}
          align="right"
          menuClassName="yushu-utility-menu yushu-menu-notifications w-80"
          triggerClassName={ICON_BUTTON_CLASS}
          trigger={(
            <>
              <Bell className="h-[18px] w-[18px]" />
              {hasUnread && (
                <span data-notification-dot className="absolute right-2 top-2 h-2 w-2 rounded-full bg-lime-500 ring-2 ring-ui-surface" />
              )}
            </>
          )}
        >
          {(close) => (
            <>
              <div className={MENU_LABEL_CLASS}>{t('notifications')}</div>
              {activeTasks > 0 && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    navigate('/tasks');
                  }}
                  className={MENU_ITEM_CLASS}
                >
                  <ListTodo className="h-4 w-4 shrink-0 text-ui-secondary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t('tasksInProgress', { count: activeTasks })}</span>
                    <span className="block text-xs text-ui-muted">{t('viewTaskCenter')}</span>
                  </span>
                </button>
              )}
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onOpenNotification(notification);
                  }}
                  className={MENU_ITEM_CLASS}
                >
                  <Bell className="h-4 w-4 shrink-0 self-start text-ui-secondary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{notification.title}</span>
                    {notification.summary && (
                      <span className="line-clamp-2 block text-xs text-ui-muted">{notification.summary}</span>
                    )}
                  </span>
                </button>
              ))}
              {!hasUnread && (
                <div className="yushu-notifications-empty"><Bell aria-hidden="true" /><p>{t('noNotifications')}</p><span>{i18n.language.startsWith('zh') ? '任务动态与系统消息将在这里显示' : 'Task activity and system messages appear here'}</span></div>
              )}
            </>
          )}
        </HeaderMenu>


      </div>
    </div>
  );
}
