import {
  LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  localeDir,
  resolveMarketScope,
  citiesForMarket,
  type Locale,
  type MarketScope,
  type CitySlug,
} from "@creative-hub/shared";
import { readStoredTheme } from "./themes";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";
import he from "../messages/he.json";
import lebanonEn from "../messages/markets/lebanon/en.json";
import lebanonFr from "../messages/markets/lebanon/fr.json";
import lebanonAr from "../messages/markets/lebanon/ar.json";
import lebanonHe from "../messages/markets/lebanon/he.json";

const catalogs: Record<Locale, typeof en> = { en, fr, ar, he };

const lebanonOverlays: Record<Locale, Record<string, unknown>> = {
  en: lebanonEn,
  fr: lebanonFr,
  ar: lebanonAr,
  he: lebanonHe,
};

export type Messages = typeof en;

export { LOCALES, DEFAULT_LOCALE, isLocale, localeDir, citiesForMarket };
export type { Locale, MarketScope, CitySlug };

export function resolveHubMarket(): MarketScope {
  return resolveMarketScope(import.meta.env.VITE_HUB_MARKET, {
    isProduction: import.meta.env.PROD,
  });
}

function deepMerge<T extends Record<string, unknown>>(base: T, overlay: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const prev = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      out[key] = deepMerge(prev as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

export function getMessages(locale: Locale): Messages {
  const base = catalogs[locale] ?? catalogs.en;
  const market = resolveHubMarket();
  if (market !== "lebanon") return base;
  return deepMerge(base as unknown as Record<string, unknown>, lebanonOverlays[locale] ?? lebanonOverlays.en) as Messages;
}

export function marketCities(): readonly CitySlug[] {
  return citiesForMarket(resolveHubMarket());
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
  document.documentElement.dataset.market = resolveHubMarket();
}

/** English-only for now — ignore stored / browser locale. */
export function detectLocale(): Locale {
  return DEFAULT_LOCALE;
}

export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  return `/${locale}${clean ? `/${clean}` : ""}`;
}
