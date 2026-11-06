import { useEffect, useRef } from 'react';
import {
  matchPath,
  NavigationType,
  UNSAFE_LocationContext as LocationContext,
  useRoutes,
  type Location,
  type RouteObject,
} from 'react-router-dom';
import { FULL_SCREEN_PATH_PATTERNS } from '@/routes/contentRoutes';
import { PaneActiveContext } from './PaneActiveContext';

export interface KeepAlivePane {
  /** Tab identity (sidebar entry href). */
  href: string;
}

interface KeepAlivePanesProps {
  panes: KeepAlivePane[];
  activeHref: string | null;
  /** The router's live location; rendered by the active pane. */
  location: Location;
  routes: RouteObject[];
}

export function isFullScreenPath(pathname: string): boolean {
  return FULL_SCREEN_PATH_PATTERNS.some((pattern) => matchPath(pattern, pathname) !== null);
}

interface PaneProps {
  active: boolean;
  location: Location;
  routes: RouteObject[];
}

function Pane({ active, location, routes }: PaneProps) {
  // Match this pane's own location, and pin `useLocation()` for everything
  // inside it, so a hidden tab never reacts to the active tab's route.
  const element = useRoutes(routes, location);
  const transitionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const node = transitionRef.current;
    let animation: Animation | undefined;
    const enter = () => {
      animation?.cancel();
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      animation = node?.animate?.([
        { opacity: 0.6, transform: 'translateY(5px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 260, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    };
    const ready = (event: Event) => {
      if ((event as CustomEvent<string>).detail === location.pathname) enter();
    };
    window.addEventListener('aegis:route-ready', ready);
    // Cold lazy pages enter when their real content commits, not the fallback.
    if (!node?.querySelector('[data-route-loading]')) enter();
    return () => {
      window.removeEventListener('aegis:route-ready', ready);
      animation?.cancel();
    };
  }, [active, location.pathname, location.search]);
  const fullScreen = isFullScreenPath(location.pathname);
  // Descendants with transition-all can delay inherited visibility changes.
  // Hide the whole pane immediately with opacity while preserving its layout.
  return (
    <LocationContext.Provider value={{ location, navigationType: NavigationType.Pop }}>
      <PaneActiveContext.Provider value={active}>
        <div
          ref={transitionRef}
          data-yushu-transition
          data-yushu-route={location.pathname}
          className={`absolute inset-0 ${active ? '' : 'invisible opacity-0 pointer-events-none'}`}
          aria-hidden={active ? undefined : true}
          inert={!active}
          data-keep-alive-pane={active ? 'active' : 'inactive'}
        >
          {fullScreen ? element : (
            <div className="h-full overflow-y-auto">
              <div className="yushu-page-container min-h-full p-7 max-md:p-4">{element}</div>
            </div>
          )}
        </div>
      </PaneActiveContext.Provider>
    </LocationContext.Provider>
  );
}

/**
 * Browser-style tabs keep their page alive: one pane per open tab stays
 * mounted (state, scroll position, in-progress edits included) and only the
 * active one is visible. Inactive panes are hidden with `visibility` rather
 * than `display: none` so their layout and scroll offsets survive.
 */
export default function KeepAlivePanes({ panes, activeHref, location, routes }: KeepAlivePanesProps) {
  // Remember the last live location of each pane so a hidden pane keeps the
  // exact location object it last rendered with (stable identity, no re-runs).
  // A pane is only mounted once it has been active (tabs restored from a
  // previous session stay cold until they are opened), like a browser that
  // discards background tabs.
  const lastLocationsRef = useRef(new Map<string, Location>());
  if (activeHref) {
    lastLocationsRef.current.set(activeHref, location);
  }
  for (const href of Array.from(lastLocationsRef.current.keys())) {
    if (!panes.some((pane) => pane.href === href)) lastLocationsRef.current.delete(href);
  }

  // Charts and editors measure their container; poke them when a pane comes back.
  useEffect(() => {
    if (!activeHref) return;
    const timer = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    return () => window.clearTimeout(timer);
  }, [activeHref]);

  // Clip rather than hide: a pane taller than the content area (e.g. a
  // full-screen page sized with h-screen) would otherwise become scrollable
  // overflow of the overflow-hidden <main>. Any scrollIntoView in any pane (a
  // background chat following its latest message) then scrolls <main>, which
  // the user cannot scroll back, so the visible page stays shifted until reload.
  return (
    <div className="relative h-full overflow-clip">
      {panes.map((pane) => {
        const active = pane.href === activeHref;
        const lastLocation = lastLocationsRef.current.get(pane.href);
        if (!active && !lastLocation) return null;
        const paneLocation = active ? location : (lastLocation as Location);
        return <Pane key={pane.href} active={active} location={paneLocation} routes={routes} />;
      })}
    </div>
  );
}
