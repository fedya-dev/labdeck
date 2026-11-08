'use client';

import { useState } from 'react';
import { AppSettingsProvider } from '@/components/app-settings';
import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { SectionsGrid } from '@/components/sections-grid';
import { Footer } from '@/components/footer';
import { AdminPanel } from '@/components/admin-panel';
import type { DashboardConfig } from '@/lib/types';

export function Dashboard({ config }: { config: DashboardConfig }) {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <AppSettingsProvider>
      <div className="flex min-h-screen flex-col">
        <Header config={config} onOpenAdmin={() => setAdminOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
          {config.hero?.show !== false && <Hero config={config} />}
          <SectionsGrid config={config} />
        </main>
        <Footer config={config} />
        <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} config={config} />
      </div>
    </AppSettingsProvider>
  );
}
