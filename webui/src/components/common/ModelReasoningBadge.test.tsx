import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ModelReasoningBadge, { reasoningLabel } from './ModelReasoningBadge';
import { __resetChatModelResourcesForTesting, refreshChatModelResources } from '@/hooks/useChatModelResources';
import { modelSettingsAPI } from '@/api/provider';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'zh-CN' } }) }));
vi.mock('@/api/provider', () => ({ modelSettingsAPI: { get: vi.fn() }, modelV2API: { listDefinitions: vi.fn(async () => ({ data: { models: [] } })) }, defaultModelAPI: { getResolved: vi.fn() } }));
beforeEach(() => { __resetChatModelResourcesForTesting(); vi.clearAllMocks(); });
it('reads the selected model setting and refreshes the displayed effort after settings change', async () => {
  vi.mocked(modelSettingsAPI.get).mockResolvedValue({ data: { default_parameters: { reasoning_effort: 'high', enable_thinking: true } } } as any);
  render(<ModelReasoningBadge providerID="deepseek" modelID="model-a" supported />);
  expect(await screen.findByText('高')).toHaveAttribute('data-model-effort', 'high');
  expect(modelSettingsAPI.get).toHaveBeenCalledWith('deepseek', 'model-a');
  vi.mocked(modelSettingsAPI.get).mockResolvedValue({ data: { default_parameters: { enable_thinking: false, reasoning_effort: 'high' } } } as any);
  await act(async () => { await refreshChatModelResources(); });
  expect(await screen.findByText('关闭')).toHaveAttribute('data-model-effort', 'off');
});
it('switches to the new model without showing the previous model effort', async () => {
  vi.mocked(modelSettingsAPI.get).mockImplementation(async (_p, model) => ({ data: { default_parameters: { reasoning_effort: model === 'a' ? 'high' : 'low' } } }) as any);
  const view = render(<ModelReasoningBadge providerID="p" modelID="a" supported />);
  await screen.findByText('高'); view.rerender(<ModelReasoningBadge providerID="p" modelID="b" supported />);
  expect(screen.queryByText('高')).not.toBeInTheDocument(); await screen.findByText('低');
});
it('never invents an effort level when the settings request fails', async () => {
  vi.mocked(modelSettingsAPI.get).mockRejectedValue(new Error('offline'));
  const view = render(<ModelReasoningBadge providerID="p" modelID="a" supported />);
  await waitFor(() => expect(modelSettingsAPI.get).toHaveBeenCalled());
  expect(view.container).toBeEmptyDOMElement();
});
it('distinguishes model defaults, unsupported reasoning, and explicit disabled thinking', () => {
  expect(reasoningLabel({}, true, true)).toBe('默认');
  expect(reasoningLabel({}, false, true)).toBe('标准');
  expect(reasoningLabel({ enable_thinking: false, reasoning_effort: 'max' }, true, true)).toBe('关闭');
  expect(reasoningLabel({ reasoning_effort: 'xhigh' }, true, false)).toBe('Very high');
});
