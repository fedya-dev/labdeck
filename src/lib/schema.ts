import { z } from 'zod';

/** Zod validation schema for the dashboard config (shared by API + admin UI). */

export const localizedTextSchema = z
  .object({
    bg: z.string().trim().max(120).optional(),
    en: z.string().trim().max(120).optional(),
  })
  // Missing/empty language falls back to its twin, so a half-filled
  // bilingual form (e.g. BG description typed, EN left empty) stays valid.
  .transform((v) => ({ bg: (v.bg ?? v.en ?? '').trim(), en: (v.en ?? v.bg ?? '').trim() }))
  .refine((v) => v.bg.length > 0, { message: 'BG or EN text is required' });

/** True for null/undefined or a {bg,en} pair that is empty in both languages. */
function isBlankText(v: unknown): boolean {
  if (v === null || v === undefined || typeof v !== 'object') return true;
  const o = v as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
  return s(o.bg) === '' && s(o.en) === '';
}

/**
 * Lenient URL: a scheme-less value gets http:// prepended
 * ("192.168.1.10:8006" → "http://192.168.1.10:8006") so a missing protocol
 * never rejects a save. Values with any scheme, and empty strings, pass through.
 */
const autoHttpUrl = z
  .string()
  .trim()
  .transform((v) => (v === '' || /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `http://${v}`));

export const serviceSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: localizedTextSchema,
  // a fully-empty description is simply treated as "no description"
  description: z.preprocess((v) => (isBlankText(v) ? undefined : v), localizedTextSchema.optional()),
  url: autoHttpUrl.pipe(
    z
      .string()
      .min(1)
      .max(2048)
      .refine((v) => /^https?:\/\//i.test(v), {
        message: 'URL must start with http:// or https://',
      })
  ),
  icon: z.string().trim().max(2048).optional().or(z.literal('')),
});

export const sectionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: localizedTextSchema,
  icon: z.string().trim().max(16).optional().or(z.literal('')),
  services: z.array(serviceSchema).max(64),
});

/** External link field: empty string (hidden) or a http(s) URL. */
const optionalLinkUrl = autoHttpUrl
  .pipe(
    z.string().max(2048).refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), {
      message: 'Must be an http(s) URL or empty',
    })
  )
  .optional();

export const heroSettingsSchema = z.object({
  show: z.boolean().default(true),
  showClock: z.boolean().default(true),
});

export const footerLinksSchema = z.object({
  github: optionalLinkUrl,
  website: optionalLinkUrl,
});

export const dashboardConfigSchema = z.object({
  version: z.number().int().positive().max(999),
  title: localizedTextSchema,
  subtitle: localizedTextSchema.optional(),
  sections: z.array(sectionSchema).max(32),
  // defaults keep configs written before these fields existed valid
  hero: heroSettingsSchema.default({ show: true, showClock: true }),
  links: footerLinksSchema.default({}),
});

export type DashboardConfigInput = z.infer<typeof dashboardConfigSchema>;
