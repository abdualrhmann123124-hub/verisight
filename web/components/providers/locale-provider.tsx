"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_META,
  type Locale,
} from "@/lib/i18n/config";
import { ar } from "@/lib/i18n/dictionaries/ar";
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Locale root.
 *
 * The server reads the locale cookie and renders `lang`, `dir`, and all copy
 * for that locale, then passes it here as `initialLocale`. Seeding state from
 * that prop means the first client render matches the server HTML exactly —
 * no hydration mismatch, and no post-mount swap where an Arabic reader would
 * see a frame of English before it corrected itself. This provider owns the
 * value from hydration onward, writing the cookie back when it changes.
 */
export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    // A year, path-scoped to the whole site. `SameSite=Lax` is enough: this
    // is a display preference, not anything security-relevant.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  // Keep the document attributes in step. `dir` drives every logical CSS
  // property in the app, so this single line is what mirrors the layout.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = LOCALE_META[locale].dir;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: LOCALE_META[locale].dir,
      t: DICTIONARIES[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the active locale and its dictionary. */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within <LocaleProvider>");
  return context;
}

/**
 * Substitutes `{name}` placeholders.
 *
 * Kept deliberately small — the alternative is a full ICU message formatter,
 * which this app has no need for: there is no pluralisation or gendered
 * agreement in the copy, only simple value insertion.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
