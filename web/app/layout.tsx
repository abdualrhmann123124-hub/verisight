import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Inter, JetBrains_Mono } from "next/font/google";

import { MotionProvider } from "@/components/providers/motion-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // next-themes rewrites `data-theme` before paint; without this, React
      // reports the server/client difference as a hydration error.
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <ThemeProvider>
          <MotionProvider>
            {/* Mounted at the root so any page can use a tooltip without
                remembering to wrap itself — Radix throws outright when the
                provider is missing, so a per-page provider turns a forgotten
                wrapper into a crashed route. One provider also shares the
                delay timer, so neighbouring tooltips open instantly after
                the first. */}
            <TooltipProvider>
              <a
                href="#main"
                className="sr-only rounded-lg bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
              >
                Skip to content
              </a>
              {children}
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
