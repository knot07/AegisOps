import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ModelPreferencesDialog from './ModelPreferencesDialog';
import { modelSettingsAPI } from '@/api/provider';
const state = vi.hoisted(() => ({ role: 'admin', refresh: vi.fn(), definitions: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'zh-CN' } }) }));
vi.mock('@/contexts/authState', () => ({ useOptionalAuth: () => ({ user: { role: state.role } }) }));
vi.mock('@/hooks/useChatModelResources', () => ({ refreshChatModelResources: state.refresh }));
vi.mock('@/api/provider', () => ({ modelV2API: { listDefinitions: state.definitions }, modelSettingsAPI: { get: vi.fn(), update: vi.fn() } }));
const model = { id: 'gpt-5.4', name: 'GPT 5.4', provider_id: 'openai', model_type: 'llm', fetch_from: 'predefined', limits: { context_window: 128000 }, capabilities: { supports_reasoning: true, thinking_level_map: { low: 'low', medium: 'medium', high: 'high' } } };
const setting = { provider_id: 'openai', model_id: 'gpt-5.4', enabled: true, default_parameters: { temperature: 0.4, enable_thinking: true } };
beforeEach(() => {
  vi.clearAllMocks(); state.role = 'admin'; state.refresh.mockResolvedValue(undefined);
  state.definitions.mockResolvedValue({ data: { models: [model, { ...model, id: 'plain-model', name: 'Plain', fetch_from: 'customizable', capabilities: { supports_reasoning: false } }] } });
  vi.mocked(modelSettingsAPI.get).mockResolvedValue({ data: setting } as any);
  vi.mocked(modelSettingsAPI.update).mockImplementation(async (_p, _m, data) => ({ data: { ...setting, ...data } }) as any);
});
it('saves actual reasoning and context parameters while preserving unrelated values', async () => {
  const close = vi.fn(); render(<ModelPreferencesDialog onClose={close} />);
  const thinking = await screen.findByRole('switch', { name: 'GPT 5.4 思考模式' });
  fireEvent.click(thinking);
  fireEvent.change(screen.getByRole('slider', { name: 'GPT 5.4 上下文使用上限' }), { target: { value: '32768' } });
  fireEvent.click(screen.getByRole('button', { name: /保存设置/ }));
  await waitFor(() => expect(modelSettingsAPI.update).toHaveBeenCalledWith('openai', 'gpt-5.4', { default_parameters: { temperature: 0.4, enable_thinking: false, context_window_limit: 32768 } }));
  await waitFor(() => expect(close).toHaveBeenCalled()); expect(state.refresh).toHaveBeenCalled();
});
it('shows supported effort choices, disables unsupported reasoning, and filters custom models', async () => {
  render(<ModelPreferencesDialog onClose={vi.fn()} />);
  await screen.findByRole('switch', { name: 'GPT 5.4 思考模式' });
  expect(screen.getByRole('combobox', { name: 'Plain 思考强度' })).toBeDisabled();
  const strength = screen.getByRole('combobox', { name: 'GPT 5.4 思考强度' });
  fireEvent.click(strength);
  expect(screen.getByRole('listbox').closest('dialog')).toBe(screen.getByRole('dialog'));
  fireEvent.click(screen.getByRole('option', { name: '中', exact: true })); expect(strength).toHaveTextContent('中');
  fireEvent.click(screen.getByRole('button', { name: /保存设置/ }));
  await waitFor(() => expect(modelSettingsAPI.update).toHaveBeenCalledWith('openai', 'gpt-5.4', { default_parameters: { temperature: 0.4, enable_thinking: true, reasoning_effort: 'medium' } }));
  fireEvent.click(screen.getByRole('tab', { name: '自定义' }));
  expect(screen.queryByText('GPT 5.4')).not.toBeInTheDocument(); expect(screen.getByText('Plain')).toBeInTheDocument();
});
it('keeps failed edits open and never reports a failed save as success', async () => {
  vi.mocked(modelSettingsAPI.update).mockRejectedValue(new Error('Save refused'));
  const close = vi.fn(); render(<ModelPreferencesDialog onClose={close} />);
  fireEvent.click(await screen.findByRole('switch', { name: 'GPT 5.4 思考模式' }));
  fireEvent.click(screen.getByRole('button', { name: /保存设置/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save refused'); expect(close).not.toHaveBeenCalled();
});
it('members can inspect settings but cannot mutate them', async () => {
  state.role = 'member'; render(<ModelPreferencesDialog onClose={vi.fn()} />);
  expect(await screen.findByRole('switch', { name: 'GPT 5.4 思考模式' })).toBeDisabled();
  expect(screen.getByRole('button', { name: /保存设置/ })).toBeDisabled(); expect(modelSettingsAPI.update).not.toHaveBeenCalled();
});
it('cancel discards unsaved edits', async () => {
  const close = vi.fn(); render(<ModelPreferencesDialog onClose={close} />);
  fireEvent.click(await screen.findByRole('switch', { name: 'GPT 5.4 思考模式' }));
  fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(close).toHaveBeenCalledOnce(); expect(modelSettingsAPI.update).not.toHaveBeenCalled();
});
