'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Globe } from 'lucide-react';
import { useAppSettings } from '@/components/app-settings';
import { t } from '@/lib/i18n';
import type { DashboardConfig } from '@/lib/types';

/**
 * Hero widgets: time-of-day greeting, big clock, localized date and
 * quick stats (sections / services count).
 */

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return 'goodMorning' as const;
  if (hour >= 12 && hour < 18) return 'goodAfternoon' as const;
  if (hour >= 18 && hour < 22) return 'goodEvening' as const;
  return 'goodNight' as const;
}

export function Hero({ config }: { config: DashboardConfig }) {
  const { lang } = useAppSettings();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const locale = lang === 'bg' ? 'bg-BG' : 'en-US';
  const time = now
    ? now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    : '--:--:--';
  const date = now
    ? new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now)
    : '\u00A0';
  const greeting = now ? t(greetingKey(now.getHours()), lang) : '\u00A0';

  const servicesTotal = config.sections.reduce((acc, s) => acc + s.services.length, 0);
  const showClock = config.hero?.showClock !== false;

  return (
    <section
      aria-label={greeting}
      className="labdeck-rise relative overflow-hidden rounded-2xl border border-border/60 p-6 sm:p-8"
      style={{ backgroundImage: 'radial-gradient(120% 160% at 0% 0%, var(--hero-glow), transparent 60%)' }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={showClock ? 'text-sm font-medium text-muted-foreground' : 'text-lg font-semibold'}>
            {greeting} 👋
          </p>
          {showClock ? (
            <p
              className="mt-1 font-mono text-5xl font-bold tabular-nums tracking-tight sm:text-6xl"
              suppressHydrationWarning
            >
              {time}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground capitalize" suppressHydrationWarning>
            {date}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm shadow-sm">
            <LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong className="tabular-nums">{config.sections.length}</strong>
            <span className="text-muted-foreground">{t('sectionsCount', lang)}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-sm shadow-sm">
            <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
            <strong className="tabular-nums">{servicesTotal}</strong>
            <span className="text-muted-foreground">{t('servicesCount', lang)}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
