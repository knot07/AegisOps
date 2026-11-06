import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { findActiveTabHref } from '@/utils/layoutTabs';
import KeepAlivePanes from './KeepAlivePanes';

const TAB_HREFS = ['/sessions', '/tasks'];
const routes = [
  { path: 'sessions/:sessionId?', element: <input data-testid="session-page" defaultValue="draft" /> },
  { path: 'tasks', element: <div data-testid="tasks-page" /> },
  { path: '*', element: <div /> },
];

function Tabs() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/tasks')}>open-tasks</button>
      <button onClick={() => navigate('/sessions/session-1')}>open-session</button>
      <KeepAlivePanes
        panes={TAB_HREFS.map((href) => ({ href }))}
        activeHref={findActiveTabHref(TAB_HREFS, location.pathname)}
        location={location}
        routes={routes}
      />
    </>
  );
}

describe('KeepAlivePanes', () => {
  it('clips every pane so a hidden page cannot scroll the shared content area', () => {
    render(
      <MemoryRouter initialEntries={['/sessions/session-1']}>
        <Tabs />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('open-tasks'));

    const sessionPane = screen.getByTestId('session-page').closest('[data-keep-alive-pane]');
    const tasksPane = screen.getByTestId('tasks-page').closest('[data-keep-alive-pane]');
    expect(sessionPane).toHaveAttribute('data-keep-alive-pane', 'inactive');
    expect(tasksPane).toHaveAttribute('data-keep-alive-pane', 'active');

    // Both panes sit in one root. It must clip (no scroll container, not even
    // a programmatic one) so a tall hidden pane leaves no scrollable overflow
    // for <main>, which a background scrollIntoView would otherwise scroll.
    const root = sessionPane?.parentElement;
    expect(root).toBe(tasksPane?.parentElement);
    expect(root).toHaveClass('overflow-clip');
    expect(root?.className).not.toMatch(/\boverflow-(?:y-|x-)?(?:hidden|auto|scroll)\b/);
  });
  it('preserves drafts and scroll offsets through repeated switching', () => {
    render(<MemoryRouter initialEntries={['/sessions/session-1']}><Tabs /></MemoryRouter>);
    const draft = screen.getByTestId('session-page');
    fireEvent.change(draft, { target: { value: 'unsent draft' } });
    const pane = draft.closest('[data-keep-alive-pane]')!;
    pane.scrollTop = 125;
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText('open-tasks'));
      expect(pane).toHaveAttribute('inert');
      fireEvent.click(screen.getByText('open-session'));
    }
    expect(screen.getByTestId('session-page')).toBe(draft);
    expect(draft).toHaveValue('unsent draft');
    expect(pane.scrollTop).toBe(125);
    expect(document.querySelectorAll('[data-keep-alive-pane="active"]')).toHaveLength(1);
  });

  it('skips page motion when reduced motion is requested', () => {
    const animate = vi.fn();
    const oldAnimate = HTMLElement.prototype.animate;
    const oldMatchMedia = window.matchMedia;
    HTMLElement.prototype.animate = animate;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
      render(<MemoryRouter initialEntries={['/sessions/session-1']}><Tabs /></MemoryRouter>);
      fireEvent.click(screen.getByText('open-tasks'));
      expect(animate).not.toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.animate = oldAnimate;
      window.matchMedia = oldMatchMedia;
    }
  });

  it('waits for cold route content and cancels its motion on navigation', () => {
    const cancel = vi.fn();
    const animate = vi.fn().mockReturnValue({ cancel });
    const oldAnimate = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = animate;
    const coldRoutes = [{ path: 'sessions/:id', element: <div data-route-loading /> }, ...routes];
    try {
      const location = { pathname: '/sessions/session-1', search: '', hash: '', state: null, key: 'one' };
      const view = render(<MemoryRouter><KeepAlivePanes panes={TAB_HREFS.map(href => ({href}))} activeHref="/sessions" location={location} routes={coldRoutes} /></MemoryRouter>);
      expect(animate).not.toHaveBeenCalled();
      window.dispatchEvent(new CustomEvent('aegis:route-ready', { detail: '/tasks' }));
      expect(animate).not.toHaveBeenCalled();
      window.dispatchEvent(new CustomEvent('aegis:route-ready', { detail: '/sessions/session-1' }));
      expect(animate).toHaveBeenCalledTimes(1);
      view.unmount();
      expect(cancel).toHaveBeenCalled();
      window.dispatchEvent(new CustomEvent('aegis:route-ready', { detail: '/sessions/session-1' }));
      expect(animate).toHaveBeenCalledTimes(1);
    } finally { HTMLElement.prototype.animate = oldAnimate; }
  });

});
