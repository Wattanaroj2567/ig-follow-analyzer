import { useEffect, useState } from 'react';

type ColorScheme = 'light' | 'dark';
export type ThemePreference = ColorScheme | 'system';

export const THEME_STORAGE_KEY = 'ig-follow-analyzer-theme';

const LIGHT_THEME_COLOR = '#f8f8f5';
const DARK_THEME_COLOR = '#13141a';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const preference = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return preference === 'light' || preference === 'dark' ? preference : 'system';
  } catch {
    return 'system';
  }
}

function applyThemeToDocument(scheme: ColorScheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = scheme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = scheme === 'light' ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
  }
}

function saveThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== 'function') return;
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState(getStoredThemePreference);

  useEffect(() => {
    if (preference !== 'system') {
      applyThemeToDocument(preference);
      return;
    }

    const systemScheme = window.matchMedia?.(DARK_SCHEME_QUERY);
    const syncTheme = () =>
      applyThemeToDocument(systemScheme?.matches === false ? 'light' : 'dark');
    syncTheme();
    systemScheme?.addEventListener('change', syncTheme);
    return () => systemScheme?.removeEventListener('change', syncTheme);
  }, [preference]);

  const setPreference = (next: ThemePreference) => {
    saveThemePreference(next);
    setPreferenceState(next);
  };

  return { preference, setPreference };
}
