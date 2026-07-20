/**
 * Locale configuration.
 *
 * Locale is held client-side and persisted in a cookie rather than encoded in
 * the URL. VeriSight is an application, not a content site: its indexable
 * surface is one landing page, and switching language mid-analysis should not
 * throw away the report by navigating. The accessibility-critical part —
 * `lang` and `dir` on the document — is applied either way.
 */

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "verisight-locale";

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; dir: "ltr" | "rtl" }
> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
