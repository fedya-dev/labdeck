import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { paths } from '@/lib/config-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/favicon?url=<service-url>
 *
 * Automatically fetches and caches the favicon of the given service URL.
 * Resolution order:
 *   1. local disk cache (data/favicons/<host>.<ext>)
 *   2. <origin>/favicon.ico
 *   3. <origin> HTML <link rel="icon"> tag
 *   4. DuckDuckGo icon service
 *   5. Google S2 icon service
 * On success the icon is cached on disk so the target server is not
 * hammered on every dashboard load. On failure → 404 and the UI renders
 * a letter avatar instead.
 */

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 2500;
const NEG_TTL_MS = 5 * 60 * 1000;

/** In-memory negative cache — hosts whose favicon we failed to resolve recently. */
const failedHosts = new Map<string, number>();

const EXT_TO_MIME: Record<string, string> = {
  ico: 'image/x-icon',
  png: 'image/png',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

function extFromMime(mime: string): string {
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg')) return 'jpg';
  return 'ico';
}

/** Node Buffer → standalone Uint8Array (fresh ArrayBuffer → valid fetch BodyInit). */
const toBody = (buf: Buffer) => new Uint8Array(buf);

function isValidImage(buf: Buffer, mime: string): boolean {
  if (!mime.startsWith('image/') && !mime.includes('image')) return false;
  if (buf.length < 24) return false;
  // magic bytes: ico/png/gif/jpeg/svg
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01) return true; // ico
  if (buf[0] === 0x89 && buf[1] === 0x50) return true; // png
  if (buf[0] === 0x47 && buf[1] === 0x49) return true; // gif
  if (buf[0] === 0xff && buf[1] === 0xd8) return true; // jpeg
  if (buf.slice(0, 4).toString() === '<svg' || buf.slice(0, 5).toString() === '<?xml') return true; // svg
  return mime.includes('image') && buf.length > 100;
}

async function fetchBuf(url: string): Promise<{ buf: Buffer; mime: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'LabDeck/1.0 (+favicon-fetcher)' },
    });
    if (!res.ok) return null;
    const mime = (res.headers.get('content-type') ?? '').toLowerCase();
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_BYTES) return null;
    const buf = Buffer.from(ab);
    if (!isValidImage(buf, mime)) return null;
    return { buf, mime };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Look for a <link rel="icon" href="…"> in the site HTML. */
async function findIconInHtml(origin: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(origin, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'LabDeck/1.0 (+favicon-fetcher)' },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200_000);
    const m = html.match(
      /<link[^>]+rel=["']?(?:shortcut\s+icon|icon|apple-touch-icon)["']?[^>]*>/i
    );
    if (!m) return null;
    const href = m[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) return null;
    return new URL(href, origin).toString();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') ?? '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('bad url', { status: 400 });
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return new NextResponse('bad protocol', { status: 400 });
  }
  const host = target.hostname.toLowerCase();
  const safeHost = host.replace(/[^a-z0-9.-]/g, '_');

  // Recently failed → do not hammer the network again for 5 minutes.
  const failedAt = failedHosts.get(host);
  if (failedAt && Date.now() - failedAt < NEG_TTL_MS) {
    return new NextResponse('not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 1 · disk cache
  try {
    const files = await fs.readdir(paths.FAVICON_DIR);
    const hit = files.find((f) => f.startsWith(`${safeHost}.`));
    if (hit) {
      const ext = path.extname(hit).slice(1);
      const buf = await fs.readFile(path.join(paths.FAVICON_DIR, hit));
      return new NextResponse(toBody(buf), {
        headers: {
          'Content-Type': EXT_TO_MIME[ext] ?? 'image/x-icon',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  } catch {
    /* fall through to network */
  }

  // 2..4 · direct sources, raced in parallel (first valid wins, priority = order)
  const sources: string[] = [
    `${target.origin}/favicon.ico`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,
  ];

  const settled = await Promise.allSettled(sources.map((s) => fetchBuf(s)));
  for (const r of settled) {
    const got = r.status === 'fulfilled' ? r.value : null;
    if (got) {
      failedHosts.delete(host);
      const ext = extFromMime(got.mime);
      const file = `${safeHost}.${ext}`;
      try {
        await fs.writeFile(path.join(paths.FAVICON_DIR, file), got.buf);
      } catch {
        /* cache write is best-effort */
      }
      return new NextResponse(toBody(got.buf), {
        headers: {
          'Content-Type': EXT_TO_MIME[ext] ?? got.mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  }

  // HTML <link rel=icon> as a smarter fallback
  const linkIcon = await findIconInHtml(target.origin);
  if (linkIcon) {
    const got = await fetchBuf(linkIcon);
    if (got) {
      const ext = extFromMime(got.mime);
      const file = `${safeHost}.${ext}`;
      try {
        await fs.writeFile(path.join(paths.FAVICON_DIR, file), got.buf);
      } catch {
        /* best-effort */
      }
      return new NextResponse(toBody(got.buf), {
        headers: {
          'Content-Type': EXT_TO_MIME[ext] ?? got.mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  }

  // Nothing worked → remember the failure briefly so we return 404 fast.
  failedHosts.set(host, Date.now());
  if (failedHosts.size > 512) {
    const oldest = failedHosts.keys().next().value;
    if (oldest) failedHosts.delete(oldest);
  }
  return new NextResponse('not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
}
