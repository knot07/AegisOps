import { useCallback, useEffect, useRef, useState } from 'react';

/** A shared lifecycle for creation drawers and dialogs, including reduced motion. */
export function useCreationMotion(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onClose);
  callbackRef.current = onClose;
  const exitingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    if (exitingRef.current) return;
    const panel = panelRef.current;
    if (!panel?.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      callbackRef.current();
      return;
    }
    exitingRef.current = true;
    setClosing(true);
    const animation = panel.animate([
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: 0, transform: 'translateX(32px)' },
    ], { duration: 180, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    void animation.finished.catch(() => {}).then(() => callbackRef.current());
  }, []);

  useEffect(() => {
    if (!open) return;
    exitingRef.current = false;
    setClosing(false);
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || Array.from(document.querySelectorAll('[data-creation-surface]')).slice(-1)[0] !== panel) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab' || !panel?.contains(document.activeElement)) return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]')).filter(el => el.getClientRects().length && !el.closest('[inert]'));
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      panel?.getAnimations?.().forEach(animation => animation.cancel());
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, close]);
  return { panelRef, closing, close };
}
