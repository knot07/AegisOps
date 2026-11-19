import type { CSSProperties } from 'react';
import './context-budget-slider.css';

export function formatContextTokens(value: number) {
  return value >= 1000000 ? `${+(value / 1000000).toFixed(2)}M` : `${+(value / 1000).toFixed(1)}K`;
}

/** One shared ruler lets short and long context models be compared honestly. */
export default function ContextBudgetSlider({ value, capacity, scaleMax = 1000000, disabled, label, onChange }: {
  value: number; capacity: number; scaleMax?: number; disabled?: boolean; label: string; onChange: (value: number) => void;
}) {
  const maximum = Math.max(scaleMax, capacity, 4096);
  const current = Math.max(4096, Math.min(value, capacity));
  const clamp = (next: number) => onChange(Math.max(4096, Math.min(capacity, next)));
  const position = (n: number) => `${(n / maximum) * 100}%`;
  const ticks = [200000, 400000, ...(maximum > 1000000 ? [1000000] : []), maximum]
    .filter((n, index, all) => n <= maximum && all.indexOf(n) === index);
  const labels = ticks.map(n => ({ value: n, active: Math.abs(n-current) < 1024 }));
  return <div className={`context-budget-slider ${disabled ? 'is-disabled' : ''}`} style={{ '--context-fill': position(current) } as CSSProperties}>
    <div className="context-budget-track">
      <span className="context-budget-fill" />
      <span className="context-budget-handle" />
      <output className="context-budget-value" aria-hidden="true">{formatContextTokens(current)}</output>
      <input type="range" min={0} max={maximum} step={1024} value={current} disabled={disabled}
        aria-label={label} aria-valuemin={4096} aria-valuemax={capacity} aria-valuenow={current}
        aria-valuetext={`${formatContextTokens(current)} / ${formatContextTokens(capacity)}`} title={`${formatContextTokens(current)} / ${formatContextTokens(capacity)}`}
        onChange={e => clamp(Math.round(Number(e.target.value) / 1024) * 1024)}
        onKeyDown={e => {
          const deltas: Record<string, number> = { ArrowRight: 1024, ArrowUp: 1024, ArrowLeft: -1024, ArrowDown: -1024, PageUp: 16384, PageDown: -16384 };
          if (e.key === 'End' || e.key === 'Home' || e.key in deltas) {
            e.preventDefault(); clamp(e.key === 'End' ? capacity : e.key === 'Home' ? 4096 : current + deltas[e.key]);
          }
        }} />
    </div>
    <div className="context-budget-ruler" aria-hidden="true">
      {labels.map(tick => <span key={`${tick.value}-${tick.active}`} className={`${tick.active ? 'is-active' : ''} ${tick.value / maximum > .94 ? 'at-end' : tick.value / maximum < .06 ? 'at-start' : ''}`} style={{ left: position(tick.value) }}>{formatContextTokens(tick.value)}</span>)}
    </div>
  </div>;
}
