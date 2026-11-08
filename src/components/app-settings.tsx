'use client';

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import type { Lang, Theme } from '@/lib/types';
import { THEMES } from '@/lib/types';

/**
 * Client store for the two user preferences: UI language (bg/en) and color
 * theme. Both persist in localStorage and are applied to
 * <html data-theme|lang>. A bootstrap script in layout.tsx sets the
 * attributes before first paint to avoid a flash of the wrong theme.
 *
 * Implemented with useSyncExternalStore: the server snapshot is the default
 * (bg · midnight); right after hydration React re-reads localStorage and
 * re-renders if the user had a saved preference.
 */

interface AppSettings {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
}

type Prefs = { lang: Lang; theme: Theme };

const DEFAULTS: Prefs = { lang: 'bg', theme: 'midnight' };

/* ── external store over localStorage ── */

const listeners = new Set<() => void>();
let initialized = false;
let clientPrefs: Prefs = DEFAULTS;

function readPrefs(): Prefs {
  let lang: Lang = DEFAULTS.lang;
  let theme: Theme = DEFAULTS.theme;
  try {
    const l = localStorage.getItem('labdeck.lang');
    if (l === 'bg' || l === 'en') lang = l;
    const t = localStorage.getItem('labdeck.theme');
    if (t && (THEMES as readonly string[]).includes(t)) theme = t as Theme;
  } catch {
    /* private mode */
  }
  return { lang, theme };
}

function getSnapshot(): Prefs {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    clientPrefs = readPrefs();
  }
  return clientPrefs;
}

function getServerSnapshot(): Prefs {
  return DEFAULTS;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit(prefs: Prefs): void {
  clientPrefs = prefs;
  listeners.forEach((l) => l());
}

function persist(key: 'labdeck.lang' | 'labdeck.theme', value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* ── context ── */

const AppSettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const { lang, theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((l: Lang) => {
    document.documentElement.setAttribute('lang', l);
    persist('labdeck.lang', l);
    emit({ ...getSnapshot(), lang: l });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);
    persist('labdeck.theme', t);
    emit({ ...getSnapshot(), theme: t });
  }, []);

  return (
    <AppSettingsContext.Provider value={{ lang, theme, setLang, setTheme }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
