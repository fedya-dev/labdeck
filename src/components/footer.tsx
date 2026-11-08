'use client';

import { Globe } from 'lucide-react';
import { useAppSettings } from '@/components/app-settings';
import { t } from '@/lib/i18n';
import { APP_VERSION } from '@/lib/version';
import type { DashboardConfig } from '@/lib/types';

/** Hostname of a link for display; falls back to the raw string. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function Footer({ config }: { config: DashboardConfig }) {
  const { lang } = useAppSettings();
  const year = new Date().getFullYear();
  const website = config.links?.website?.trim();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            LabDeck v{APP_VERSION} · {year} · {t('selfHosted', lang)}
          </span>
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-0.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t('visitSite', lang)}
              title={t('visitSite', lang)}
            >
              <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {hostOf(website)}
            </a>
          ) : null}
        </p>
        <p>{t('footerHint', lang)}</p>
      </div>
    </footer>
  );
}
