import { NextRequest, NextResponse } from 'next/server';
import { authRequired, tokenFor, expectedToken, ADMIN_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/auth — tells the admin panel whether a password is required. */
export async function GET() {
  const required = authRequired();
  let authed = true;
  if (required) {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    authed = store.get(ADMIN_COOKIE)?.value === expectedToken();
  }
  return NextResponse.json({ required, authed });
}

/** POST /api/auth — sign in with the admin password. */
export async function POST(req: NextRequest) {
  if (!authRequired()) {
    return NextResponse.json({ ok: true, required: false });
  }
  let password = '';
  try {
    const body = (await req.json()) as { password?: string };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (tokenFor(password) !== expectedToken()) {
    return NextResponse.json({ ok: false, error: 'wrong_password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

/** DELETE /api/auth — sign out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
