import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ThemedSelect from './ThemedSelect';
const options = [{ value: '', label: '模型默认' }, { value: 'low', label: '低' }, { value: 'high', label: '高' }];
function Fixture() {
  const [value, setValue] = useState('');
  return <ThemedSelect label="思考强度" options={options} value={value} onChange={setValue} />;
}
it('supports keyboard selection and Escape without dismissing the surrounding editor', () => {
  render(<Fixture />);
  const trigger = screen.getByRole('combobox'); trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.keyDown(trigger, { key: 'End' }); fireEvent.keyDown(trigger, { key: 'Enter' });
  expect(trigger).toHaveTextContent('高'); expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.click(trigger); expect(screen.getByRole('option', { name: '高' })).toHaveAttribute('aria-selected', 'true');
  const surroundingEscape = vi.fn(); document.addEventListener('keydown', surroundingEscape);
  fireEvent.keyDown(trigger, { key: 'Escape' });
  document.removeEventListener('keydown', surroundingEscape);
  expect(surroundingEscape).not.toHaveBeenCalled(); expect(trigger).toHaveFocus();
  expect(trigger).toHaveTextContent('高'); expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
it('closes on outside interaction or Tab and supports resetting to model defaults', () => {
  render(<Fixture />); const trigger = screen.getByRole('combobox');
  fireEvent.click(trigger); fireEvent.click(screen.getByRole('option', { name: '低' }));
  expect(trigger).toHaveTextContent('低');
  fireEvent.click(trigger); fireEvent.pointerDown(document.body);
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.click(trigger); fireEvent.keyDown(trigger, { key: 'Tab' });
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  fireEvent.click(trigger); fireEvent.click(screen.getByRole('option', { name: '模型默认' }));
  expect(trigger).toHaveTextContent('模型默认');
});
it('prevents editing when disabled and closes an already-open menu', () => {
  const change = vi.fn();
  const { rerender } = render(<ThemedSelect label="思考强度" options={options} value="" onChange={change} />);
  fireEvent.click(screen.getByRole('combobox')); expect(screen.getByRole('listbox')).toBeInTheDocument();
  rerender(<ThemedSelect label="思考强度" options={options} value="" onChange={change} disabled />);
  expect(screen.getByRole('combobox')).toBeDisabled();
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument(); expect(change).not.toHaveBeenCalled();
});
