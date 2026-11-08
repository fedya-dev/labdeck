import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

export const dynamic = 'force-dynamic';

/** GET /api/health — used by the Docker healthcheck. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'LabDeck',
    version: APP_VERSION,
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
}
