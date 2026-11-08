import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'LabDeck · Домашно табло / Home Lab Dashboard',
    template: '%s · LabDeck',
  },
  description:
    'Персонализирано табло за домашна лаборатория — самостоятелно хостване, две езика, модерни теми. / A personalized home-lab dashboard — self-hosted, bilingual, modern themes.',
  keywords: ['home lab', 'dashboard', 'self-hosted', 'табло', 'домашна лаборатория', 'LabDeck'],
  icons: { icon: '/labdeck.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#15171f' },
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
  ],
};

/**
 * Applied before first paint: restores the saved theme + language from
 * localStorage so there is no flash of the wrong theme/language.
 */
const bootstrapScript = `
(function(){
  try {
    var t = localStorage.getItem('labdeck.theme');
    if (!t) t = 'midnight';
    document.documentElement.setAttribute('data-theme', t);
    var l = localStorage.getItem('labdeck.lang');
    if (!l) l = 'bg';
    document.documentElement.setAttribute('lang', l);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" data-theme="midnight" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
