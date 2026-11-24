import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkflowNodeHistory from './WorkflowNodeHistory';
import type { TaskExecution } from '@/api/task';

const { getHistory, getExecution } = vi.hoisted(() => ({ getHistory: vi.fn(), getExecution: vi.fn() }));
vi.mock('@/api/workflow', () => ({ workflowAPI: { getHistory, getExecution } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('WorkflowNodeHistory', () => {
  it('scopes history to the task run and shows the failed node and error', async () => {
    getHistory.mockResolvedValue({ data: [{ id: 'attempt-1', status: 'error', currentNodeId: 'lookup_fixture', stepCount: 45 }] });
    getExecution.mockResolvedValue({ data: { id: 'attempt-1', executionLog: [{ node_id: 'lookup_fixture', error: 'Fixture unavailable' }] } });
    const task = { id: 'exec-fixture', workflowID: 'workflow-fixture', startedAt: '2026-11-20T09:00:00Z', status: 'failed' } as TaskExecution;
    render(<WorkflowNodeHistory task={task} />);
    expect(await screen.findByText('Fixture unavailable')).toBeInTheDocument();
    expect(screen.getByText('nodeHistory.recentOnly')).toBeInTheDocument();
    expect(getHistory).toHaveBeenCalledWith('workflow-fixture', { triggerId: 'exec-fixture', triggerType: 'task', limit: 20 });
    expect(getExecution).toHaveBeenCalledWith('workflow-fixture', 'attempt-1', { stepOffset: 15, stepLimit: 30 });
  });
});
