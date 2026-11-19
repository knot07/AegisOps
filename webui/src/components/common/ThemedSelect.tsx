import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import './themed-select.css';

type Option = { value: string; label: string };
/** A model-themed select that also works inside a native modal dialog's top layer. */
export default function ThemedSelect({ value, options, onChange, label, disabled, themeStyle }: {
  value: string; options: Option[]; onChange: (value: string) => void;
  label: string; disabled?: boolean; themeStyle?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const anchor = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find(option => option.value === value);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
  const expanded = open && !disabled && options.length > 0;
  const choose = (index: number) => {
    if (disabled || !options[index]) return;
    onChange(options[index].value); setOpen(false); anchor.current?.focus();
  };
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  useLayoutEffect(() => {
    if (!expanded) return;
    const place = () => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const below = Math.max(0, window.innerHeight - rect.bottom - 14);
      const above = Math.max(0, rect.top - 14);
      const desired = Math.min(300, options.length * 36 + 12);
      const upward = below < desired && above > below;
      const height = Math.min(desired, upward ? above : below);
      const width = Math.min(Math.max(rect.width, 140), window.innerWidth - 20);
      setPosition({ top: upward ? rect.top - height - 6 : rect.bottom + 6,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - width - 10)), width, maxHeight: height });
    };
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchor.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); setOpen(false); anchor.current?.focus();
      }
    };
    place(); document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
    };
  }, [expanded, options.length]);
  useEffect(() => {
    if (expanded) menu.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, expanded]);
  return <>
    <button ref={anchor} type="button" className="aegis-themed-select-trigger" style={themeStyle}
      role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={expanded}
      aria-controls={expanded ? id : undefined} aria-activedescendant={expanded ? `${id}-${active}` : undefined}
      disabled={disabled || !options.length}
      onClick={() => { setActive(selectedIndex); setOpen(!open); }}
      onBlur={event => { if (!menu.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
      onKeyDown={event => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          if (!expanded) { setActive(selectedIndex); setOpen(true); return; }
          setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
            : (index + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length);
        } else if ((event.key === 'Enter' || event.key === ' ') && expanded) {
          event.preventDefault(); choose(active);
        } else if (event.key === 'Tab') setOpen(false);
      }}>
      <span>{selected?.label || options[0]?.label}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {expanded && createPortal(<div ref={menu} id={id} role="listbox" aria-label={label}
      className="aegis-themed-select-menu" style={{ ...themeStyle, ...position }}>
      {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} role="option"
        aria-selected={option.value === value} data-option-index={index}
        className={`aegis-themed-select-option ${active === index ? 'is-active' : ''}`}
        onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === value && <Check size={14} aria-hidden="true" />}
      </div>)}
    </div>, anchor.current?.closest('dialog') || document.body)}
  </>;
}
