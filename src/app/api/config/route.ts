import { NextRequest, NextResponse } from 'next/server';
import { readConfig, writeConfig } from '@/lib/config-store';
import { dashboardConfigSchema } from '@/lib/schema';
import { authRequired, isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/config — the full dashboard config (always fresh from disk). */
export async function GET() {
  const config = await readConfig();
  return NextResponse.json(config, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** PUT /api/config — persist a new dashboard config (admin only). */
export async function PUT(req: NextRequest) {
  if (authRequired() && !(await isAuthed())) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized' },
      { status: 401 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const parsed = dashboardConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'validation_failed', issues: parsed.error.issues.slice(0, 5) },
      { status: 422 }
    );
  }
  await writeConfig(parsed.data);
  // Return the canonical (schema-ordered) config so the admin editor can
  // sync its draft exactly to what is on disk.
  return NextResponse.json({ ok: true, config: parsed.data });
}
