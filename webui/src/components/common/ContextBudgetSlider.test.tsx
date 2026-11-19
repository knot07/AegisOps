import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import ContextBudgetSlider from './ContextBudgetSlider';
function Fixture() { const [value,setValue]=useState(128000); return <ContextBudgetSlider label="Budget" value={value} capacity={128000} onChange={setValue}/>; }
it('uses the shared million-token ruler while clamping real edits to the model capacity', () => {
 render(<Fixture/>); const slider=screen.getByRole('slider',{name:'Budget'});
 expect(screen.getByText('400K')).toBeInTheDocument(); expect(screen.getByText('1M')).toBeInTheDocument();
 fireEvent.change(slider,{target:{value:'800000'}}); expect(slider).toHaveAttribute('aria-valuenow','128000');
 fireEvent.keyDown(slider,{key:'Home'}); expect(slider).toHaveAttribute('aria-valuenow','4096');
 fireEvent.keyDown(slider,{key:'ArrowRight'}); expect(slider).toHaveAttribute('aria-valuenow','5120');
 fireEvent.keyDown(slider,{key:'End'}); expect(slider).toHaveAttribute('aria-valuenow','128000');
});
