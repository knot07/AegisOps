import type { ReactNode } from 'react';
import { MessageSquare, ArrowUpRight, Sparkles } from 'lucide-react';
import type { ChatGuideAction } from './ChatGuideDock';
import GuideInfoIcon from './GuideInfoIcon';

export interface GuidedCreateGroup {
  title: string;
  actions: ChatGuideAction[];
}

export function normalizeGuidedCreateActions(value: unknown, group?: string): ChatGuideAction[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Record<string, unknown>;
      const label = String(raw.label ?? '').trim();
      const description = String(raw.description ?? '').trim();
      const prompt = String(raw.prompt ?? '').trim();
      const rawGroup = String(raw.group ?? '').trim();
      if (!label || !prompt) return null;
      return {
        label,
        description: description || prompt,
        prompt,
        ...((rawGroup || group) ? { group: rawGroup || group } : {}),
      };
    })
    .filter((item): item is ChatGuideAction => item !== null);
}

export function buildGuidedCreateGroups(groups: Array<{ title: string; actions: unknown }>): GuidedCreateGroup[] {
  return groups
    .map((group) => ({
      title: group.title,
      actions: normalizeGuidedCreateActions(group.actions, group.title),
    }))
    .filter((group) => group.actions.length > 0);
}

interface GuidedCreatePanelProps {
  emptyTitle?: string;
  icon?: ReactNode;
  title: string;
  description: string;
  groups: GuidedCreateGroup[];
  scrollTestId?: string;
  onStartPrompt: (prompt: string, label: string) => void;
}

export default function GuidedCreatePanel({
  emptyTitle,
  icon,
  title,
  description,
  groups,
  scrollTestId,
  onStartPrompt,
}: GuidedCreatePanelProps) {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      actions: group.actions.filter((action) => action.label && action.prompt),
    }))
    .filter((group) => group.actions.length > 0);

  return (
    <div className="yushu-create-guide" aria-label={emptyTitle || title}>
      <div className="yushu-guide-intro">
        <div className="yushu-guide-symbol">{icon ?? <MessageSquare className="h-5 w-5" />}<span aria-hidden="true"><Sparkles /></span></div>
        <h3>{title}</h3><p>{description}</p>
      </div>
      <div data-testid={scrollTestId} className="yushu-guide-sections">
        {visibleGroups.map((group, index) => <GuidedCreateSection key={group.title} index={index} title={group.title} actions={group.actions} onStartPrompt={onStartPrompt} />)}
      </div>
    </div>
  );
}

function GuidedCreateSection({
  index,
  title,
  actions,
  onStartPrompt,
}: {
  index: number;
  title: string;
  actions: ChatGuideAction[];
  onStartPrompt: (prompt: string, label: string) => void;
}) {
  return (
    <section className="yushu-guide-section" data-group-index={index}>
      <h4 className="mb-2 text-[11px] font-semibold text-gray-400">{title}</h4>
      <div
        data-testid={`guided-create-section-${title}`}
        className="yushu-guide-actions"
      >
        {actions.map((action) => (
          <div
            key={action.label}
            className="yushu-guide-action group flex w-full items-center justify-between"
          >
            <button
              type="button"
              aria-label={action.label}
              onClick={() => onStartPrompt(action.prompt, action.label)}
              className="yushu-guide-action-trigger min-w-0 flex-1 text-left"
            >
              <span>{action.label}</span><span className="yushu-guide-action-description">{action.description}</span><ArrowUpRight aria-hidden="true" className="yushu-guide-action-arrow" />
            </button>
            <GuideInfoIcon
              label={action.label}
              description={action.description}
              className="group-hover:text-rose-400"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
