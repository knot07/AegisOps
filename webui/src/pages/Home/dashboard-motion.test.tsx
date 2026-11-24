import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { taskAPI, type TaskExecution } from '@/api/task';
import Home from './index';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useStats', () => ({ useStats: () => ({ stats: null, refetch: async () => {} }) }));
vi.mock('@/api/task', () => ({ taskAPI: { listExecutions: vi.fn(), dashboard: vi.fn() } }));
vi.mock('recharts', () => Object.fromEntries([
  'Area', 'AreaChart', 'Bar', 'BarChart', 'CartesianGrid', 'ResponsiveContainer', 'Tooltip', 'XAxis', 'YAxis',
].map(key => [key, () => null])));

it('only breathes for a nonzero success sector as the selected period changes', async () => {
  const task = (id: string, status: 'completed' | 'failed', startedAt: string): TaskExecution =>
    ({ id, status, startedAt, title: id }) as TaskExecution;
  const items = [
    task('failure', 'failed', new Date(Date.now() - 60_000).toISOString()),
    task('success', 'completed', new Date(Date.now() - 2 * 86400_000).toISOString()),
  ];
  vi.mocked(taskAPI.listExecutions).mockResolvedValue({ data: { items, total: items.length } } as Awaited<ReturnType<typeof taskAPI.listExecutions>>);
  vi.mocked(taskAPI.dashboard).mockRejectedValue(new Error('unavailable'));
  const { container } = render(<MemoryRouter><Home /></MemoryRouter>);
  const gauge = container.querySelector<HTMLElement>('.aegis-gauge')!;
  expect(gauge).not.toHaveAttribute('data-filled');
  expect(gauge).toHaveTextContent('暂无统计');
  await screen.findByText('50');
  expect(gauge).toHaveAttribute('data-filled');
  const lit = () => gauge.querySelectorAll('.aegis-gauge-active line');
  const unlit = () => gauge.querySelectorAll('.aegis-gauge-track line');
  expect(lit()).toHaveLength(30);
  expect(unlit()).toHaveLength(30);
  expect(lit()[0]).toHaveAttribute('transform', 'rotate(0 100 100)');
  expect(lit()[0]).toHaveAttribute('y2', '28');
  expect(lit()[1]).toHaveAttribute('y2', '22');
  const motion = screen.getByRole('button', { name: '成功率呼吸动效' });
  expect(motion).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(motion);
  expect(gauge).toHaveAttribute('data-motion', 'off');
  await userEvent.click(motion);
  expect(gauge).toHaveAttribute('data-motion', 'on');
  await userEvent.click(screen.getByRole('button', { name: '24 小时' }));
  expect(gauge).not.toHaveAttribute('data-filled');
  expect(gauge).toHaveTextContent('0%');
  expect(lit()).toHaveLength(0);
  expect(unlit()).toHaveLength(60);
});
