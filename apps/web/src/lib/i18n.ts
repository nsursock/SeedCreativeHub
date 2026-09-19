import { LOCALES, DEFAULT_LOCALE, isLocale, localeDir, type Locale } from "@creative-hub/shared";
import { readStoredTheme } from "./themes";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";
import he from "../messages/he.json";

const catalogs: Record<Locale, typeof en> = { en, fr, ar, he };

export type Messages = typeof en;

export { LOCALES, DEFAULT_LOCALE, isLocale, localeDir };
export type { Locale };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.en;
}

export function t(messages: Messages, path: string): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${path}`);
      const fallback = path.split(".").reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object" && key in (acc as object)) {
          return (acc as Record<string, unknown>)[key];
        }
        return undefined;
      }, catalogs.en);
      return typeof fallback === "string" ? fallback : path;
    }
  }
  return typeof cur === "string" ? cur : path;
}

export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
  document.documentElement.dataset.theme = readStoredTheme();
}

/** English-only for now — ignore stored / browser locale. */
export function detectLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  return `/${locale}${clean ? `/${clean}` : ""}`;
}
