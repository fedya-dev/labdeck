'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Plus,
  Save,
  Smile,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAppSettings } from '@/components/app-settings';
import { t } from '@/lib/i18n';
import { makeId } from '@/lib/default-config';
import { APP_VERSION } from '@/lib/version';
import { dashboardConfigSchema } from '@/lib/schema';
import type { DashboardConfig, FooterLinks, HeroSettings, Section, Service } from '@/lib/types';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/**
 * Key-order-insensitive JSON stringify — used for the dirty check so that
 * a server round-trip (which may reorder keys via zod) never produces a
 * phantom “unsaved changes” state.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/**
 * Fill a half-filled bilingual text from its twin (empty BG ← EN, empty EN ← BG).
 * Keeps half-translated forms valid instead of rejecting the whole save.
 */
function fillText(v: { bg: string; en: string }): { bg: string; en: string } {
  return { bg: v.bg.trim() || v.en.trim(), en: v.en.trim() || v.bg.trim() };
}

/**
 * Accept lazy URLs: "192.168.1.10:8006" → "http://192.168.1.10:8006".
 * The most common reason a save was rejected was a URL without a protocol —
 * home-lab addresses are habitually typed bare. Values that already carry a
 * scheme (http://, https://, …) pass through untouched, empty stays empty.
 */
function withProtocol(url: string): string {
  const u = url.trim();
  if (u === '' || /^[a-z][a-z0-9+.-]*:\/\//i.test(u)) return u;
  return `http://${u}`;
}

/**
 * Normalize a draft into a payload that always passes validation:
 * empty optional fields are dropped, bilingual texts get their twin filled in.
 */
function normalizeConfig(c: DashboardConfig): DashboardConfig {
  return {
    ...c,
    title: fillText(c.title),
    ...(c.subtitle ? { subtitle: fillText(c.subtitle) } : {}),
    sections: c.sections.map((s) => ({
      ...s,
      name: fillText(s.name),
      icon: s.icon?.trim() ?? '',
      services: s.services.map((v) => {
        const d = v.description;
        const hasDesc = !!d && (d.bg.trim() !== '' || d.en.trim() !== '');
        return {
          ...v,
          name: fillText(v.name),
          ...(hasDesc ? { description: fillText(d!) } : {}),
          url: withProtocol(v.url),
          icon: v.icon?.trim() ?? '',
        };
      }),
    })),
  };
}

function move<T>(arr: T[], from: number, dir: -1 | 1): T[] {
  const to = from + dir;
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

const EMOJIS = [
  '🖥️', '🛡️', '🎬', '🏠', '📈', '🧰', '🌐', '🎮',
  '🎵', '📷', '📦', '🔒', '⚙️', '🗄️', '📡', '☁️',
  '🔧', '🚀', '💡', '🔥', '🌊', '🧠', '📊', '🕹️',
  '🖨️', '🔋', '🛠️', '📚', '🧲', '🤖', '👾', '💾',
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { lang } = useAppSettings();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 text-lg"
          title={t('emojiPick', lang)}
          aria-label={t('emojiPick', lang)}
        >
          {value || <Smile className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(e)}
              className={`flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-accent ${
                value === e ? 'bg-accent ring-1 ring-ring' : ''
              }`}
              aria-label={e}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─── field components ────────────────────────────────────────────────────── */

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="h-9" />
      {hint ? <p className="text-[11px] leading-tight text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */

type AuthState = 'loading' | 'login' | 'ready';
type PendingDelete =
  | { kind: 'section'; sectionIdx: number }
  | { kind: 'service'; sectionIdx: number; serviceIdx: number }
  | null;

export function AdminPanel({
  open,
  onOpenChange,
  config,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DashboardConfig;
}) {
  const { lang } = useAppSettings();
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [draft, setDraft] = useState<DashboardConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Latest draft, readable from async callbacks without stale closures.
  const draftRef = useRef<DashboardConfig | null>(null);

  const dirty =
    !!draft && stableStringify(draft) !== stableStringify(config);

  // Open the panel → check auth + load a fresh editable copy.
  useEffect(() => {
    if (!open) return;
    setAuthState('loading');
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d: { required: boolean; authed: boolean }) => {
        setAuthState(d.required && !d.authed ? 'login' : 'ready');
      })
      .catch(() => setAuthState('ready'));
  }, [open]);

  // Sync the editable copy with the server config (after refresh / open).
  useEffect(() => {
    if (open && authState === 'ready' && !dirty) {
      setDraft(JSON.parse(JSON.stringify(config)) as DashboardConfig);
    }
  }, [open, authState, config]);

  // Reset the draft when the panel closes → the next open starts clean
  // (no phantom "unsaved changes" carried over from a discarded session).
  useEffect(() => {
    if (!open) setDraft(null);
  }, [open]);

  // Always start from what is actually on disk. The `config` prop reflects
  // the moment THIS page was rendered — another tab, another device or a
  // hand-edit on the server may have added sections since then. The API is
  // no-store, so this is always the truth. Without it a freshly created
  // section can be visible on the dashboard yet missing from this editor.
  // The fresh copy is applied ONLY if nothing was edited while the request
  // was in flight — a slow response must never wipe out quick edits.
  useEffect(() => {
    if (!open || authState !== 'ready') return;
    let cancelled = false;
    const untouched = stableStringify(draftRef.current);
    fetch('/api/config', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<DashboardConfig>) : null))
      .then((fresh) => {
        const stillUntouched = stableStringify(draftRef.current) === untouched;
        if (!cancelled && fresh && stillUntouched) setDraft(fresh);
      })
      .catch(() => {
        /* network hiccup — keep the prop-based draft as fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [open, authState]);

  // Keep the ref in sync so async callbacks always see the newest draft.
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const doLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoggingIn(true);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          setAuthState('ready');
          setPassword('');
        } else {
          toast({ title: t('wrongPassword', lang), variant: 'destructive' });
        }
      } finally {
        setLoggingIn(false);
      }
    },
    [password, lang]
  );

  /* ── draft mutations ── */

  const patchTitle = (field: 'bg' | 'en', v: string) =>
    setDraft((d) => (d ? { ...d, title: { ...d.title, [field]: v } } : d));
  const patchSubtitle = (field: 'bg' | 'en', v: string) =>
    setDraft((d) => (d ? { ...d, subtitle: { ...(d.subtitle ?? { bg: '', en: '' }), [field]: v } } : d));

  const patchHero = (p: Partial<HeroSettings>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            hero: {
              show: d.hero?.show ?? true,
              showClock: d.hero?.showClock ?? true,
              ...p,
            },
          }
        : d
    );

  const patchLinks = (p: Partial<FooterLinks>) =>
    setDraft((d) => (d ? { ...d, links: { ...(d.links ?? {}), ...p } } : d));

  const patchSection = (idx: number, patch: Partial<Section>) =>
    setDraft((d) =>
      d ? { ...d, sections: d.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)) } : d
    );

  const patchService = (sIdx: number, vIdx: number, patch: Partial<Service>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            sections: d.sections.map((s, i) =>
              i === sIdx
                ? { ...s, services: s.services.map((v, j) => (j === vIdx ? { ...v, ...patch } : v)) }
                : s
            ),
          }
        : d
    );

  const addSection = () =>
    setDraft((d) =>
      d
        ? {
            ...d,
            sections: [
              ...d.sections,
              {
                id: makeId('sec'),
                icon: '📦',
                name: { bg: 'Нова секция', en: 'New section' },
                services: [],
              },
            ],
          }
        : d
    );

  const addService = (sIdx: number) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            sections: d.sections.map((s, i) =>
              i === sIdx
                ? {
                    ...s,
                    services: [
                      ...s.services,
                      {
                        id: makeId('svc'),
                        name: { bg: 'Нова услуга', en: 'New service' },
                        url: 'http://',
                        icon: '',
                      },
                    ],
                  }
                : s
            ),
          }
        : d
    );

  const confirmPendingDelete = () => {
    if (!pendingDelete || !draft) return;
    if (pendingDelete.kind === 'section') {
      setDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== pendingDelete.sectionIdx) });
    } else {
      setDraft({
        ...draft,
        sections: draft.sections.map((s, i) =>
          i === pendingDelete.sectionIdx
            ? { ...s, services: s.services.filter((_, j) => j !== pendingDelete.serviceIdx) }
            : s
        ),
      });
    }
    setPendingDelete(null);
  };

  /* ── import / export / save ── */

  const exportJson = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `labdeck-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = dashboardConfigSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new Error('invalid');
      setDraft(parsed.data);
      toast({ title: t('imported', lang) });
    } catch {
      toast({ title: t('importError', lang), variant: 'destructive' });
    }
  };

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeConfig(draft)),
      });
      if (res.status === 401) {
        setAuthState('login');
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        ok: boolean;
        config?: DashboardConfig;
        error?: string;
        issues?: Array<{ message?: string; path?: Array<string | number> }>;
      } | null;
      if (!res.ok) {
        // Surface the first validation issue so a rejected save is never a mystery.
        const issue = data?.issues?.[0];
        const where = issue?.path?.length ? ` (${issue.path.join('.')})` : '';
        toast({
          title: t('saveError', lang),
          description: issue?.message ? `${issue.message}${where}` : data?.error,
          variant: 'destructive',
        });
        return;
      }
      // Sync the draft to the canonical config that was actually persisted.
      if (data?.config) setDraft(data.config);
      toast({ title: t('saved', lang) });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [draft, lang, router]);

  /* ── close with unsaved-changes guard ── */

  const requestClose = (next: boolean) => {
    if (!next && dirty) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  };

  /* ── render ── */

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="flex h-[96vh] w-[min(96rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:h-[92vh] sm:max-w-none">
          {authState === 'loading' ? (
            <div className="flex flex-1 items-center justify-center" aria-busy="true">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="sr-only">…</span>
            </div>
          ) : authState === 'login' ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <form onSubmit={doLogin} className="w-full max-w-sm space-y-4">
                <DialogHeader>
                  <DialogTitle>{t('adminLogin', lang)}</DialogTitle>
                  <DialogDescription>{t('adminLoginHint', lang)}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="admin-password">{t('password', lang)}</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loggingIn || !password}>
                  {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('login', lang)}
                </Button>
              </form>
            </div>
          ) : (
            <>
              <DialogHeader className="border-b border-border/60 px-5 py-4">
                <DialogTitle className="flex items-center gap-2.5">
                  {t('adminPanel', lang)}
                  <span
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
                    title={`LabDeck v${APP_VERSION}`}
                  >
                    v{APP_VERSION}
                  </span>
                </DialogTitle>
                <DialogDescription className="sr-only">{t('adminPanel', lang)}</DialogDescription>
              </DialogHeader>

              {/* toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-3">
                {dirty && (
                  <span className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t('saveFirst', lang)}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJson} disabled={!draft}>
                    <Download className="h-4 w-4" />
                    {t('exportJson', lang)}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => fileRef.current?.click()}
                    disabled={!draft}
                  >
                    <Upload className="h-4 w-4" />
                    {t('importJson', lang)}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importJson(f);
                      e.target.value = '';
                    }}
                  />
                  <Button size="sm" className="gap-1.5" onClick={save} disabled={!draft || saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t('saving', lang) : t('save', lang)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('closePanel', lang)}
                    onClick={() => requestClose(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* scrollable editor */}
              <div className="nice-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {draft && (
                  <>
                    {/* general */}
                    <section className="rounded-xl border border-border/60 p-4">
                      <h3 className="mb-3 text-sm font-semibold">{t('general', lang)}</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <LabeledInput label={t('titleBg', lang)} value={draft.title.bg} onChange={(v) => patchTitle('bg', v)} />
                        <LabeledInput label={t('titleEn', lang)} value={draft.title.en} onChange={(v) => patchTitle('en', v)} />
                        <LabeledInput
                          label={t('subtitleBg', lang)}
                          value={draft.subtitle?.bg ?? ''}
                          onChange={(v) => patchSubtitle('bg', v)}
                        />
                        <LabeledInput
                          label={t('subtitleEn', lang)}
                          value={draft.subtitle?.en ?? ''}
                          onChange={(v) => patchSubtitle('en', v)}
                        />
                      </div>

                      <Separator className="my-4" />

                      {/* hero visibility toggles */}
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-muted/30 px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{t('showHero', lang)}</p>
                            <p className="text-xs text-muted-foreground">{t('showHeroHint', lang)}</p>
                          </div>
                          <Switch
                            checked={draft.hero?.show !== false}
                            onCheckedChange={(v) => patchHero({ show: v })}
                            aria-label={t('showHero', lang)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-muted/30 px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{t('showClock', lang)}</p>
                            <p className="text-xs text-muted-foreground">{t('showClockHint', lang)}</p>
                          </div>
                          <Switch
                            checked={draft.hero?.showClock !== false}
                            onCheckedChange={(v) => patchHero({ showClock: v })}
                            aria-label={t('showClock', lang)}
                          />
                        </div>
                      </div>

                      {/* external links */}
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <LabeledInput
                          label={t('githubUrl', lang)}
                          value={draft.links?.github ?? ''}
                          placeholder="https://github.com/fedya-dev"
                          onChange={(v) => patchLinks({ github: v })}
                          hint={t('linkHint', lang)}
                        />
                        <LabeledInput
                          label={t('websiteUrl', lang)}
                          value={draft.links?.website ?? ''}
                          placeholder="https://serafiev.com/"
                          onChange={(v) => patchLinks({ website: v })}
                          hint={t('linkHint', lang)}
                        />
                      </div>
                    </section>

                    {/* sections */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">{t('sections', lang)}</h3>

                      {draft.sections.map((section, sIdx) => (
                        <Collapsible
                          key={section.id}
                          defaultOpen={sIdx === 0}
                          className="rounded-xl border border-border/60"
                        >
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <span className="text-lg" aria-hidden="true">
                              {section.icon}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {section.name.bg} · {section.name.en}
                              <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                                ({section.services.length})
                              </span>
                            </span>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              aria-label={t('moveUp', lang)}
                              disabled={sIdx === 0}
                              onClick={() => setDraft((d) => d ? { ...d, sections: move(d.sections, sIdx, -1) } : d)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              aria-label={t('moveDown', lang)}
                              disabled={sIdx === draft.sections.length - 1}
                              onClick={() => setDraft((d) => d ? { ...d, sections: move(d.sections, sIdx, 1) } : d)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              aria-label={t('deleteSection', lang)}
                              onClick={() => setPendingDelete({ kind: 'section', sectionIdx: sIdx })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                {t('edit', lang)}
                              </Button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent className="border-t border-border/50 px-3 py-3">
                            {/* section fields */}
                            <div className="flex items-end gap-2">
                              <EmojiPicker
                                value={section.icon ?? ''}
                                onChange={(v) => patchSection(sIdx, { icon: v })}
                              />
                              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                                <LabeledInput
                                  label={t('sectionNameBg', lang)}
                                  value={section.name.bg}
                                  onChange={(v) => patchSection(sIdx, { name: { ...section.name, bg: v } })}
                                />
                                <LabeledInput
                                  label={t('sectionNameEn', lang)}
                                  value={section.name.en}
                                  onChange={(v) => patchSection(sIdx, { name: { ...section.name, en: v } })}
                                />
                              </div>
                            </div>

                            <Separator className="my-3" />

                            {/* services */}
                            <div className="space-y-3">
                              {section.services.map((svc, vIdx) => (
                                <div key={svc.id} className="rounded-lg border border-border/50 bg-muted/30 p-3">
                                  <div className="mb-2 flex items-center gap-1">
                                    <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
                                      {svc.name.bg || svc.name.en || svc.id}
                                    </span>
                                    <Button
                                      variant="ghost" size="icon" className="h-6.5 w-6.5"
                                      aria-label={t('moveUp', lang)}
                                      disabled={vIdx === 0}
                                      onClick={() =>
                                        setDraft((d) =>
                                          d
                                            ? {
                                                ...d,
                                                sections: d.sections.map((s, i) =>
                                                  i === sIdx ? { ...s, services: move(s.services, vIdx, -1) } : s
                                                ),
                                              }
                                            : d
                                        )
                                      }
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon" className="h-6.5 w-6.5"
                                      aria-label={t('moveDown', lang)}
                                      disabled={vIdx === section.services.length - 1}
                                      onClick={() =>
                                        setDraft((d) =>
                                          d
                                            ? {
                                                ...d,
                                                sections: d.sections.map((s, i) =>
                                                  i === sIdx ? { ...s, services: move(s.services, vIdx, 1) } : s
                                                ),
                                              }
                                            : d
                                        )
                                      }
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-6.5 w-6.5 text-destructive hover:text-destructive"
                                      aria-label={t('deleteService', lang)}
                                      onClick={() => setPendingDelete({ kind: 'service', sectionIdx: sIdx, serviceIdx: vIdx })}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <LabeledInput
                                      label={t('serviceNameBg', lang)}
                                      value={svc.name.bg}
                                      onChange={(v) => patchService(sIdx, vIdx, { name: { ...svc.name, bg: v } })}
                                    />
                                    <LabeledInput
                                      label={t('serviceNameEn', lang)}
                                      value={svc.name.en}
                                      onChange={(v) => patchService(sIdx, vIdx, { name: { ...svc.name, en: v } })}
                                    />
                                    <LabeledInput
                                      label={t('serviceDescBg', lang)}
                                      value={svc.description?.bg ?? ''}
                                      onChange={(v) =>
                                        patchService(sIdx, vIdx, {
                                          description: { ...(svc.description ?? { bg: '', en: '' }), bg: v },
                                        })
                                      }
                                    />
                                    <LabeledInput
                                      label={t('serviceDescEn', lang)}
                                      value={svc.description?.en ?? ''}
                                      onChange={(v) =>
                                        patchService(sIdx, vIdx, {
                                          description: { ...(svc.description ?? { bg: '', en: '' }), en: v },
                                        })
                                      }
                                    />
                                    <LabeledInput
                                      label={t('serviceUrl', lang)}
                                      value={svc.url}
                                      placeholder={t('serviceUrlHint', lang)}
                                      onChange={(v) => patchService(sIdx, vIdx, { url: v })}
                                    />
                                    <LabeledInput
                                      label={t('serviceIcon', lang)}
                                      value={svc.icon ?? ''}
                                      placeholder={t('serviceIconHint', lang)}
                                      onChange={(v) => patchService(sIdx, vIdx, { icon: v })}
                                    />
                                  </div>
                                </div>
                              ))}

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-1.5 border-dashed"
                                onClick={() => addService(sIdx)}
                              >
                                <Plus className="h-4 w-4" />
                                {t('addService', lang)}
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}

                      <Button variant="outline" className="w-full gap-1.5 border-dashed" onClick={addSection}>
                        <Plus className="h-4 w-4" />
                        {t('addSection', lang)}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete', lang)}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === 'section'
                ? t('deleteConfirmSection', lang)
                : t('deleteConfirmService', lang)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmPendingDelete}
            >
              {t('yesDelete', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* unsaved changes on close */}
      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unsavedTitle', lang)}</AlertDialogTitle>
            <AlertDialogDescription>{t('unsavedWarn', lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setConfirmClose(false);
                onOpenChange(false);
              }}
            >
              {t('discard', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
