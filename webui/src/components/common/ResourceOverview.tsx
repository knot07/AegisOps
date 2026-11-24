import { useTranslation } from 'react-i18next';
import WorkspaceGlyph, { type WorkspaceGlyphKind } from './WorkspaceGlyph';

export default function ResourceOverview({ items }: { items: { label: string; value: number; icon?: WorkspaceGlyphKind }[] }) {
  const { t } = useTranslation('nav');
  const icons: Partial<Record<string, WorkspaceGlyphKind>> = { resourceTotal: 'catalog', resourceEnabled: 'check', resourceDisabled: 'paused', resourceBuiltin: 'layers', resourceCustom: 'custom', resourceGroups: 'folder', resourceMcpServices: 'mcp' };
  return <div className="yushu-resource-overview grid shrink-0 grid-cols-2 gap-3 pb-4 md:grid-cols-4" aria-label={t('resourceOverview')}>
    {items.map(item => {
      return <div key={item.label} className="yushu-overview-card rounded-2xl border border-ui-border bg-ui-surface px-5 py-4">
        <div className="flex items-center justify-between gap-2 text-xs text-ui-secondary"><span>{t(item.label)}</span><WorkspaceGlyph kind={item.icon ?? icons[item.label] ?? 'catalog'} /></div>
        <div className="mt-3 text-2xl font-semibold tracking-tight text-ui-text">{item.value}</div>
      </div>;
    })}
  </div>;
}
