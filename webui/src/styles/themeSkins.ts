import palettes from './theme-palettes.json';

export type ThemeSkin = 'sage' | 'blue' | 'teal' | 'violet' | 'sand';
export const THEME_SKIN_STORAGE_KEY = 'aegisops_theme_skin';
export const THEME_SKINS = palettes as (typeof palettes[number] & { id: ThemeSkin })[];
export function isThemeSkin(value: unknown): value is ThemeSkin {
  return typeof value === 'string' && THEME_SKINS.some(skin => skin.id === value);
}
