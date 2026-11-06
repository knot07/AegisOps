import { useLayoutEffect, useRef } from 'react';

/** One moving selection surface shared by all sidebar sections. */
export default function NavSelection() {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const animation = useRef<Animation | undefined>(undefined);
  useLayoutEffect(() => {
    const node = ref.current;
    const nav = node?.parentElement;
    const selected = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!node || !nav || !selected) {
      if (node) node.style.opacity = '0';
      previous.current = null;
      animation.current?.cancel();
      return;
    }
    const bounds = nav.getBoundingClientRect();
    const rect = selected.getBoundingClientRect();
    const next = { x: rect.left - bounds.left + nav.scrollLeft, y: rect.top - bounds.top + nav.scrollTop, width: rect.width, height: rect.height };
    const from = previous.current;
    Object.assign(node.style, { opacity: '1', width: `${next.width}px`, height: `${next.height}px`, transform: `translate(${next.x}px, ${next.y}px)` });
    if (from && (from.x !== next.x || from.y !== next.y || from.width !== next.width)) {
      const current = getComputedStyle(node);
      const currentTransform = current.transform;
      const currentWidth = current.width;
      const currentHeight = current.height;
      const interrupted = animation.current?.playState === 'running';
      animation.current?.cancel();
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        animation.current = node.animate?.([
          { transform: interrupted ? currentTransform : `translate(${from.x}px, ${from.y}px)`, width: interrupted ? currentWidth : `${from.width}px`, height: interrupted ? currentHeight : `${from.height}px` },
          { transform: `translate(${next.x}px, ${next.y}px)`, width: `${next.width}px`, height: `${next.height}px` },
        ], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    }
    previous.current = next;
  });
  useLayoutEffect(() => () => animation.current?.cancel(), []);
  return <span ref={ref} className="aegis-nav-selection" aria-hidden="true" />;
}
