import { Suspense, lazy, useEffect } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Navigate, matchRoutes, useLocation, useParams, type RouteObject } from 'react-router-dom';
import LazyLoadErrorBoundary from '@/components/common/LazyLoadErrorBoundary';
import RoutePageSkeleton from '@/components/common/RoutePageSkeleton';
import Home from '@/pages/Home';
import { useAuth } from '@/contexts/AuthContext';
import { preloadI18nNamespaces } from '@/i18nResources';
import { recoverLazyLoad } from '@/utils/chunkLoadRecovery';
import registry from '@ext/registry';

// All non-Home pages are code-split. Home stays eager because it's the very
// first frame after auth and we don't want a Suspense flash on initial paint.
// In particular, Session/Agent and the auth screens are kept lazy so heavy
// transitive deps (SessionChat ~2.7k LOC + react-markdown + rehype/remark +
// highlight.js) are not pulled into the main entry chunk.
type LazyPageModule = { default: ComponentType<any> };

export function lazyPage<T extends LazyPageModule>(
  loader: () => Promise<T>,
  namespaces: readonly string[] = [],
) {
  let pending: Promise<T> | undefined;
  const preload = () => pending ??= recoverLazyLoad(
    Promise.all([loader(), preloadI18nNamespaces(namespaces)])
      .then(([module]) => module),
  ).catch((error) => { pending = undefined; throw error; });
  return Object.assign(lazy(preload), { preload });
}

const SessionPage = lazyPage(() => import('@/pages/Session'), ['session']);
const AgentPage = lazyPage(() => import('@/pages/Agent'), ['agent']);
export const LoginPage = lazyPage(() => import('@/pages/Login'));
export const SetupAdminPage = lazyPage(() => import('@/pages/SetupAdmin'));
export const ForceChangePasswordPage = lazyPage(() => import('@/pages/ForceChangePassword')); // secret-guard: allow 变量名带 Password，值是懒加载组件
const WorkflowListPage = lazyPage(() => import('@/pages/Workflow'), ['workflow']);
const WorkflowCreate = lazyPage(() => import('@/pages/WorkflowCreate'), ['workflow']);
const WorkflowEditor = lazyPage(() => import('@/pages/WorkflowEditor'), ['workflow']);
const WorkflowDetail = lazyPage(() => import('@/pages/WorkflowDetail'), ['workflow']);
const TaskPage = lazyPage(() => import('@/pages/Task'), ['task']);
const ToolPage = lazyPage(() => import('@/pages/Tool'), ['tool']);
const HubPage = lazyPage(() => import('@/pages/Hub'));
const SkillPage = lazyPage(() => import('@/pages/Skill'), ['skill']);
const ModelPage = lazyPage(() => import('@/pages/Model'), ['model']);
const ChannelPage = lazyPage(() => import('@/pages/Channel'), ['channel']);
const PermissionPage = lazyPage(() => import('@/pages/Permission'), ['permission']);
const WorkspacePage = lazyPage(() => import('@/pages/Workspace'), ['workspace']);
const DeviceIntegrationPage = lazyPage(() => import('@/pages/DeviceIntegration'), ['device']);
// Settings preloads the namespaces of registered extension sections so their
// sidebar labels are translated on first paint.
export const SettingsPage = lazyPage(
  () => import('@/pages/Settings'),
  registry.settingsSections.flatMap((section) => (section.ns ? [section.ns] : [])),
);
export const SceneSuitesPage = lazyPage(() => import('@/pages/SceneSuites'));
const WebUIContractPageHost = lazyPage(() => import('@/pages/WebUIContractPageHost'));
const WebUIContractWorkspaceHost = lazyPage(() => import('@/pages/WebUIContractWorkspaceHost'));
const ROUTE_FALLBACK_DELAY_MS = 70;

function RouteReady({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    const frame = requestAnimationFrame(() => window.dispatchEvent(
      new CustomEvent('aegis:route-ready', { detail: location.pathname }),
    ));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);
  return <>{children}</>;
}

export function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<div data-route-loading><RoutePageSkeleton delayMs={ROUTE_FALLBACK_DELAY_MS} /></div>}>
        <RouteReady>{children}</RouteReady>
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}

export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// Routes registered by the build-time extension registry, code-split the same way.
const extensionRoutes = registry.routes.map((route) => ({
  ...route,
  Component: lazyPage(route.load, route.i18nNamespaces ?? []),
}));

function extensionRouteObject(route: (typeof extensionRoutes)[number]): RouteObject {
  const element = <LazyRoute><route.Component /></LazyRoute>;
  return {
    path: route.path,
    element: route.adminOnly ? <AdminOnlyRoute>{element}</AdminOnlyRoute> : element,
  };
}

/** Extension pages, inside the main layout (one keep-alive pane each). */
export const appExtensionRoutes: RouteObject[] = extensionRoutes.map(extensionRouteObject);

export function LegacyWebUIContractPageRedirect() {
  const params = useParams();
  const location = useLocation();
  const pageId = params.pageId;
  const rest = params['*'];
  if (!pageId) return <Navigate to="/" replace />;
  return (
    <Navigate
      to={`/contracts/webui/${pageId}${rest ? `/${rest}` : ''}${location.search}${location.hash}`}
      replace
    />
  );
}

/**
 * Pages shown inside the main layout. The layout keeps one pane alive per open
 * tab and matches these routes against each tab's own location, so the list
 * lives here instead of being nested under the layout route.
 */
export const contentRoutes: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: 'contracts/webui/workspaces/:workspaceId/:pageId?', element: <LazyRoute><WebUIContractWorkspaceHost /></LazyRoute> },
  { path: 'contracts/webui/:pageId/*', element: <LazyRoute><WebUIContractPageHost /></LazyRoute> },
  { path: 'user-defined-pages/:pageId/*', element: <LegacyWebUIContractPageRedirect /> },

  // AI 工作台
  { path: 'sessions/:sessionId?', element: <LazyRoute><SessionPage /></LazyRoute> },
  { path: 'agents', element: <LazyRoute><AgentPage /></LazyRoute> },
  { path: 'workflows', element: <LazyRoute><WorkflowListPage /></LazyRoute> },
  { path: 'workflows/new', element: <LazyRoute><WorkflowCreate /></LazyRoute> },
  { path: 'workflows/:id', element: <LazyRoute><WorkflowDetail /></LazyRoute> },
  { path: 'workflows/:id/edit', element: <LazyRoute><WorkflowEditor /></LazyRoute> },
  { path: 'tasks', element: <LazyRoute><TaskPage /></LazyRoute> },
  { path: 'workspace', element: <LazyRoute><WorkspacePage /></LazyRoute> },

  // 设备接入
  { path: 'devices', element: <LazyRoute><DeviceIntegrationPage /></LazyRoute> },

  // Agent Smith
  { path: 'tools', element: <LazyRoute><ToolPage /></LazyRoute> },
  { path: 'hub', element: <LazyRoute><HubPage /></LazyRoute> },
  { path: 'models', element: <LazyRoute><ModelPage /></LazyRoute> },
  { path: 'skills', element: <LazyRoute><SkillPage /></LazyRoute> },
  // MCP 已整合到工具清单页面
  { path: 'mcp', element: <Navigate to="/tools" replace /> },

  // 场景工作区分区
  { path: 'scenes/suites', element: <LazyRoute><SceneSuitesPage /></LazyRoute> },
  { path: 'scenes', element: <Navigate to="/scenes/suites" replace /> },

  // 系统设置分区
  { path: 'settings', element: <LazyRoute><SettingsPage /></LazyRoute> },
  { path: 'settings/:sectionId', element: <LazyRoute><SettingsPage /></LazyRoute> },

  { path: 'config', element: <Navigate to="/settings/account" replace /> },
  { path: 'config/*', element: <Navigate to="/settings/account" replace /> },
  { path: 'system-logs', element: <Navigate to="/settings/system-logs" replace /> },
  { path: 'channels', element: <LazyRoute><ChannelPage /></LazyRoute> },
  { path: 'permissions', element: <LazyRoute><PermissionPage /></LazyRoute> },
  { path: 'audit-logs', element: <Navigate to="/settings/audit-logs" replace /> },
  { path: 'admin/users', element: <Navigate to="/settings/account" replace /> },
  // A private build registers its own pages (for example an upgrade
  // flow) through @ext/registry; they get a keep-alive pane like any other.
  ...appExtensionRoutes,
  { path: '*', element: <Navigate to="/" replace /> },
];

/** Pages that manage their own scrolling and fill the content area edge to edge. */
export const FULL_SCREEN_PATH_PATTERNS = [
  '/workflows/create',
  '/workflows/:id/edit',
  '/workflows/:id',
  '/sessions/:sessionId?',
  '/devices',
  '/contracts/webui/*',
];

// Warm only code and translations on navigation intent; no business requests.
const preloadRoutes = [
  { path: '/sessions/:id?', page: SessionPage },
  { path: '/agents', page: AgentPage },
  { path: '/tasks', page: TaskPage },
  { path: '/workspace', page: WorkspacePage },
  { path: '/workflows', page: WorkflowListPage },
  { path: '/workflows/new', page: WorkflowCreate },
  { path: '/workflows/:id/edit', page: WorkflowEditor },
  { path: '/workflows/:id', page: WorkflowDetail },
  { path: '/tools', page: ToolPage }, { path: '/hub', page: HubPage },
  { path: '/models', page: ModelPage }, { path: '/skills', page: SkillPage },
  { path: '/settings/:sectionId?', page: SettingsPage },
  { path: '/devices', page: DeviceIntegrationPage },
  { path: '/channels', page: ChannelPage }, { path: '/permissions', page: PermissionPage },
  { path: '/scenes/suites', page: SceneSuitesPage },
  { path: '/contracts/webui/workspaces/:id/:page?', page: WebUIContractWorkspaceHost },
  { path: '/contracts/webui/:id/*', page: WebUIContractPageHost },
  ...extensionRoutes.map(route => ({ path: route.path, page: route.Component })),
];
export function preloadContentRoute(pathname: string): Promise<unknown> {
  const matches = matchRoutes(preloadRoutes, pathname);
  const match = matches?.[matches.length - 1];
  return match?.route.page.preload() ?? Promise.resolve();
}
