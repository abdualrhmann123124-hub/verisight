"use client";

import { useLocale } from "@/components/providers/locale-provider";

/**
 * Skip-to-content link.
 *
 * Split out of the root layout because it needs the active locale, and the
 * layout is a server component. Positioned with `start-4` rather than
 * `left-4` so it appears on the correct side once the document flips to RTL.
 */
export function SkipLink() {
  const { t } = useLocale();

  return (
    <a
      href="#main"
      className="sr-only rounded-lg bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50"
    >
      {t.common.skipToContent}
    </a>
  );
}
