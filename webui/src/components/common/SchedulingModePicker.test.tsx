import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SchedulingModePicker from './SchedulingModePicker';

describe('Scheduling mode picker', () => {
  it('keeps standard mode and explicitly offers experimental Super-agent', async () => {
    const user=userEvent.setup();const change=vi.fn();
    const {rerender}=render(<SchedulingModePicker value="legacy" onChange={change}/>);
    await user.click(screen.getByRole('button',{name:'切换调度模式'}));
    expect(screen.getByRole('button',{name:/标准调度 沿用/})).toHaveAttribute('aria-pressed','true');
    await user.click(screen.getByRole('button',{name:/Super-agent 实验性/}));
    expect(change).toHaveBeenCalledWith('superagent');expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<SchedulingModePicker value="superagent" onChange={change} disabled/>);
    expect(screen.getByRole('button',{name:'切换调度模式'})).toBeDisabled();
  });
});
