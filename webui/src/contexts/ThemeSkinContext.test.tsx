import { useContext } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSkinContext, ThemeSkinProvider } from './ThemeSkinContext';
import { THEME_SKIN_STORAGE_KEY, type ThemeSkin } from '@/styles/themeSkins';

function Choice() {
 const { skin, setSkin }=useContext(ThemeSkinContext);
 return <><output data-testid="skin">{skin}</output>{(['sage','blue','teal','violet','sand'] as ThemeSkin[]).map(value=><button key={value} onClick={()=>setSkin(value)}>{value}</button>)}</>;
}
function mount(){return render(<ThemeSkinProvider><Choice/></ThemeSkinProvider>);}
beforeEach(()=>{localStorage.clear();delete document.documentElement.dataset.themeSkin;document.documentElement.classList.remove('dark');});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('independent theme skin preference',()=>{
 it('preserves the established skin when no preference exists or a value is invalid',()=>{
  localStorage.setItem(THEME_SKIN_STORAGE_KEY,'<invalid>');mount();expect(document.documentElement.dataset.themeSkin).toBe('sage');
 });
 it('applies and persists all skins without changing the light/dark choice',()=>{
  document.documentElement.classList.add('dark');localStorage.setItem('aegisops_theme_mode','dark');mount();
  for(const skin of ['blue','teal','violet','sand','sage']){fireEvent.click(screen.getByRole('button',{name:skin}));expect(document.documentElement.dataset.themeSkin).toBe(skin);expect(localStorage.getItem(THEME_SKIN_STORAGE_KEY)).toBe(skin);expect(document.documentElement.classList.contains('dark')).toBe(true);expect(localStorage.getItem('aegisops_theme_mode')).toBe('dark');}
 });
 it('restores the stored choice after remount',()=>{
  const view=mount();fireEvent.click(screen.getByRole('button',{name:'violet'}));view.unmount();mount();expect(screen.getByTestId('skin').textContent).toBe('violet');
 });
 it('synchronizes other tabs and restores the default when storage is cleared',()=>{
  mount();act(()=>window.dispatchEvent(new StorageEvent('storage',{key:THEME_SKIN_STORAGE_KEY,newValue:'sand'})));expect(document.documentElement.dataset.themeSkin).toBe('sand');
  act(()=>window.dispatchEvent(new StorageEvent('storage',{key:null,newValue:null})));expect(document.documentElement.dataset.themeSkin).toBe('sage');
 });
 it('still changes appearance when storage is unavailable',()=>{
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('blocked')});
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});mount();fireEvent.click(screen.getByRole('button',{name:'blue'}));expect(document.documentElement.dataset.themeSkin).toBe('blue');
 });
});
