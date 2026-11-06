import NavSelection from './NavSelection';
import { preloadContentRoute } from '@/routes/contentRoutes';
import { Link, useLocation, useNavigate, type RouteObject } from 'react-router-dom';
import {
  Home,
  LogOut,
  Menu,
  X,
  Bot,
  Blocks,
  Brain,
  Database,
  FolderOpen,
  ServerCog,
  Wrench,
  MessageSquarePlus,
  Workflow,
  ListTodo,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Layers,
  ShieldCheck,
  ScanSearch,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { onboardingAPI } from '@/api/onboarding';

const SIDEBAR_COLLAPSED_KEY = 'aegisops_layout_sidebar_collapsed';

type LazyLayoutModule = { default: ComponentType<any> };

function lazyLayoutComponent<T extends LazyLayoutModule>(
  loader: () => Promise<T>,
  namespaces: readonly string[] = [],
) {
  return lazy(() => recoverLazyLoad(
    Promise.all([loader(), preloadI18nNamespaces(namespaces)]).then(([module]) => module),
  ));
}

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

const OnboardingModal = lazyLayoutComponent(() => import('@/components/common/OnboardingModal'));
const NotificationModal = lazyLayoutComponent(() => import('@/components/common/NotificationModal'), ['notification']);
import {
  ackNotification,
  getActiveNotifications,
  type UserNotification,
} from '@/api/notifications';
import registry, { type ExtensionNavItem } from '@ext/registry';
import { useAuth } from '@/contexts/AuthContext';
import { useProductName } from '@/contexts/ProductNameContext';
import { useConfirm } from '@/components/common/ConfirmDialog';
import { BackendStatusBanner } from '@/components/common/BackendStatusBanner';
import { InstallationResultBanner } from '@/components/common/InstallationResultBanner';
import { useWebUIContractPages } from '@/hooks/useWebUIContractPages';
import { useSceneSuiteUpdates } from '@/hooks/useSceneSuiteUpdates';
import { useTaskDashboard } from '@/hooks/useTasks';
import { preloadI18nNamespaces } from '@/i18nResources';
import { resolveWebUIContractPageIcon } from '@/utils/webuiContractPageIcons';
import {
  buildWebUIContractWorkspacePageList,
  buildWebUIContractWorkspaceSections,
  getLocalizedWebUIContractTitle,
  workspaceSectionHref,
} from '@/utils/webuiContractWorkspaceSections';
import { useWorkspacePageOrders } from '@/hooks/useWorkspacePageOrders';
import { useLayoutOpenTabs } from '@/hooks/useLayoutOpenTabs';
import { useSidebarResize } from '@/hooks/useSidebarResize';
import { findActiveTabHref, resolveOpenTabs } from '@/utils/layoutTabs';
import {
  AGENT_WORKSPACE,
  AGENT_WORKSHOP,
  AGENT_WORKSHOP_DEFAULT_PATH,
  AGENT_WORKSPACE_DEFAULT_PATH,
  CODE_AUDIT_WORKSPACE_ID,
  SOC_WORKSPACE_ID,
  SCENE_SUITES_PATH,
  isOpenSceneWorkspace,
  readCurrentWorkspace,
  readWorkspacePaths,
  resolveNavRoute,
  saveCurrentWorkspace,
  saveWorkspacePaths,
  sceneNavWorkspace,
  sceneWorkspaceIdOf,
  workspaceIdFromPath,
  type NavWorkspaceId,
  type NavWorkspacePaths,
} from '@/utils/navPartitions';
import WorkspaceHeader, { type HeaderWorkspace } from './WorkspaceHeader';
import type { AccountMenuExtraItem } from './AccountMenu';
import { useSettingsSectionGroups } from '@/utils/settingsSections';
import KeepAlivePanes from './KeepAlivePanes';
import { contentRoutes as appContentRoutes } from '@/routes/contentRoutes';
import LazyLoadErrorBoundary from '@/components/common/LazyLoadErrorBoundary';
import type { WebUIContractWorkspaceListItem } from '@/api/webuiContractPages';
import { recoverLazyLoad } from '@/utils/chunkLoadRecovery';

// Pane used for routes that are not a nav entry (settings, scene manager).
const TRANSIENT_PANE_HREF = '__current__';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  pageId?: string;
  /** Starts a new chat instead of routing to a stored path. */
  action?: 'new-chat' | 'logout';
  count?: number;
  accent?: boolean;
}

interface NavSection {
  id: string;
  name?: string;
  items: NavItem[];
  collapsible?: boolean;
}

interface LayoutProps {
  contentRoutes?: RouteObject[];
}

/** Scene workspaces the switcher offers, in the order the API returns them. */
function sceneHeaderIcon(workspace: WebUIContractWorkspaceListItem): LucideIcon {
  const id = workspace.id.toLowerCase();
  if (id.includes('soc')) return ShieldCheck;
  if (id.includes('code') || id.includes('audit') || id.includes('security')) return ScanSearch;
  return Layers;
}

export default function Layout({ contentRoutes = appContentRoutes }: LayoutProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const { t, i18n } = useTranslation('nav');
  const { t: tAuth } = useTranslation('auth');
  const { productName, logoUrl } = useProductName();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const sidebarResize = useSidebarResize(!collapsed);
  const isHome = location.pathname === '/';
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingCheckGeneration = useRef(0);
  // Onboarding writes model credentials and the default model, so only admins get it
  // (and a session that drops to member does not keep the dialog).
  const canOnboard = user?.role === 'admin';
  const onboardingOpen = showOnboarding && canOnboard;
  const [openedNotification, setOpenedNotification] = useState<UserNotification | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [backendNotificationsReady, setBackendNotificationsReady] = useState(false);
  const [acknowledgingNotificationIds, setAcknowledgingNotificationIds] = useState<string[]>([]);
  const lastNotificationFetchKeyRef = useRef<string | null>(null);

  const {
    pages: webuiContractPages,
    workspaces: webuiContractWorkspaces = [],
    loading: webuiContractNavLoading,
    error: webuiContractNavError,
  } = useWebUIContractPages();
  const viewingScenes = location.pathname === '/scenes' || location.pathname.startsWith('/scenes/');
  const { hasUnseenSuites } = useSceneSuiteUpdates({ viewingScenes, userId: user?.id });
  const workspacePageOrders = useWorkspacePageOrders();
  const { counts: taskCounts } = useTaskDashboard();
  const [openTabRecords, setOpenTabRecords] = useLayoutOpenTabs();
  const openTabRecordsRef = useRef(openTabRecords);
  useEffect(() => {
    openTabRecordsRef.current = openTabRecords;
  }, [openTabRecords]);
  const [collapsedNavSectionIds, setCollapsedNavSectionIds] = useState<Set<string>>(new Set(['settings']));

  // Entries an extension registered, admin-only ones dropped for members, in
  // registry order. Empty in a stock build.
  const extensionNavItems = useMemo(() => {
    const label = (item: ExtensionNavItem) => {
      const ns = item.ns || 'nav';
      return i18n.exists?.(item.labelKey, { ns }) === false
        ? item.labelKey
        : t(item.labelKey, { ns, productName });
    };
    const toItem = (item: ExtensionNavItem): AccountMenuExtraItem => ({
      id: item.id,
      name: label(item),
      href: item.href,
      icon: item.icon,
      highlight: item.highlight,
      badge: item.badge,
    });
    const visible = registry.navItems
      .filter((item) => !item.adminOnly || user?.role === 'admin')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return {
      accountMenu: visible.filter((item) => item.placement === 'accountMenu').map(toItem),
      // Sidebar entries join the Agent workshop's tools and models group.
      workshop: visible.filter((item) => (item.placement ?? 'sidebar') === 'sidebar').map(toItem),
    };
  }, [i18n, productName, t, user?.role]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Collapse memory is a convenience only.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isHome || !canOnboard) return undefined;
    let cancelled = false;
    const generation = ++onboardingCheckGeneration.current;
    onboardingAPI.getStatus()
      .then((res) => {
        if (!cancelled && generation === onboardingCheckGeneration.current
          && !res.data.completed && !res.data.dismissed) setShowOnboarding(true);
      })
      .catch(() => {
        // Only open automatically when the server confirms setup is needed.
        // An unavailable status must not bypass a saved dismissal preference.
      });
    return () => {
      cancelled = true;
    };
  }, [isHome, canOnboard, user?.id]);

  const handleOpenOnboarding = useCallback(() => {
    if (canOnboard) {
      onboardingCheckGeneration.current += 1;
      setShowOnboarding(true);
    }
  }, [canOnboard]);

  const handleCloseOnboarding = useCallback(() => {
    onboardingCheckGeneration.current += 1;
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    window.addEventListener('aegisops:open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('aegisops:open-onboarding', handleOpenOnboarding);
  }, [handleOpenOnboarding]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setOpenedNotification(null);
      setBackendNotificationsReady(false);
      setAcknowledgingNotificationIds([]);
      lastNotificationFetchKeyRef.current = null;
      return;
    }
    const fetchKey = `${user.id}:${i18n.language}`;
    if (lastNotificationFetchKeyRef.current === fetchKey) return;
    const previousFetchKey = lastNotificationFetchKeyRef.current;
    lastNotificationFetchKeyRef.current = fetchKey;
    setBackendNotificationsReady(false);

    let cancelled = false;
    void getActiveNotifications(i18n.language)
      .then((items) => {
        if (cancelled) return;
        setNotifications((prev) => {
          const byId = new Map(prev.map((item) => [item.id, item]));
          for (const item of items) {
            if (['whats_new', 'announcement', 'benefit'].includes(item.kind)) continue;
            byId.set(item.id, item);
          }
          return Array.from(byId.values()).sort((a, b) => a.priority - b.priority);
        });
        setBackendNotificationsReady(true);
      })
      .catch(() => {
        // Notification failures should never block the main product surface.
        if (lastNotificationFetchKeyRef.current === fetchKey) {
          lastNotificationFetchKeyRef.current = previousFetchKey;
        }
        if (!cancelled) {
          setBackendNotificationsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [i18n.language, user?.id]);

  // Notifications open only through an explicit click; community announcements never interrupt work.
  const visibleNotifications = !onboardingOpen && openedNotification ? [openedNotification] : [];

  const removeNotifications = useCallback((items: UserNotification[]) => {
    const visibleIds = new Set(items.map((item) => item.id));
    setNotifications((prev) => prev.filter((item) => !visibleIds.has(item.id)));
    setOpenedNotification((prev) => (prev && visibleIds.has(prev.id) ? null : prev));
  }, []);

  const closeVisibleNotification = useCallback((notification?: UserNotification) => {
    if (visibleNotifications.length === 0 || acknowledgingNotificationIds.length > 0) return;
    removeNotifications(notification ? [notification] : visibleNotifications);
  }, [acknowledgingNotificationIds.length, removeNotifications, visibleNotifications]);

  const dismissVisibleNotificationForever = useCallback(async () => {
    if (acknowledgingNotificationIds.length > 0) return;
    if (visibleNotifications.length === 0) return;
    setAcknowledgingNotificationIds(visibleNotifications.map((item) => item.id));
    try {
      await Promise.all(visibleNotifications.map((item) => ackNotification(item.id)));
    } catch {
      // Keep the UI moving; the server will retry visibility on the next login if dismiss failed.
    } finally {
      removeNotifications(visibleNotifications);
      setAcknowledgingNotificationIds([]);
    }
  }, [acknowledgingNotificationIds.length, removeNotifications, visibleNotifications]);

  // ── Workspaces ────────────────────────────────────────────────────────────
  const sceneWorkspaces = useMemo(
    () => webuiContractWorkspaces.filter((workspace) => workspace.placement === 'sceneWorkspace'),
    [webuiContractWorkspaces],
  );
  const openSceneWorkspaces = useMemo(
    () => sceneWorkspaces.filter(isOpenSceneWorkspace),
    [sceneWorkspaces],
  );
  const headerWorkspaces = useMemo<HeaderWorkspace[]>(() => {
    // Scene modules, SOC included, are shown only while their suite is installed, enabled
    // and unlocked; SOC defaults to the position after the workbench.
    // WorkspaceModuleNav applies the browser's custom header order.
    const socWorkspaces = openSceneWorkspaces.filter((workspace) => workspace.id === SOC_WORKSPACE_ID);
    const otherSceneWorkspaces = openSceneWorkspaces.filter((workspace) => workspace.id !== SOC_WORKSPACE_ID);
    return [
      { id: AGENT_WORKSPACE, name: t('workbench'), icon: Home },
      ...[...socWorkspaces, ...otherSceneWorkspaces].map((workspace) => ({
        id: sceneNavWorkspace(workspace.id),
        name: getLocalizedWebUIContractTitle(workspace, i18n.language),
        icon: sceneHeaderIcon(workspace),
      })),
      { id: AGENT_WORKSHOP, name: t('agentWorkshop'), icon: Bot, separated: true },
    ];
  }, [i18n.language, openSceneWorkspaces, t]);

  const navStateReady = !webuiContractNavLoading
    || webuiContractWorkspaces.length > 0
    || webuiContractPages.length > 0;

  // Last path visited inside each workspace, so switching back lands there.
  // Extension pages listed in the workshop's menu belong to the workshop.
  const workshopPaths = useMemo(() => extensionNavItems.workshop.map((item) => item.href), [extensionNavItems]);
  const workspacePathsRef = useRef<NavWorkspacePaths>(readWorkspacePaths(workshopPaths));
  // Validate remembered paths against the workspace's current placement.
  const pathNavigation = useCallback((path: string | undefined): NavWorkspaceId | null => {
    if (!path) return null;
    const route = resolveNavRoute(path, webuiContractWorkspaces, workshopPaths);
    return route.kind === 'workspace' ? route.workspace : null;
  }, [webuiContractWorkspaces, workshopPaths]);

  // Remember the module to return to when leaving settings or scene management.
  const routeNav = resolveNavRoute(`${location.pathname}${location.search}`, navStateReady ? webuiContractWorkspaces : null, workshopPaths);
  const [rememberedWorkspace, setRememberedWorkspace] = useState<NavWorkspaceId>(readCurrentWorkspace);
  const routeWorkspace = routeNav.kind === 'workspace' ? routeNav.workspace : null;
  const inHeader = (workspaceId: NavWorkspaceId | null) => headerWorkspaces.some((workspace) => workspace.id === workspaceId);
  const currentWorkspace = routeWorkspace ?? (inHeader(rememberedWorkspace) ? rememberedWorkspace : AGENT_WORKSPACE);
  useEffect(() => {
    if (!routeWorkspace || !navStateReady) return;
    // Only remember scene modules that are open.
    const sceneId = sceneWorkspaceIdOf(routeWorkspace);
    if (sceneId && !openSceneWorkspaces.some((workspace) => workspace.id === sceneId)) return;
    setRememberedWorkspace(routeWorkspace);
    saveCurrentWorkspace(routeWorkspace);
  }, [navStateReady, openSceneWorkspaces, routeWorkspace]);

  useEffect(() => {
    if (!routeWorkspace || !navStateReady) return;
    const path = `${location.pathname}${location.search}`;
    const next = { ...workspacePathsRef.current, [routeWorkspace]: path };
    workspacePathsRef.current = next;
    saveWorkspacePaths(next);
  }, [location.pathname, location.search, navStateReady, routeWorkspace]);

  const newChat = useCallback(() => {
    setSidebarOpen(false);
    navigate('/sessions', { state: { skipLastSelectedSessionRestore: true } });
  }, [navigate]);

  // ── Sidebar sections for the current workspace ───────────────────────────
  const workbenchSection = useMemo<NavSection>(() => {
    const workbenchItems: NavItem[] = webuiContractWorkspaces
      .filter((workspace) => workspace.placement === 'aiWorkbench' && workspace.enabled && !workspace.locked)
      .flatMap((workspace) => workspacePageOrders
        .apply(workspace.id, buildWebUIContractWorkspacePageList(workspace, i18n.language)
          .filter((page) => page.enabled && page.buildStatus === 'ready'))
        .map((page) => ({
          pageId: page.id,
          name: page.title,
          href: `${workspace.route}/${page.id}`,
          icon: resolveWebUIContractPageIcon(page.icon),
        })));
    const customItems: NavItem[] = webuiContractPages
      .filter((page) => !page.workspaceId && page.enabled && page.placement === 'home.after' && page.buildStatus === 'ready')
      .map((page) => ({
        name: getLocalizedWebUIContractTitle(page, i18n.language),
        href: page.route,
        icon: resolveWebUIContractPageIcon(page.icon),
      }));
    return {
      id: 'agent',
      name: t('workbench'),
      items: [
        { name: t('aegisopsHome'), href: '/', icon: Home },
        { name: i18n.language.startsWith('zh') ? '对话' : 'Conversations', href: '/sessions', icon: MessageSquarePlus },
        { name: t('tasks'), href: '/tasks', icon: ListTodo, count: taskCounts ? (taskCounts.running ?? 0) + (taskCounts.queued ?? 0) : undefined },
        { name: t('workspace'), href: '/workspace', icon: FolderOpen },
        ...workbenchItems,
        ...customItems,
      ],
    };
  }, [i18n.language, taskCounts, t, webuiContractPages, webuiContractWorkspaces, workspacePageOrders]);

  const workshopSections = useMemo<NavSection[]>(() => [
    { id: 'orchestration', name: t('capabilityOrchestration'), items: [
      { name: t('agents'), href: '/agents', icon: Bot },
      { name: t('skills'), href: '/skills', icon: Sparkles },
      { name: t('workflows'), href: '/workflows', icon: Workflow },
    ] },
    { id: 'knowledge-memory', name: t('knowledgeAndMemory'), items: [
      { name: t('knowledgeBase'), href: '/workspace?tab=knowledge', icon: Database },
      { name: t('memory'), href: '/workspace?tab=memory', icon: Brain },
    ] },
    { id: 'tools-models', name: t('toolsAndModels'), items: [
      { name: t('tools'), href: '/tools', icon: Wrench },
      { name: t('deviceIntegration'), href: '/devices', icon: ServerCog },
      { name: t('models'), href: '/models', icon: Brain },
      { name: t('channels'), href: '/channels', icon: Radio },
      { name: t('hub', { productName }), href: '/hub', icon: Blocks },
      ...extensionNavItems.workshop,
    ] },
  ], [extensionNavItems, productName, t]);

  const sceneSections = useMemo(() => {
    const map = new Map<string, NavSection[]>();
    for (const workspace of openSceneWorkspaces) {
      const readyPages = (pages: WebUIContractWorkspaceListItem['pages']) => pages.filter((page) => page.enabled && page.buildStatus === 'ready');
      const groups: NavSection[] = (workspace.sections?.length ?? 0) > 0
        ? buildWebUIContractWorkspaceSections(workspace, i18n.language).reduce<NavSection[]>((result, section) => {
          const pages = workspacePageOrders.apply(`${workspace.id}:${section.id}`, readyPages(section.pages));
          if (section.flat) {
            // One item named by the section; consecutive flat sections share a header-less group.
            const page = pages.find((item) => item.id === section.defaultPageId) ?? pages[0];
            if (!page) return result;
            const item: NavItem = {
              pageId: page.id,
              name: workspace.id === CODE_AUDIT_WORKSPACE_ID && section.id === 'home' ? t('codeAuditProjects') : section.label,
              href: workspaceSectionHref(workspace.route, section, page.id),
              icon: resolveWebUIContractPageIcon(section.icon || page.icon),
            };
            const last = result[result.length - 1];
            if (last && !last.name) last.items.push(item);
            else result.push({ id: `scene:${workspace.id}:${section.id}`, items: [item] });
            return result;
          }
          result.push({
            id: `scene:${workspace.id}:${section.id}`,
            name: section.label,
            collapsible: true,
            items: pages.map((page) => ({
              pageId: page.id,
              name: page.title,
              href: workspaceSectionHref(workspace.route, section, page.id),
              icon: resolveWebUIContractPageIcon(page.icon),
            } as NavItem)),
          });
          return result;
        }, [])
        : [{
          id: `scene:${workspace.id}`,
          items: workspacePageOrders
            .apply(workspace.id, readyPages(buildWebUIContractWorkspacePageList(workspace, i18n.language)))
            .map((page) => ({
              pageId: page.id,
              name: page.title,
              href: `${workspace.route}/${page.id}`,
              icon: resolveWebUIContractPageIcon(page.icon),
            } as NavItem)),
        }];
      map.set(sceneNavWorkspace(workspace.id), groups.filter((group) => group.items.length > 0));
    }
    return map;
  }, [i18n.language, openSceneWorkspaces, workspacePageOrders, t]);

  const { groups: settingsGroups } = useSettingsSectionGroups();
  const settingsSection = useMemo<NavSection>(() => ({
    id: 'settings',
    name: t('systemConfiguration'),
    collapsible: true,
    items: settingsGroups.flatMap((group) => group.items)
      .map((item) => ({ name: item.name, href: `/settings/${item.id}`, icon: item.icon })),
  // Account actions live with system configuration.
  }), [settingsGroups, t]);
  const viewingConfiguration = routeNav.kind === 'settings';
  useEffect(() => {
    if (viewingConfiguration) setCollapsedNavSectionIds((current) => {
      if (!current.has('settings')) return current;
      const next = new Set(current);
      next.delete('settings');
      return next;
    });
  }, [viewingConfiguration]);
  const visibleSections = useMemo<NavSection[]>(() => {
    const scenes: NavSection[] = [{
      id: 'scene-management', name: i18n.language.startsWith('zh') ? '场景中心' : 'Scenes',
      items: [{ name: t('sceneManagement'), href: SCENE_SUITES_PATH, icon: Layers }],
    }];
    for (const workspace of openSceneWorkspaces) {
      const activeScene = workspaceIdFromPath(location.pathname);
      const groups = activeScene === workspace.id ? sceneSections.get(sceneNavWorkspace(workspace.id)) ?? [] : [];
      if (groups.length === 0) scenes.push({ id: workspace.id, items: [{ name: getLocalizedWebUIContractTitle(workspace, i18n.language), href: workspace.route, icon: sceneHeaderIcon(workspace) }] });
      scenes.push(...groups.map((group) => ({
        ...group,
        name: group.name || getLocalizedWebUIContractTitle(workspace, i18n.language),
      })));
    }
    return workspaceIdFromPath(location.pathname)
      ? [...scenes, workbenchSection, ...workshopSections, settingsSection]
      : [workbenchSection, ...workshopSections, ...scenes, settingsSection];
  }, [workbenchSection, workshopSections, sceneSections, openSceneWorkspaces, settingsSection, i18n.language, t, location.pathname]);

  // ── Keep-alive panes: every visited nav href stays mounted ────────────────
  const allNavItems = useMemo<NavItem[]>(() => {
    const items = [...workbenchSection.items, ...workshopSections.flatMap((section) => section.items)];
    for (const groups of sceneSections.values()) for (const group of groups) items.push(...group.items);
    return items;
  }, [workbenchSection, workshopSections, sceneSections]);
  const navItemsFlat = useMemo(() => {
    const seen = new Set<string>();
    const items: NavItem[] = [];
    for (const item of allNavItems) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      items.push(item);
    }
    return items;
  }, [allNavItems]);

  const isNavItemActive = useCallback((href: string) => {
    if (href.startsWith('/settings/') || href === SCENE_SUITES_PATH) return location.pathname === href;
    const active = findActiveTabHref(navItemsFlat.map((item) => item.href), location.pathname, location.search);
    return active === href;
  }, [location.pathname, location.search, navItemsFlat]);

  const activeTabHref = useMemo(
    () => findActiveTabHref(navItemsFlat.map((item) => item.href), location.pathname, location.search),
    [location.pathname, location.search, navItemsFlat],
  );
  const currentLocationPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!activeTabHref) return;
    const stored = openTabRecordsRef.current;
    const existing = stored.find((record) => record.href === activeTabHref);
    if (existing && existing.path === currentLocationPath) return;
    setOpenTabRecords(existing
      ? stored.map((record) => (record.href === activeTabHref ? { ...record, path: currentLocationPath } : record))
      : [...stored, { href: activeTabHref, path: currentLocationPath }]);
  }, [activeTabHref, currentLocationPath, setOpenTabRecords]);

  const openTabs = useMemo(() => {
    const tabs = resolveOpenTabs(navItemsFlat, openTabRecords).map((tab) => ({ href: tab.href, path: tab.path }));
    if (activeTabHref && !tabs.some((tab) => tab.href === activeTabHref)) {
      tabs.push({ href: activeTabHref, path: currentLocationPath });
    }
    return tabs;
  }, [activeTabHref, currentLocationPath, navItemsFlat, openTabRecords]);

  const keepAlivePanes = useMemo(() => {
    const panes = openTabs.map((tab) => ({ href: tab.href }));
    return activeTabHref ? panes : [...panes, { href: TRANSIENT_PANE_HREF }];
  }, [activeTabHref, openTabs]);
  const activePaneHref = activeTabHref ?? TRANSIENT_PANE_HREF;
  const openTabPathByHref = useMemo(() => {
    const map = new Map<string, string>();
    for (const tab of openTabs) map.set(tab.href, tab.path);
    return map;
  }, [openTabs]);
  // An entry reopens where it was left, but the entry on screen goes back to
  // its own page (from a project in the project list to the list itself).
  const navItemPath = useCallback(
    (href: string) => {
      if (href === '/workspace') return '/workspace?tab=files';
      return href === activeTabHref ? href : openTabPathByHref.get(href) ?? href;
    },
    [activeTabHref, openTabPathByHref],
  );

  // A scene whose workspace closed (uninstalled, disabled or locked by an
  // extension) cannot stay on screen: fall back to its suite manager.
  const routeSceneId = routeWorkspace && sceneWorkspaceIdOf(routeWorkspace)
    ? workspaceIdFromPath(location.pathname) : null;
  useEffect(() => {
    if (!navStateReady || webuiContractNavError || viewingScenes || !routeSceneId) return;
    if (!openSceneWorkspaces.some((workspace) => workspace.id === routeSceneId)) {
      navigate(SCENE_SUITES_PATH, { replace: true });
    }
  }, [navStateReady, navigate, openSceneWorkspaces, routeSceneId, viewingScenes, webuiContractNavError]);

  const selectWorkspace = useCallback((workspaceId: NavWorkspaceId) => {
    setSidebarOpen(false);
    if (workspaceId === AGENT_WORKSPACE && routeNav.kind === 'settings') {
      navigate(AGENT_WORKSPACE_DEFAULT_PATH);
      return;
    }
    if (workspaceId === currentWorkspace && routeNav.kind === 'workspace') return;
    const paths = workspacePathsRef.current;
    const stored = paths[workspaceId];
    if (stored && pathNavigation(stored) === workspaceId) {
      navigate(stored);
      return;
    }
    if (workspaceId === AGENT_WORKSPACE) {
      navigate(AGENT_WORKSPACE_DEFAULT_PATH);
      return;
    }
    if (workspaceId === AGENT_WORKSHOP) {
      navigate(AGENT_WORKSHOP_DEFAULT_PATH);
      return;
    }
    const sceneId = sceneWorkspaceIdOf(workspaceId);
    const workspace = openSceneWorkspaces.find((item) => item.id === sceneId);
    if (workspace) navigate(workspace.route);
  }, [currentWorkspace, navigate, openSceneWorkspaces, pathNavigation, routeNav.kind]);

  const toggleNavSection = useCallback((sectionId: string) => {
    setCollapsedNavSectionIds((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    const ok = await confirm({
      title: t('logout'),
      description: t('logoutConfirm'),
      confirmText: t('logout'),
    });
    if (ok) void logout();
  }, [confirm, logout, t]);

  const accountInitial = (user?.username || productName || 'F').trim().charAt(0).toUpperCase();
  const accountRoleLabel = user?.role === 'admin' ? tAuth('admin.roleAdmin') : tAuth('admin.roleMember');
  const navLinkClass = (active: boolean) => `flex items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ui-focus ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2 text-sm'} ${
    active
      ? 'aegisops-nav-active font-medium text-ui-text'
      : 'font-normal text-ui-text hover:bg-ui-hover hover:text-ui-text'
  }`;

  const renderNavItem = (item: NavItem) => {
    const active = isNavItemActive(item.href);
    const iconClass = `h-5 w-5 shrink-0 stroke-[1.75] ${
      item.accent ? 'text-ui-secondary' : 'text-ui-secondary'
    }`;
    if (item.action) {
      return (
        <button
          key={item.href}
          type="button"
          onClick={() => {
            if (item.action === 'logout') void handleLogout();
            else newChat();
            setSidebarOpen(false);
          }}
          title={collapsed ? item.name : undefined}
          data-tip={collapsed ? item.name : undefined}
          className={`w-full ${navLinkClass(false)} ${item.accent ? 'text-red-600 dark:text-red-400' : ''}`}
        >
          <item.icon aria-hidden="true" className={iconClass} />
          {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>}
        </button>
      );
    }
    return (
      <Link
        key={item.href}
        to={navItemPath(item.href)}
        onPointerEnter={() => { void preloadContentRoute(navItemPath(item.href)).catch(() => {}); }}
        onFocus={() => { void preloadContentRoute(navItemPath(item.href)).catch(() => {}); }}
        onClick={() => setSidebarOpen(false)}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.name : undefined}
        data-tip={collapsed ? item.name : undefined}
        className={navLinkClass(active)}
      >
        <item.icon aria-hidden="true" className={iconClass} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            {item.count ? <span className="shrink-0 rounded-full bg-ui-subtle px-1.5 text-xs font-normal text-ui-secondary">{item.count}</span> : null}
          </>
        )}
      </Link>
    );
  };

  const navigation = (
      <nav aria-label={t('moduleNavigation')} className={`aegis-module-nav relative isolate min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
        <NavSelection />
        {visibleSections.map((section) => {
          const sectionCollapsed = !collapsed && Boolean(section.collapsible) && collapsedNavSectionIds.has(section.id);
          return (
            <div key={section.id} className="mb-4">
              {!collapsed && section.name && (
                <h3 className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-ui-secondary">
                  {section.collapsible ? (
                    <button type="button" onClick={() => toggleNavSection(section.id)} aria-expanded={!sectionCollapsed}
                      className="flex h-6 w-full items-center justify-between rounded transition-colors hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
                      <span className="min-w-0 truncate">{section.name}</span>
                      <ChevronRight aria-hidden="true" className={`ml-2 h-3.5 w-3.5 shrink-0 transition-transform ${sectionCollapsed ? '' : 'rotate-90'}`} />
                    </button>
                  ) : section.name}
                </h3>
              )}
              {!sectionCollapsed && <div className="space-y-0.5">{section.items.map(renderNavItem)}{section.id === 'settings' && <>
                {extensionNavItems.accountMenu.map((item) => renderNavItem({ name: item.name, href: item.href, icon: item.icon }))}
                {renderNavItem({ name: t('logout'), href: '#logout', icon: LogOut, action: 'logout' })}
              </>}</div>}
            </div>
          );
        })}
      </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={`aegis-brand-row flex h-20 shrink-0 items-center ${collapsed ? 'flex-col justify-center gap-1 py-1' : 'pr-3'}`}>
      <Link to="/" onClick={() => setSidebarOpen(false)} className={`aegisops-brand flex min-w-0 flex-1 items-center ${collapsed ? 'justify-center px-2' : 'gap-2.5 pl-4 pr-1'}`} title={productName}>
        <span className="aegisops-brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
          {logoUrl ? <img src={logoUrl} alt="" data-brand-logo className="h-7 w-7" /> : <Bot className="h-5 w-5" />}
        </span>
        {!collapsed && <span className="min-w-0"><span className="block truncate text-base font-semibold tracking-tight">{productName}</span><span className="mt-0.5 block text-[10px] tracking-[0.16em] text-ui-muted">AEGISOPS</span></span>}
      </Link>
        <button type="button" onClick={toggleCollapsed} className="aegis-sidebar-toggle hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ui-muted transition-colors hover:bg-ui-hover hover:text-ui-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus lg:flex" aria-controls="layout-sidebar" aria-expanded={!collapsed} aria-label={collapsed ? t('expandNav') : t('collapseNav')} title={collapsed ? t('expandNav') : t('collapseNav')}>
          {collapsed ? <PanelLeftOpen aria-hidden="true" className="h-4 w-4" /> : <PanelLeftClose aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      <button type="button" onClick={() => setSidebarOpen(false)} aria-label={t('close')} className="absolute right-2 top-2 rounded p-1 text-ui-secondary lg:hidden"><X className="h-4 w-4" /></button>
      {!collapsed && openSceneWorkspaces.length > 0 && <div className="aegis-scene-switcher"><label htmlFor="aegis-scene-select">{i18n.language.startsWith('zh') ? '切换工作空间' : 'Workspace'}</label><select id="aegis-scene-select" aria-label="切换工作空间" value={workspaceIdFromPath(location.pathname) || 'agent'} onChange={event => selectWorkspace(event.target.value === 'agent' ? AGENT_WORKSPACE : sceneNavWorkspace(event.target.value))}><option value="agent">御枢工作台</option>{openSceneWorkspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{getLocalizedWebUIContractTitle(workspace, i18n.language)}</option>)}</select></div>}
      {navigation}
      <div className={`shrink-0 border-t border-ui-border ${collapsed ? 'p-2' : 'p-3'}`}>
      <WorkspaceHeader
        productName={productName}
        logoUrl={logoUrl}
        workspaces={headerWorkspaces}
        currentWorkspace={navStateReady && routeNav.kind === 'workspace' ? currentWorkspace : null}
        onSelectWorkspace={selectWorkspace}
        hasUnseenSuites={hasUnseenSuites}
        onOpenSceneManager={() => setSidebarOpen(false)}
        notifications={notifications}
        onOpenNotification={(notification) => {
          setOpenedNotification(notification);
        }}
        taskCounts={taskCounts ? { running: taskCounts.running ?? 0, queued: taskCounts.queued ?? 0 } : null}
        onOpenMobileNav={() => setSidebarOpen(true)}
      />

        <div className={`yushu-account-summary flex items-center ${collapsed ? 'justify-center py-2' : 'gap-2.5 px-2 py-3'}`} title={`${user?.username || productName} · ${accountRoleLabel}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ui-subtle text-xs font-medium text-ui-secondary">{accountInitial}</span>
          {!collapsed && <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{user?.username || productName}</span><span className="text-xs text-ui-muted">{accountRoleLabel}</span></div></div>}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="aegisops-shell min-h-screen bg-ui-canvas text-ui-text"
      style={{
        '--sidebar-width': `${collapsed ? 72 : sidebarResize.width}px`,
        '--sidebar-expanded-width': `${sidebarResize.width}px`,
      } as CSSProperties}
    >
      <LazyLoadErrorBoundary mode="overlay">
        <Suspense fallback={null}>
          {onboardingOpen && <OnboardingModal onClose={handleCloseOnboarding} />}
        </Suspense>
        <Suspense fallback={null}>
          {visibleNotifications.length > 0 && (
            <NotificationModal
              notifications={visibleNotifications}
              acknowledgingIds={acknowledgingNotificationIds}
              onAcknowledge={closeVisibleNotification}
              onClose={closeVisibleNotification}
              onDismissForever={dismissVisibleNotificationForever}
            />
          )}
        </Suspense>
      </LazyLoadErrorBoundary>

      <button type="button" onClick={() => setSidebarOpen(true)} aria-label={t('openNav')}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-ui-border bg-ui-surface shadow-sm lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        id="layout-sidebar"
        className={`aegisops-sidebar fixed bottom-0 left-0 top-0 z-40 w-[var(--sidebar-width)] border-r border-ui-border bg-ui-sidebar transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebar}
        {!collapsed && (
          <div
            role="separator"
            tabIndex={0}
            aria-label={t('resizeNav')}
            aria-orientation="vertical"
            aria-controls="layout-sidebar"
            aria-valuemin={sidebarResize.minimum}
            aria-valuemax={sidebarResize.maximum}
            aria-valuenow={sidebarResize.width}
            className="absolute inset-y-0 -right-1 z-10 hidden w-2 touch-none cursor-col-resize outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ui-focus lg:block"
            {...sidebarResize.handleProps}
          />
        )}

      </aside>

      <div className={`flex h-screen flex-col pt-14 lg:pt-0 max-md:h-[100dvh] lg:pl-[var(--sidebar-width)] ${sidebarResize.dragging ? '' : 'transition-[padding]'}`}>
        {/* In the flow under the fixed header: a fixed banner would either hide under it or cover it. */}
        <BackendStatusBanner inline />
        <InstallationResultBanner />
        <main className="relative flex-1 overflow-hidden bg-ui-canvas">
          <KeepAlivePanes panes={keepAlivePanes} activeHref={activePaneHref} location={location} routes={contentRoutes} />
        </main>
      </div>
    </div>
  );
}
