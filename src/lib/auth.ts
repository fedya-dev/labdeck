import { createHmac } from 'crypto';

/**
 * Optional password protection for the admin panel.
 * Set ADMIN_PASSWORD via environment (docker-compose / .env) to enable it.
 * When unset, the admin panel is open — same philosophy as Dashy.
 */

export const ADMIN_COOKIE = 'labdeck_admin';

export function adminPassword(): string | undefined {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.trim().length > 0 ? pw.trim() : undefined;
}

export function authRequired(): boolean {
  return adminPassword() !== undefined;
}

export function expectedToken(): string {
  return createHmac('sha256', adminPassword() ?? 'labdeck')
    .update('labdeck-admin-v1')
    .digest('hex');
}

export function tokenFor(password: string): string {
  return createHmac('sha256', password.trim()).update('labdeck-admin-v1').digest('hex');
}

/** Check the admin cookie on an incoming request. */
export async function isAuthed(): Promise<boolean> {
  if (!authRequired()) return true;
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expectedToken();
}
