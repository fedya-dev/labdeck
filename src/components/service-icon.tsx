'use client';

import { useCallback, useState } from 'react';

/**
 * Icon of a service: uses the admin-configured custom icon when present,
 * otherwise fetches the site favicon through /api/favicon (disk-cached).
 * If nothing loads, renders a letter avatar with a deterministic gradient.
 */

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function LetterAvatar({ letter, seed, size }: { letter: string; seed: string; size: number }) {
  const hue = hueFromString(seed);
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-lg font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        backgroundImage: `linear-gradient(135deg, oklch(0.72 0.14 ${hue}), oklch(0.6 0.16 ${(hue + 60) % 360}))`,
      }}
    >
      {letter.toUpperCase()}
    </div>
  );
}

export function ServiceIcon({
  url,
  customIcon,
  name,
  size = 36,
}: {
  url: string;
  customIcon?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = customIcon
    ? customIcon
    : `/api/favicon?url=${encodeURIComponent(url)}`;

  // A 404 can arrive before React attaches the onError handler (instant
  // negative-cache responses), so also check the element in the ref
  // callback, which runs right after the node is attached.
  const handleRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return <LetterAvatar letter={name.trim().charAt(0) || '?'} seed={url} size={size} />;
  }

  return (
    <img
      ref={handleRef}
      src={src}
      alt={`${name} icon`}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-lg bg-background/60 object-contain p-0.5"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
