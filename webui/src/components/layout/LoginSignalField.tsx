import { useEffect, useRef } from 'react';

/** A viewport-sized, decorative telemetry wave. It draws one static frame when motion is reduced. */
export default function LoginSignalField({ paused }: { paused: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const phase = useRef(0);
  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let id = 0, width = 0, height = 0, last = -Infinity, time = phase.current;
    let palette = ['#699181','#75b487','#a6bdac','#ffffff'];
    const draw = () => {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const cols = Math.max(24, Math.min(76, Math.ceil(width / 22)));
      const rows = Math.max(16, Math.min(34, Math.ceil(height / 27)));
      const scale = Math.max(13,width / cols);
      for (let row = 0; row < rows; row++) {
        const depth = row / (rows - 1);
        for (let col = 0; col < cols; col++) {
          const u = col / (cols - 1);
          const wave = Math.sin(u * 9 - time + depth * 4) * .105 + Math.sin(u * 4.5 + time * .62 + depth * 6) * .09;
          const x = width * (-.09 + u * 1.18) + Math.sin(time * .6 + depth * 4) * scale * .66;
          const y = height * (.22 + depth * .73 + wave - u * .17);
          const crest = (1 + Math.sin(u * 14 - time * 1.35 + depth * 8)) / 2;
          const edgeFade = Math.min(1,depth * 6,(1.05 - depth) * 4);
          const centerFade = .42 + .58 * Math.min(1, Math.abs(u - .5) * 3.8 + Math.abs(y / height - .5));
          const signal = (col * 31 + row * 7) % 41 === 0;
          ctx.globalAlpha = edgeFade * centerFade * (signal ? .66 : .10 + crest * .29);
          ctx.fillStyle = signal ? palette[1] : crest > .79 ? palette[3] : crest > .46 ? palette[0] : palette[2];
          ctx.beginPath();
          ctx.arc(x, y, scale * (.065 + depth * .16 + crest * .08) * (signal ? 1.18 : 1), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    const frame = (timestamp: number) => {
      if (timestamp - last >= 32) {
        if (last !== -Infinity) time += Math.min(timestamp - last, 65) * .00115;
        last = timestamp;
        phase.current = time;
        draw();
      }
      id = window.requestAnimationFrame(frame);
    };
    const configure = () => {
      window.cancelAnimationFrame(id);
      const style = getComputedStyle(element);
      palette = ['--signal-dot','--signal-hot','--signal-dim','--signal-shine'].map(key => style.getPropertyValue(key).trim());
      const rect = element.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(1.75, window.devicePixelRatio || 1);
      element.width = Math.round(width * ratio); element.height = Math.round(height * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      draw();
      last = -Infinity;
      if (!document.hidden && !paused && !motion.matches) id = window.requestAnimationFrame(frame);
    };
    const resize = new ResizeObserver(configure);
    resize.observe(element);
    const theme = new MutationObserver(configure);
    theme.observe(document.documentElement, { attributes:true, attributeFilter:['class','data-theme-skin'] });
    document.addEventListener('visibilitychange', configure);
    motion.addEventListener('change', configure);
    configure();
    return () => {
      window.cancelAnimationFrame(id);
      resize.disconnect(); theme.disconnect();
      document.removeEventListener('visibilitychange', configure);
      motion.removeEventListener('change', configure);
    };
  }, [paused]);
  return <canvas ref={canvas} className="login-signal-field" aria-hidden="true" />;
}
