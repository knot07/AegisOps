import type { CSSProperties } from 'react';

export const CLOCK_TICK_COUNT = 60;
const dialTicks = Array.from({ length: CLOCK_TICK_COUNT }, (_, index) => index);

export default function ClockTicks({ lit, layered = false }: { lit: number; layered?: boolean }) {
  const tick = (index: number) => {
    const major = index % 5 === 0;
    return <line key={index} x1="100" x2="100" y1="15" y2={major ? 28 : 22}
      style={{ '--tick-index': index } as CSSProperties} strokeWidth={major ? 2.7 : 1.65} transform={`rotate(${index * 6} 100 100)`} />;
  };
  if (layered) return <>
    <svg className="aegis-gauge-dial" viewBox="0 0 200 200" aria-hidden="true"><g className="aegis-gauge-track">{dialTicks.slice(lit).map(tick)}</g></svg>
    <svg className="aegis-gauge-dial aegis-gauge-pulse-layer" viewBox="0 0 200 200" aria-hidden="true"><g className="aegis-gauge-active">{dialTicks.slice(0,lit).map(tick)}</g></svg>
  </>;
  return <svg className="aegis-gauge-dial" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <g className="aegis-gauge-track">{dialTicks.slice(lit).map(tick)}</g>
    <g className="aegis-gauge-active">{dialTicks.slice(0, lit).map(tick)}</g>
  </svg>;
}
