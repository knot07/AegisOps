import WorkspaceGlyph from '@/components/common/WorkspaceGlyph';
import { useTranslation } from 'react-i18next';
import type { PluginViewMode } from '../../hooks/usePluginViewMode';

export default function PluginViewToggle({ value, onChange }: {
  value: PluginViewMode;
  onChange: (mode: PluginViewMode) => void;
}) {
  const { t } = useTranslation('pluginGroups');
  return (
    <div role="group" aria-label={t('view.label')} className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5">
      {([{ mode: 'cards', icon: 'catalog' }, { mode: 'list', icon: 'list' }] as const).map(({ mode, icon }) => (
        <button
          key={mode}
          type="button"
          aria-label={t(`view.${mode}`)}
          title={t(`view.${mode}`)}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${value === mode ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <WorkspaceGlyph kind={icon} size="micro" />
        </button>
      ))}
    </div>
  );
}
