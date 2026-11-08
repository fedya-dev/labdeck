'use client';

import { ExternalLink } from 'lucide-react';
import { useAppSettings } from '@/components/app-settings';
import { ServiceIcon } from '@/components/service-icon';
import { pick, t } from '@/lib/i18n';
import type { DashboardConfig, Section, Service } from '@/lib/types';

function ServiceRow({ service }: { service: Service }) {
  const { lang } = useAppSettings();
  const name = pick(service.name, lang);
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t('openService', lang)}: ${name}`}
      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ServiceIcon
        url={service.url}
        customIcon={service.icon || undefined}
        name={name}
        size={38}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-5">{name}</span>
        {service.description ? (
          <span className="block truncate text-xs leading-5 text-muted-foreground">
            {pick(service.description, lang)}
          </span>
        ) : null}
      </span>
      <ExternalLink
        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      />
    </a>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const { lang } = useAppSettings();
  return (
    <section
      aria-label={pick(section.name, lang)}
      className="labdeck-rise rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
        {section.icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-lg" aria-hidden="true">
            {section.icon}
          </span>
        ) : null}
        <h2 className="min-w-0 flex-1 truncate text-base font-semibold">
          {pick(section.name, lang)}
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {section.services.length}
        </span>
      </header>
      <div className="p-2">
        {section.services.length === 0 ? (
          <p className="px-2.5 py-3 text-sm text-muted-foreground">{t('noServices', lang)}</p>
        ) : (
          <div className="flex flex-col">
            {section.services.map((svc) => (
              <ServiceRow key={svc.id} service={svc} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SectionsGrid({ config }: { config: DashboardConfig }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {config.sections.map((section, i) => (
        <SectionCard key={section.id} section={section} index={i} />
      ))}
    </div>
  );
}
