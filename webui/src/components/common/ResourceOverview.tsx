import { useTranslation } from 'react-i18next';
import { Boxes, CircleCheck, Layers, Sparkles } from 'lucide-react';

export default function ResourceOverview({ items }: { items: { label: string; value: number }[] }) {
  const { t } = useTranslation('nav');
  const icons = [Boxes, CircleCheck, Layers, Sparkles];
  return <div className="yushu-resource-overview grid shrink-0 grid-cols-2 gap-3 pb-4 md:grid-cols-4" aria-label={t('resourceOverview')}>
    {items.map((item, index) => {
      const Icon = icons[index % icons.length];
      return <div key={item.label} className="yushu-overview-card rounded-2xl border border-ui-border bg-ui-surface px-5 py-4">
        <div className="flex items-center justify-between gap-2 text-xs text-ui-secondary"><span>{t(item.label)}</span><Icon className="h-4 w-4 text-ui-muted" /></div>
        <div className="mt-3 text-2xl font-semibold tracking-tight text-ui-text">{item.value}</div>
      </div>;
    })}
  </div>;
}
