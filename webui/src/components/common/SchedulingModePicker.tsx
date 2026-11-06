import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, GitBranch, Zap } from 'lucide-react';

export type SchedulingMode = 'legacy' | 'superagent';
export default function SchedulingModePicker({ value, onChange, disabled, chinese = true }: {
  value: SchedulingMode; onChange: (value: SchedulingMode) => Promise<void> | void; disabled?: boolean; chinese?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const options = [
    { value: 'legacy' as const, label: chinese ? '标准调度' : 'Standard', icon: Zap, detail: chinese ? '沿用现有执行与委派方式，适合日常任务' : 'Existing execution and delegation for everyday tasks' },
    { value: 'superagent' as const, label: 'Super-agent', icon: GitBranch, detail: chinese ? 'Atlas 分派独立 Worker，异步执行并保留任务归属' : 'Atlas routes to independent Workers with persistent task ownership' },
  ];
  return <div ref={root} className="relative">
    <button type="button" disabled={disabled} aria-label={chinese ? '切换调度模式' : 'Scheduling mode'} aria-expanded={open} aria-haspopup="dialog"
      onClick={() => setOpen(!open)} title={disabled ? (chinese ? '当前回合结束后可切换' : 'Switch after the current turn') : undefined}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-ui-secondary hover:bg-ui-hover disabled:opacity-40">
      <GitBranch size={14} /><span>{value === 'legacy' ? (chinese ? '标准调度' : 'Standard') : 'Super-agent'}</span>
      {value === 'superagent' && <span className="rounded bg-[#e8eed8] px-1 text-[9px] text-[#6d7d44]">{chinese ? '实验' : 'Beta'}</span>}<ChevronDown size={12} />
    </button>
    {open && <div role="dialog" aria-label={chinese ? '调度模式' : 'Scheduling mode'} className="aegis-scheduling-panel absolute bottom-full left-0 z-50 mb-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-[#e0e6d6] bg-white/95 p-2 shadow-xl backdrop-blur-xl">
      <p className="px-2 py-1 text-[11px] text-gray-400">{chinese ? '当前会话 · 调度模式' : 'This conversation · Scheduling mode'}</p>
      {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value}
        onClick={() => { setOpen(false); void onChange(option.value); }}
        className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-3 text-left transition-colors ${value === option.value ? 'bg-[#f0f5e5] text-[#526b2c]' : 'text-gray-600 hover:bg-gray-50'}`}>
        <option.icon size={16} className="mt-0.5 shrink-0" /><span className="flex-1"><span className="flex items-center gap-2 text-xs font-semibold">{option.label}
          {option.value === 'superagent' && <span className="rounded bg-[#e5ecd5] px-1.5 py-0.5 text-[9px] font-normal text-[#72824e]">{chinese ? '实验性' : 'Experimental'}</span>}</span>
          <span className="mt-1 block text-[11px] font-normal leading-5 text-gray-400">{option.detail}</span></span>{value === option.value && <Check size={14} className="mt-1" />}
      </button>)}
      <p className="border-t border-[#edf0e6] px-2 pt-2 pb-1 text-[10px] leading-4 text-gray-400">{chinese ? '默认使用标准调度。切换不重启已派发的 Worker。' : 'Standard by default. Switching does not restart dispatched Workers.'}</p>
    </div>}
  </div>;
}
