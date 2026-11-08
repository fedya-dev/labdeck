'use client';

import { useEffect, useState } from 'react';
import { Languages, LayoutGrid, Palette, Settings2, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppSettings } from '@/components/app-settings';
import { t, pick } from '@/lib/i18n';
import { THEMES, type DashboardConfig, type Theme } from '@/lib/types';

/** Color preview dots for each theme in the switcher. */
const THEME_DOTS: Record<Theme, [string, string, string]> = {
  midnight: ['#22d3ee', '#2dd4bf', '#1e293b'],
  neon: ['#a3e635', '#e879f9', '#0a0f0a'],
  aurora: ['#6ee7b7', '#c4b5fd', '#134e4a'],
  nordic: ['#4f7f9f', '#8b7fd4', '#f1f5f9'],
  paper: ['#f0b429', '#c2571b', '#faf6ec'],
};

const THEME_LABEL: Record<Theme, 'themeMidnight' | 'themeNeon' | 'themeAurora' | 'themeNordic' | 'themePaper'> = {
  midnight: 'themeMidnight',
  neon: 'themeNeon',
  aurora: 'themeAurora',
  nordic: 'themeNordic',
  paper: 'themePaper',
};

function Clock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString('bg-BG', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="hidden md:inline font-mono text-sm tabular-nums text-muted-foreground min-w-16 text-center"
      aria-hidden="true"
    >
      {now ?? '–:–:–'}
    </span>
  );
}

export function Header({
  config,
  onOpenAdmin,
}: {
  config: DashboardConfig;
  onOpenAdmin: () => void;
}) {
  const { lang, setLang, theme, setTheme } = useAppSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Logo + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {pick(config.title, lang)}
            </h1>
            {config.subtitle ? (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                {pick(config.subtitle, lang)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Clock />

          {/* GitHub link (configured in the admin panel) */}
          {config.links?.github ? (
            <Button variant="outline" size="icon" asChild>
              <a
                href={config.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <Github className="h-4.5 w-4.5" />
              </a>
            </Button>
          ) : null}

          {/* Theme switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t('theme', lang)} title={t('theme', lang)}>
                <Palette className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {THEMES.map((th) => (
                <DropdownMenuItem
                  key={th}
                  onClick={() => setTheme(th)}
                  className="flex items-center gap-2.5"
                >
                  <span className="flex -space-x-1">
                    {THEME_DOTS[th].map((c, i) => (
                      <span
                        key={i}
                        className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </span>
                  <span className={theme === th ? 'font-semibold' : ''}>
                    {t(THEME_LABEL[th], lang)}
                  </span>
                  {theme === th && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language toggle BG/EN */}
          <Button
            variant="outline"
            onClick={() => setLang(lang === 'bg' ? 'en' : 'bg')}
            aria-label={t('language', lang)}
            title={lang === 'bg' ? 'Switch to English' : 'Превключи на български'}
            className="gap-1.5 px-3 font-semibold"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {lang === 'bg' ? 'EN' : 'БГ'}
          </Button>

          {/* Admin panel */}
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenAdmin}
            aria-label={t('adminPanel', lang)}
            title={t('adminPanel', lang)}
          >
            <Settings2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
