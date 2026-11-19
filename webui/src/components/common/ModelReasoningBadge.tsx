import { useTranslation } from 'react-i18next';
import { useModelReasoningSetting } from '@/hooks/useChatModelResources';
import './model-reasoning-badge.css';

export function reasoningLabel(parameters: Record<string, unknown>, supported: boolean | undefined, zh: boolean) {
  if (parameters.enable_thinking === false) return zh ? '关闭' : 'Off';
  if (supported === false && parameters.enable_thinking !== true) return zh ? '标准' : 'Standard';
  const names: Record<string, [string, string]> = { minimal: ['最低', 'Minimal'], low: ['低', 'Low'], medium: ['中', 'Medium'], high: ['高', 'High'], xhigh: ['极高', 'Very high'], max: ['最大', 'Maximum'] };
  const effort = typeof parameters.reasoning_effort === 'string' ? parameters.reasoning_effort : '';
  return names[effort]?.[zh ? 0 : 1] || (zh ? '默认' : 'Default');
}
export default function ModelReasoningBadge({ providerID, modelID, supported }: { providerID?: string; modelID?: string; supported?: boolean }) {
  const { i18n } = useTranslation();
  const { data, error } = useModelReasoningSetting(providerID, modelID);
  if (!providerID || !modelID || !data || error) return null;
  const zh = !i18n?.language || i18n.language.startsWith('zh');
  const label = reasoningLabel(data.default_parameters || {}, supported, zh);
  return <span className="aegis-chat-model-effort" data-model-effort={data.default_parameters?.enable_thinking === false ? 'off' : data.default_parameters?.reasoning_effort || 'default'}
    title={zh ? `当前思考强度：${label}，可在模型管理中调整` : `Reasoning effort: ${label}. Configure in model preferences.`}>{label}</span>;
}
