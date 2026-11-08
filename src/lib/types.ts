// ─── LabDeck · core domain types ────────────────────────────────────────────

/** A piece of text available in both supported languages. */
export interface LocalizedText {
  bg: string;
  en: string;
}

export interface Service {
  /** stable unique id (nanoid-ish, generated on create) */
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  /** target URL of the service, e.g. https://192.168.1.10:8006 */
  url: string;
  /**
   * Optional explicit icon URL (png/svg/ico).
   * When empty, LabDeck auto-fetches the favicon of `url`
   * through /api/favicon and caches it on disk.
   */
  icon?: string;
}

export interface Section {
  id: string;
  name: LocalizedText;
  /** emoji shown next to the section title */
  icon?: string;
  services: Service[];
}

/** Visibility toggles for the hero widget (greeting + big clock + stats). */
export interface HeroSettings {
  /** render the whole hero section */
  show: boolean;
  /** render the big clock inside the hero (greeting/date stay) */
  showClock: boolean;
}

/** Optional external links surfaced in the UI (header icon / footer icon). */
export interface FooterLinks {
  /** GitHub profile or repo — icon button in the header; empty = hidden */
  github?: string;
  /** personal website — icon link in the footer; empty = hidden */
  website?: string;
}

export interface DashboardConfig {
  version: number;
  title: LocalizedText;
  subtitle?: LocalizedText;
  sections: Section[];
  /** optional — older configs without it behave as { show: true, showClock: true } */
  hero?: HeroSettings;
  /** optional — older configs without it show no external links */
  links?: FooterLinks;
}

/** Supported UI languages. */
export type Lang = 'bg' | 'en';

/** Available color themes (keys map to [data-theme="…"] in globals.css). */
export const THEMES = ['midnight', 'neon', 'aurora', 'nordic', 'paper'] as const;
export type Theme = (typeof THEMES)[number];
