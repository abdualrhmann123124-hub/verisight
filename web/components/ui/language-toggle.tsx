"use client";

import { Languages } from "lucide-react";
import { useCallback } from "react";

import { useLocale } from "@/components/providers/locale-provider";
import { LOCALE_META } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Language switch.
 *
 * A two-state toggle rather than a dropdown: with exactly two locales a menu
 * costs an extra click and a focus trap for no benefit. The label always
 * shows the language you would switch *to*, in that language's own script,
 * which is the convention that survives not being able to read the current one.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "en" ? "ar" : "en";

  const toggle = useCallback(() => setLocale(next), [next, setLocale]);

  return (
    <button
      type="button"
      onClick={toggle}
      // Named in English regardless of locale so the control is findable in
      // an accessibility tree that a screen reader may be reading in either.
      aria-label={`Switch language to ${LOCALE_META[next].label}`}
      title={`Switch language to ${LOCALE_META[next].label}`}
      className={cn(
        "inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 px-3",
        "rounded-lg border border-line bg-surface-raised text-ink-muted",
        "transition-[background-color,border-color,color] duration-200",
        "ease-[var(--ease-out-expo)]",
        "hover:border-line-strong hover:bg-surface-overlay hover:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "active:scale-[0.96]",
        className,
      )}
    >
      <Languages className="size-4 shrink-0" aria-hidden="true" />
      {/* The target language, written in its own script. */}
      <span
        className="text-body-sm font-medium"
        // Pin direction so the Arabic label is not reordered when it sits
        // inside an English layout, or vice versa.
        dir={LOCALE_META[next].dir}
      >
        {LOCALE_META[next].nativeLabel}
      </span>
    </button>
  );
}
