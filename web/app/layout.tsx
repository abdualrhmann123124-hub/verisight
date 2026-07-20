import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans_Arabic,
  Instrument_Sans,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import { cookies } from "next/headers";

import { SkipLink } from "@/components/layout/skip-link";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALE_META } from "@/lib/i18n/config";
import { SITE } from "@/lib/site";

import "./globals.css";

/* Self-hosted by next/font: files are served from our own origin with
   `size-adjust` fallback metrics baked in, so there is no render-blocking
   request to Google and no layout shift when the face swaps in. */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/* Arabic needs its own face — Inter and Instrument Sans carry no Arabic
   glyphs, so without this the browser falls back to a system font and the
   careful type scale collapses into whatever Windows happens to pick.
   IBM Plex Sans Arabic is chosen for its neutral, technical tone, which is
   the closest match to Inter's voice on the Latin side. */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Matches --canvas per theme so mobile browser chrome blends with the page
  // instead of banding against it.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
  ],
  width: "device-width",
  initialScale: 1,
  // Deliberately omits `maximumScale`/`userScalable`: blocking pinch-zoom is
  // a WCAG 1.4.4 failure, and the tidier mobile feel it buys is not ours to
  // trade away on someone else's behalf.
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the locale on the server so `lang`, `dir`, and every translated
  // string are correct in the very first byte of HTML. Reading the cookie opts
  // this layout into dynamic rendering, which is the right trade for an app
  // whose only indexable surface is the landing page: it buys a flash-free,
  // hydration-safe RTL flip in exchange for per-request rendering.
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;
  const dir = LOCALE_META[locale].dir;

  return (
    <html
      lang={locale}
      dir={dir}
      // next-themes rewrites `data-theme` before paint; without this React
      // reports the server/client difference as a hydration error.
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${inter.variable} ${jetbrainsMono.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>
            <MotionProvider>
              {/* Mounted at the root so any page can use a tooltip without
                  remembering to wrap itself — Radix throws outright when the
                  provider is missing, so a per-page provider turns a forgotten
                  wrapper into a crashed route. One provider also shares the
                  delay timer, so neighbouring tooltips open instantly after
                  the first. */}
              <TooltipProvider>
                <SkipLink />
                {children}
              </TooltipProvider>
            </MotionProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
