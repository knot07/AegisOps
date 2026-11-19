import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { isThemeSkin, THEME_SKIN_STORAGE_KEY, type ThemeSkin } from '@/styles/themeSkins';

export const ThemeSkinContext = createContext<{ skin: ThemeSkin; setSkin: (skin: ThemeSkin) => void }>({ skin: 'sage', setSkin: () => undefined });

function readSkin(): ThemeSkin {
  try {
    const stored = window.localStorage.getItem(THEME_SKIN_STORAGE_KEY);
    return isThemeSkin(stored) ? stored : 'sage';
  } catch { return 'sage'; }
}

/** Color palette is independent of light/dark/system mode and never changes a vendor identity. */
export function ThemeSkinProvider({ children }: { children: ReactNode }) {
  const [skin, updateSkin] = useState<ThemeSkin>(readSkin);
  useLayoutEffect(() => { document.documentElement.dataset.themeSkin = skin; }, [skin]);
  const setSkin = useCallback((next: ThemeSkin) => {
    if (!isThemeSkin(next)) return;
    updateSkin(next);
    try { window.localStorage.setItem(THEME_SKIN_STORAGE_KEY, next); } catch { /* Applies for this session when storage is blocked. */ }
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_SKIN_STORAGE_KEY || event.key === null) updateSkin(isThemeSkin(event.newValue) ? event.newValue : 'sage');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin]);
  return <ThemeSkinContext.Provider value={value}>{children}</ThemeSkinContext.Provider>;
}
