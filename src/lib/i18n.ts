import type { Lang, LocalizedText } from './types';

/** UI string dictionary. Every label the interface shows lives here. */

export const LANGS: Lang[] = ['bg', 'en'];

export const LANG_LABEL: Record<Lang, string> = {
  bg: 'БГ',
  en: 'EN',
};

export function pick(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return text[lang] || text.bg || text.en || '';
}

export const dict = {
  // header
  admin: { bg: 'Админ', en: 'Admin' },
  adminPanel: { bg: 'Админ панел', en: 'Admin panel' },
  theme: { bg: 'Тема', en: 'Theme' },
  language: { bg: 'Език', en: 'Language' },
  openMenu: { bg: 'Отвори меню', en: 'Open menu' },

  // hero / widgets
  goodMorning: { bg: 'Добро утро', en: 'Good morning' },
  goodAfternoon: { bg: 'Добър ден', en: 'Good afternoon' },
  goodEvening: { bg: 'Добър вечер', en: 'Good evening' },
  goodNight: { bg: 'Лека нощ', en: 'Good night' },
  sectionsCount: { bg: 'секции', en: 'sections' },
  servicesCount: { bg: 'услуги', en: 'services' },

  // service card
  openService: { bg: 'Отвори услугата', en: 'Open service' },
  noServices: { bg: 'Няма услуги в тази секция', en: 'No services in this section' },
  loadingConfig: { bg: 'Зареждане…', en: 'Loading…' },
  configError: {
    bg: 'Грешка при зареждане на конфигурацията.',
    en: 'Failed to load the configuration.',
  },

  // footer
  selfHosted: { bg: 'Самостоятелно хостване', en: 'Self-hosted' },
  footerHint: {
    bg: 'Управлявай услугите от админ панела (иконата зъбно колело).',
    en: 'Manage your services from the admin panel (the gear icon).',
  },

  // admin — auth
  adminLogin: { bg: 'Вход за админ панела', en: 'Admin login' },
  adminLoginHint: {
    bg: 'Този сървър е защитен с парола (ADMIN_PASSWORD).',
    en: 'This server is protected with a password (ADMIN_PASSWORD).',
  },
  password: { bg: 'Парола', en: 'Password' },
  login: { bg: 'Вход', en: 'Sign in' },
  wrongPassword: { bg: 'Грешна парола.', en: 'Wrong password.' },
  authDisabled: {
    bg: 'Защитата с парола е изключена (ADMIN_PASSWORD не е зададен).',
    en: 'Password protection is off (ADMIN_PASSWORD is not set).',
  },

  // admin — toolbar
  save: { bg: 'Запис', en: 'Save' },
  saving: { bg: 'Записване…', en: 'Saving…' },
  saved: { bg: 'Конфигурацията е записана.', en: 'Configuration saved.' },
  exportJson: { bg: 'Експорт', en: 'Export' },
  importJson: { bg: 'Импорт', en: 'Import' },
  imported: {
    bg: 'Файлът е зареден в редактора. Натисни „Запис“, за да стане постоянен.',
    en: 'File loaded into the editor. Press “Save” to make it permanent.',
  },
  importError: {
    bg: 'Невалиден конфигурационен файл.',
    en: 'Invalid configuration file.',
  },
  saveError: {
    bg: 'Записът не се получи — отвори конзолата (F12) за детайли.',
    en: 'Save failed — open the browser console (F12) for details.',
  },
  closePanel: { bg: 'Затваряне', en: 'Close panel' },
  unsavedWarn: {
    bg: 'Имаш незапазени промени. Излизането ще ги загуби.',
    en: 'You have unsaved changes. Closing will discard them.',
  },
  unsavedTitle: { bg: 'Незапазени промени', en: 'Unsaved changes' },
  discard: { bg: 'Изход без запис', en: 'Discard changes' },

  // admin — sections & services
  sections: { bg: 'Секции', en: 'Sections' },
  addSection: { bg: 'Нова секция', en: 'Add section' },
  addService: { bg: 'Нова услуга', en: 'Add service' },
  deleteSection: { bg: 'Изтриване на секцията', en: 'Delete section' },
  deleteService: { bg: 'Изтриване на услугата', en: 'Delete service' },
  deleteConfirmSection: {
    bg: 'Наистина ли искаш да изтриеш тази секция заедно с всичките ѝ услуги?',
    en: 'Really delete this section together with all of its services?',
  },
  deleteConfirmService: {
    bg: 'Наистина ли искаш да изтриеш тази услуга?',
    en: 'Really delete this service?',
  },
  sectionNameBg: { bg: 'Име (БГ)', en: 'Name (BG)' },
  sectionNameEn: { bg: 'Име (EN)', en: 'Name (EN)' },
  sectionIcon: { bg: 'Икона (емоджи)', en: 'Icon (emoji)' },
  serviceNameBg: { bg: 'Име (БГ)', en: 'Name (BG)' },
  serviceNameEn: { bg: 'Име (EN)', en: 'Name (EN)' },
  serviceDescBg: { bg: 'Описание (БГ)', en: 'Description (BG)' },
  serviceDescEn: { bg: 'Описание (EN)', en: 'Description (EN)' },
  serviceUrl: { bg: 'URL адрес', en: 'URL' },
  serviceUrlHint: {
    bg: 'Напр. http://192.168.1.10:8006',
    en: 'e.g. http://192.168.1.10:8006',
  },
  serviceIcon: { bg: 'Икона (по избор)', en: 'Icon (optional)' },
  serviceIconHint: {
    bg: 'Празно = автоматично извличане на favicon',
    en: 'Empty = favicon is fetched automatically',
  },
  moveUp: { bg: 'Нагоре', en: 'Move up' },
  moveDown: { bg: 'Надолу', en: 'Move down' },
  edit: { bg: 'Редакция', en: 'Edit' },
  delete: { bg: 'Изтрий', en: 'Delete' },
  cancel: { bg: 'Отказ', en: 'Cancel' },
  yesDelete: { bg: 'Да, изтрий', en: 'Yes, delete' },
  emojiPick: { bg: 'Избери емоджи', en: 'Pick an emoji' },
  invalidUrl: {
    bg: 'URL адресът трябва да започва с http:// или https://',
    en: 'The URL must start with http:// or https://',
  },
  titleBg: { bg: 'Заглавие (БГ)', en: 'Title (BG)' },
  titleEn: { bg: 'Заглавие (EN)', en: 'Title (EN)' },
  subtitleBg: { bg: 'Подзаглавие (БГ)', en: 'Subtitle (BG)' },
  subtitleEn: { bg: 'Подзаглавие (EN)', en: 'Subtitle (EN)' },
  general: { bg: 'Общи', en: 'General' },
  showHero: { bg: 'Горна секция', en: 'Hero section' },
  showHeroHint: {
    bg: 'Приветствието, часовникът и броячите над секциите.',
    en: 'The greeting, clock and counters above the sections.',
  },
  showClock: { bg: 'Голям часовник', en: 'Big clock' },
  showClockHint: {
    bg: 'Само циферблатът — останалото в секцията остава.',
    en: 'Just the dial — the rest of the section stays.',
  },
  githubUrl: { bg: 'GitHub линк (икона в хедъра)', en: 'GitHub link (icon in header)' },
  websiteUrl: { bg: 'Личен сайт (икона долу)', en: 'Personal site (icon in footer)' },
  linkHint: { bg: 'Празно = иконата не се показва', en: 'Empty = the icon is hidden' },
  visitSite: { bg: 'Отвори сайта', en: 'Visit site' },
  saveFirst: {
    bg: 'Имаш незапазени промени — натисни „Запис“ в лентата отгоре.',
    en: 'You have unsaved changes — press “Save” in the toolbar above.',
  },

  // themes (names shown in the switcher)
  themeMidnight: { bg: 'Полунощ', en: 'Midnight' },
  themeNeon: { bg: 'Неон кибер', en: 'Neon Cyber' },
  themeAurora: { bg: 'Аврора', en: 'Aurora' },
  themeNordic: { bg: 'Нордик светла', en: 'Nordic Light' },
  themePaper: { bg: 'Хартия', en: 'Paper' },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}
