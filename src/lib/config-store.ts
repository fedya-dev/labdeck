import { promises as fs } from 'fs';
import path from 'path';
import { dashboardConfigSchema } from './schema';
import { defaultConfig } from './default-config';
import type { DashboardConfig } from './types';

/**
 * File-based config store.
 *
 * The single source of truth is `data/dashboard.json` (volume-mounted in
 * Docker). The admin panel writes through the API and hand-edits on the
 * server are picked up on the next page load / API read, because every read
 * goes to disk — no stale in-memory copy.
 */

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'dashboard.json');
const FAVICON_DIR = path.join(DATA_DIR, 'favicons');

export const paths = { DATA_DIR, CONFIG_FILE, FAVICON_DIR };

async function ensureDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(FAVICON_DIR, { recursive: true });
}

/**
 * Read the dashboard config; seeds the default file when missing.
 *
 * NEVER throws: a broken filesystem (bad permissions on the mounted volume,
 * read-only dir, corrupt JSON) must not take the whole dashboard down.
 * Worst case we render the default config in memory and log the cause.
 */
export async function readConfig(): Promise<DashboardConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
    return dashboardConfigSchema.parse(JSON.parse(raw));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    console.error(`[LabDeck] config read failed (${code ?? 'unknown'}):`, err instanceof Error ? err.message : err);

    if (code === 'ENOENT') {
      // Missing file → try to seed the default. On a read-only or root-owned
      // mount this write fails — fine, we still serve the defaults.
      await writeConfig(defaultConfig).catch((e) =>
        console.error('[LabDeck] could not seed dashboard.json:', e instanceof Error ? e.message : e)
      );
      return defaultConfig;
    }

    // Corrupted JSON or failed validation → back the broken file up and reseed.
    try {
      await fs.rename(CONFIG_FILE, `${CONFIG_FILE}.corrupt-${Date.now()}`);
    } catch {
      /* ignore */
    }
    await writeConfig(defaultConfig).catch((e) =>
      console.error('[LabDeck] could not reseed dashboard.json:', e instanceof Error ? e.message : e)
    );
    return defaultConfig;
  }
}

/** Atomically persist the dashboard config (tmp file + rename). */
export async function writeConfig(config: DashboardConfig): Promise<void> {
  await ensureDirs();
  const validated = dashboardConfigSchema.parse(config);
  const tmp = `${CONFIG_FILE}.tmp-${Date.now()}`;
  await fs.writeFile(tmp, JSON.stringify(validated, null, 2) + '\n', 'utf-8');
  await fs.rename(tmp, CONFIG_FILE);
}

export function configFilePath(): string {
  return CONFIG_FILE;
}
