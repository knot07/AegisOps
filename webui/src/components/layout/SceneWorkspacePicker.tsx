import { Check, ChevronDown } from 'lucide-react';
import ModuleEmblem, { sceneEmblemKind } from '@/components/common/ModuleEmblem';
import HeaderMenu from './HeaderMenu';

export default function SceneWorkspacePicker({ value, options, onChange, label }: {
  value: string; options: { id: string; name: string }[]; onChange: (id: string) => void; label: string;
}) {
  const selected = options.find(o => o.id === value) || options[0];
  if (!selected) return null;
  return <div className="aegis-scene-switcher">
    <span className="aegis-scene-label">{label}</span>
    <HeaderMenu label={label} placement="dropdown" menuClassName="aegis-scene-menu w-64" triggerClassName="aegis-scene-trigger" trigger={<>
      <ModuleEmblem kind={sceneEmblemKind(selected.id)} size="nav" />
      <span>{selected.name}</span><ChevronDown size={12} />
    </>}>
      {close => <>{options.map(o => <button key={o.id} type="button" role="menuitemradio" aria-checked={o.id === value} className="aegis-scene-option" onClick={() => { onChange(o.id); close(true); }}>
        <ModuleEmblem kind={sceneEmblemKind(o.id)} size="nav" /><span>{o.name}</span>{o.id === value && <Check size={14} />}
      </button>)}</>}
    </HeaderMenu>
  </div>;
}
