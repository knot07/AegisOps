import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DelegateDetailSheet from './DelegateDetailSheet';
import WorkerProgressPanel from './WorkerProgressPanel';

const { readDetail, readProgress } = vi.hoisted(() => ({ readDetail: vi.fn(), readProgress: vi.fn() }));
vi.mock('@/api/session', () => ({ sessionApi: { getWorkerDetail: readDetail, getWorkerProgress: readProgress } }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('./StreamingMarkdown', () => ({ StreamingMarkdown: ({ content }: { content: string }) => <p>{content}</p> }));

const task = { sessionID: 'ses-child', agent: 'rex-junior', description: 'Check a local fixture', state: 'completed', created: null, updated: null };

describe('Worker execution presentation', () => {
  it('shows tool steps and the report separately, with a themed display name', async () => {
    readDetail.mockResolvedValue({ ...task, steps: [{ id: '1', tool: 'fixture_tool', status: 'completed' }], report: 'Fixture verified.', hasOlderSteps: false });
    const prototype = HTMLDialogElement.prototype;
    const methods = Object.getOwnPropertyDescriptors(prototype);
    Object.defineProperties(prototype, {
      showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
      close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } },
    });
    const onClose = vi.fn();
    const { unmount } = render(<DelegateDetailSheet open onClose={onClose} sessionId={task.sessionID} agentName="rex-junior" description={task.description} status="running" />);
    expect((await screen.findByText('Fixture verified.')).closest('.worker-report-card')).not.toBeNull();
    expect(screen.getByText(task.description).closest('.worker-brief')).not.toBeNull();
    expect(screen.getByText('fixture tool')).toBeInTheDocument();
    expect(screen.getByText('Atlas Worker')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'worker.close' }));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    Reflect.deleteProperty(prototype, 'showModal');
    Reflect.deleteProperty(prototype, 'close');
    Object.defineProperties(prototype, methods);
  });

  it('keeps a completed Worker discoverable from the parent conversation', async () => {
    readProgress.mockResolvedValue({ enabled: true, tasks: [task], hasMore: false });
    render(<WorkerProgressPanel sessionId="ses-parent" accelerated />);
    expect(await screen.findByText(task.description)).toBeInTheDocument();
    expect(screen.getByText('worker.states.completed')).toBeInTheDocument();
    expect(readProgress).toHaveBeenCalledWith('ses-parent', expect.any(AbortSignal));
  });
});
