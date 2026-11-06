import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SystemLogPage from './index';

const { logsAPI } = vi.hoisted(() => ({
  logsAPI: {
    list: vi.fn(),
    readLatest: vi.fn(),
    read: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/logs', () => ({ logsAPI }));

describe('SystemLogPage toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logsAPI.list.mockResolvedValue({
      data: { files: [{ name: '2026-09-15/aegisops.log', size: 1, modified: 0 }], log_dir: '/logs' },
    });
    logsAPI.readLatest.mockResolvedValue({
      data: { filename: '2026-09-15/aegisops.log', content: 'INFO line', total_lines: 1, truncated: false },
    });
  });

  it('loads the latest file into the viewer and lists it in the file select', async () => {
    render(<SystemLogPage />);
    expect(await screen.findByText('INFO line')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('2026-09-15/aegisops.log');
    expect(logsAPI.readLatest).toHaveBeenCalled();
  });
  it('filters current log lines without another request and restores them on clear', async () => {
    logsAPI.readLatest.mockResolvedValue({ data: { filename: 'app.log', content: 'INFO ready\nERROR Failed <script>raw</script>', total_lines: 2, truncated: false } });
    render(<SystemLogPage />);
    expect(await screen.findByText('INFO ready')).toBeInTheDocument();
    const search = screen.getByRole('textbox', { name: 'logs.searchLabel' });
    fireEvent.change(search, { target: { value: 'failed' } });
    expect(screen.queryByText('INFO ready')).not.toBeInTheDocument();
    expect(screen.getByText('ERROR Failed <script>raw</script>')).toBeInTheDocument();
    expect(document.querySelector('pre script')).toBeNull();
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByText('logs.noMatches')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByText('INFO ready')).toBeInTheDocument();
    expect(logsAPI.readLatest).toHaveBeenCalledTimes(1);
  });

});
