import { useContext, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { ThemeSkinContext } from '@/contexts/ThemeSkinContext';
import { THEME_SKINS } from '@/styles/themeSkins';
import './theme-skin-picker.css';

export default function ThemeSkinPicker({ compact = false }: { compact?: boolean }) {
  const { skin, setSkin } = useContext(ThemeSkinContext);
  const { i18n } = useTranslation();
  const zh = !i18n.language || i18n.language.startsWith('zh');
  return <section className={`aegis-skin-picker${compact ? ' is-compact' : ''}`}>
    {compact && <p>{zh ? '主题皮肤' : 'Color palette'}</p>}
    <div className="aegis-skin-options" role="group" aria-label={zh ? '主题皮肤' : 'Color palette'}>
      {THEME_SKINS.map(option => <button key={option.id} type="button" data-skin-option={option.id} role={compact ? 'menuitemradio' : undefined} aria-checked={compact ? skin === option.id : undefined} aria-pressed={skin === option.id}
        aria-label={zh ? option.name : option.english} title={zh ? `${option.name} · ${option.description}` : option.english}
        onClick={() => setSkin(option.id)} style={{ '--swatch': option.swatch, '--swatch-light': option.light.selected, '--swatch-dark': option.dark.surface } as CSSProperties}>
        <span className="aegis-skin-swatch" aria-hidden="true"><i /><i /><i /></span>
        <span>{zh ? option.name : option.english}</span>
        <Check className="aegis-skin-check" size={13} aria-hidden="true" />
      </button>)}
    </div>
  </section>;
}
