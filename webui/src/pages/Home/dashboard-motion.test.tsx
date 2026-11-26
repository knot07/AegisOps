import { act, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { taskAPI, type TaskExecution } from '@/api/task';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import enHome from '@/locales/en-US/home.json';
import zhHome from '@/locales/zh-CN/home.json';
import Home from './index';

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/hooks/useStats', () => ({ useStats: () => ({ stats: null, refetch: async () => {} }) }));
vi.mock('@/api/task', () => ({ taskAPI: { listExecutions: vi.fn(), dashboard: vi.fn() } }));
vi.mock('recharts', () => ({
  ...Object.fromEntries(['Area', 'AreaChart', 'Bar', 'CartesianGrid', 'Tooltip', 'XAxis', 'YAxis'].map(key => [key, () => null])),
  ResponsiveContainer: ({ children }: { children: ReactNode }) => children,
  BarChart: ({ data }: { data: { label: string; count: number }[] }) => (
    <div data-testid="execution-bars">
      {data.map(({ label, count }, i) => <span key={i} data-count={count}>{label}</span>)}
    </div>
  ),
}));

async function renderDashboard() {
  const task = (id: string, status: 'completed' | 'failed', startedAt: string): TaskExecution =>
    ({ id, status, startedAt, title: id }) as TaskExecution;
  const items = [
    task('failure', 'failed', new Date(Date.now() - 60_000).toISOString()),
    task('success', 'completed', new Date(Date.now() - 2 * 86400_000).toISOString()),
    task('earlier', 'completed', new Date(Date.now() - 15 * 86400_000).toISOString()),
  ];
  vi.mocked(taskAPI.listExecutions).mockResolvedValue({ data: { items, total: items.length } } as Awaited<ReturnType<typeof taskAPI.listExecutions>>);
  vi.mocked(taskAPI.dashboard).mockRejectedValue(new Error('unavailable'));
  const i18n = createInstance();
  await i18n.init({ lng: 'zh-CN', resources: { 'zh-CN': { home: zhHome }, 'en-US': { home: enHome } } });
  return { i18n, ...render(<I18nextProvider i18n={i18n}><MemoryRouter><Home /></MemoryRouter></I18nextProvider>) };
}

it('only breathes for a nonzero success sector as the selected period changes', async () => {
  const { i18n, container } = await renderDashboard();
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
  await act(async () => { await i18n.changeLanguage('en-US'); });
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Task pulse' })).toBeVisible();
  expect(screen.getByRole('button', { name: '24 hours' })).toHaveAttribute('aria-pressed', 'true');
  expect(container.querySelector('.aegis-dashboard-heading [data-module-emblem=home]')).toBeVisible();
});

it('uses the Task pulse range for the execution volume heading, total and bars', async () => {
  const { i18n } = await renderDashboard();
  const check = (title: string, total: string, name: string, buckets: number, runs: number, tick: RegExp) => {
    const heading = screen.getByRole('heading', { name: title });
    expect(within(heading.parentElement!).getByText(total)).toBeVisible();
    const chart = screen.getByRole('img', { name });
    const bars = [...within(chart).getByTestId('execution-bars').children];
    expect(bars).toHaveLength(buckets);
    expect(bars.reduce((sum, bar) => sum + Number(bar.getAttribute('data-count')), 0)).toBe(runs);
    expect(bars[0].textContent).toMatch(tick);
  };
  await screen.findByRole('img', { name: '近 7 天执行量，共 2 次' });
  check('近 7 天执行量', '2 次', '近 7 天执行量，共 2 次', 7, 2, /\d+\/\d+/);
  await userEvent.click(screen.getByRole('button', { name: '30 天' }));
  check('近 30 天执行量', '3 次', '近 30 天执行量，共 3 次', 30, 3, /\d+\/\d+/);
  await userEvent.click(screen.getByRole('button', { name: '24 小时' }));
  check('近 24 小时执行量', '1 次', '近 24 小时执行量，共 1 次', 24, 1, /\d+:\d{2}/);
  await act(async () => { await i18n.changeLanguage('en-US'); });
  check('Execution volume · Last 24 hours', '1 run', 'Execution volume · Last 24 hours: 1 run', 24, 1, /\d+:\d{2}/);
});
