import WorkspaceGlyph from './WorkspaceGlyph';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SchedulingMode = 'legacy' | 'superagent';
export default function SchedulingModePicker({ value, onChange, disabled, chinese = true, scope = 'session' }: {
  value: SchedulingMode; onChange: (value: SchedulingMode) => Promise<void> | void; disabled?: boolean; chinese?: boolean; scope?: 'session' | 'default';
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
    { value: 'legacy' as const, label: chinese ? '标准调度' : 'Standard', icon: 'queue' as const, detail: chinese ? '沿用现有执行与委派方式，适合日常任务' : 'Existing execution and delegation for everyday tasks' },
    { value: 'superagent' as const, label: 'Super-agent', icon: 'delegate' as const, detail: chinese ? 'Atlas 分派独立 Worker，异步执行并保留任务归属' : 'Atlas routes to independent Workers with persistent task ownership' },
  ];
  return <div ref={root} className="relative">
    <button type="button" disabled={disabled} aria-label={chinese ? '切换调度模式' : 'Scheduling mode'} aria-expanded={open} aria-haspopup="dialog"
      onClick={() => setOpen(!open)} title={disabled ? (chinese ? '当前回合结束后可切换' : 'Switch after the current turn') : undefined}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-ui-secondary hover:bg-ui-hover disabled:opacity-40">
      <WorkspaceGlyph kind={value === 'legacy' ? 'queue' : 'delegate'} size="xs" /><span>{value === 'legacy' ? (chinese ? '标准调度' : 'Standard') : 'Super-agent'}</span>
      {value === 'superagent' && <span className="rounded bg-ui-selected px-1 text-[9px] text-ui-text">{chinese ? '实验' : 'Beta'}</span>}<ChevronDown size={12} />
    </button>
    {open && <div role="dialog" aria-label={chinese ? '调度模式' : 'Scheduling mode'} className="aegis-scheduling-panel absolute bottom-full left-0 z-50 mb-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-[#e0e6d6] bg-white/95 p-2 shadow-xl backdrop-blur-xl">
      <p className="px-2 py-1 text-[11px] text-gray-400">{scope==='default' ? (chinese ? '新会话 · 默认调度' : 'New conversations · Default scheduling') : (chinese ? '当前会话 · 调度模式' : 'This conversation · Scheduling mode')}</p>
      {options.map(option => <button type="button" key={option.value} aria-pressed={value === option.value}
        onClick={() => { setOpen(false); void onChange(option.value); }}
        className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-3 text-left transition-colors ${value === option.value ? 'bg-[#f0f5e5] text-[#526b2c]' : 'text-gray-600 hover:bg-gray-50'}`}>
        <WorkspaceGlyph kind={option.icon} size="xs" className="mt-0.5" /><span className="flex-1"><span className="flex items-center gap-2 text-xs font-semibold">{option.label}
          {option.value === 'superagent' && <span className="rounded bg-ui-selected px-1.5 py-0.5 text-[9px] font-normal text-ui-text">{chinese ? '实验性' : 'Experimental'}</span>}</span>
          <span className="mt-1 block text-[11px] font-normal leading-5 text-gray-400">{option.detail}</span></span>{value === option.value && <WorkspaceGlyph kind="check" size="micro" className="mt-1" />}
      </button>)}
      <p className="border-t border-[#edf0e6] px-2 pt-2 pb-1 text-[10px] leading-4 text-gray-400">{scope==='default' ? (chinese ? '保存后对新会话生效，已有会话保持原有模式。' : 'Applies to new conversations after saving. Existing conversations keep their mode.') : (chinese ? '默认使用标准调度。切换不重启已派发的 Worker。' : 'Standard by default. Switching does not restart dispatched Workers.')}</p>
    </div>}
  </div>;
}
