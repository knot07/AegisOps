import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

export interface HubFilterOption { value: string; label: string; count?: number; title?: string }
interface Facet { key: string; label: string; value: string; options: HubFilterOption[]; onChange: (value: string) => void }

export default function HubFilters({ types, type, onTypeChange, facets, onClear, chinese }: {
  types: HubFilterOption[]; type: string; onTypeChange: (value: string) => void;
  facets: Facet[]; onClear: () => void; chinese: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [panelOffset, setPanelOffset] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(null); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(null); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const selected = facets.filter(facet => facet.value);
  const choose = (facet: Facet, value: string) => { facet.onChange(value); setOpen(null); trigger.current?.focus(); };
  return (
    <div ref={root} className="aegis-hub-filters">
      <div className="aegis-hub-types" role="group" aria-label={chinese ? '插件类型' : 'Plugin type'}>
        {types.map(option => <button type="button" key={option.value} aria-pressed={type === option.value}
          onClick={() => { setOpen(null); onTypeChange(option.value); }}>
          {option.label}{option.count !== undefined && <span>{option.count}</span>}
        </button>)}
      </div>
      <div className="aegis-hub-facet-bar">
        <span className="aegis-hub-filter-label"><SlidersHorizontal size={14} />{chinese ? '筛选' : 'Filter'}</span>
        {facets.map(facet => {
          const active = facet.options.find(option => option.value === facet.value);
          const visible = facet.options.filter(option => !option.value || `${option.label} ${option.title ?? ''}`.toLowerCase().includes(search.toLowerCase()));
          return <div key={facet.key} className="aegis-hub-facet">
            <button type="button" className="aegis-hub-facet-trigger" data-active={!!facet.value}
              aria-expanded={open === facet.key} aria-haspopup="dialog"
              onClick={event => { trigger.current = event.currentTarget; setPanelOffset(Math.min(0, window.innerWidth - event.currentTarget.getBoundingClientRect().left - Math.min(268, window.innerWidth - 40) - 12)); setSearch(''); setOpen(open === facet.key ? null : facet.key); }}>
              {facet.label}<span>{active?.value ? active.label : chinese ? '全部' : 'All'}</span><ChevronDown size={14} />
            </button>
            {open === facet.key && <div role="dialog" aria-label={facet.label} style={{ left: panelOffset }} className="aegis-hub-facet-panel">
              <div className="aegis-hub-facet-search"><Search size={14} /><input autoFocus value={search} onChange={event => setSearch(event.target.value)}
                aria-label={chinese ? `搜索${facet.label}` : `Search ${facet.label}`} placeholder={chinese ? '搜索选项…' : 'Search options…'} /></div>
              <div className="aegis-hub-facet-options" role="group" aria-label={facet.label}>
                {visible.map(option => <button type="button" key={option.value} aria-pressed={facet.value === option.value}
                  disabled={!!option.value && option.count === 0 && facet.value !== option.value}
                  title={option.title} onClick={() => choose(facet, option.value)}>
                  <span className="aegis-hub-check">{facet.value === option.value && <Check size={13} />}</span>
                  <span className="aegis-hub-option-name">{option.label}</span><span className="aegis-hub-option-count">{option.count}</span>
                </button>)}
                {!visible.length && <p>{chinese ? '没有匹配选项' : 'No matching options'}</p>}
              </div>
            </div>}
          </div>;
        })}
        {(type || selected.length > 0) && <button type="button" className="aegis-hub-clear" onClick={() => { onClear(); setOpen(null); }}>{chinese ? '重置筛选' : 'Reset filters'}</button>}
      </div>
      {selected.length > 0 && <div className="aegis-hub-active-filters">
        {selected.map(facet => <button type="button" key={facet.key} onClick={() => facet.onChange('')} aria-label={`${chinese ? '移除' : 'Remove'} ${facet.label}`}>
          <span>{facet.label}：</span>{facet.options.find(option => option.value === facet.value)?.label ?? facet.value}<X size={12} />
        </button>)}
      </div>}
    </div>
  );
}
