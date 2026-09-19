import type { MarketScope } from "./market.js";

export const LOCALES = ["en", "fr", "ar", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: Locale[] = ["ar", "he"];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Only native media kinds for now (no embed/mixed). */
export const WORK_TYPES = ["text", "image", "audio", "video"] as const;
export type WorkType = (typeof WORK_TYPES)[number];

/** Phase-1 media scope: music · photos · films · writings */
export const DISCIPLINES = ["music", "photography", "film", "writing"] as const;
export type DisciplineSlug = (typeof DISCIPLINES)[number];

/** Maps each discipline to its primary work media type. */
export const DISCIPLINE_WORK_TYPE = {
  music: "audio",
  photography: "image",
  film: "video",
  writing: "text",
} as const satisfies Record<DisciplineSlug, WorkType>;

/** Lebanon-first city list (local / HUB_MARKET=lebanon). */
export const LEBANESE_CITIES = [
  "beirut",
  "tripoli",
  "saida",
  "tyre",
  "byblos",
  "zahle",
  "jounieh",
  "baalbek",
  "nabatieh",
  "batroun",
  "diaspora",
  "other",
] as const;

/**
 * Worldwide creative hubs (prod / HUB_MARKET=worldwide).
 * Includes Lebanon cities as equal peers — not a separate “home” market.
 */
export const WORLD_CITIES = [
  "amsterdam",
  "austin",
  "baalbek",
  "bangalore",
  "barcelona",
  "batroun",
  "beirut",
  "berlin",
  "buenos-aires",
  "byblos",
  "cairo",
  "cape-town",
  "chicago",
  "diaspora",
  "dubai",
  "istanbul",
  "jounieh",
  "lagos",
  "lisbon",
  "london",
  "los-angeles",
  "melbourne",
  "mexico-city",
  "miami",
  "montreal",
  "mumbai",
  "nabatieh",
  "nairobi",
  "new-york",
  "other",
  "paris",
  "remote",
  "saida",
  "sao-paulo",
  "seoul",
  "shanghai",
  "singapore",
  "sydney",
  "tokyo",
  "toronto",
  "tripoli",
  "tyre",
  "zahle",
] as const;

/** All known city slugs (validation + labels). */
export const ALL_CITIES = WORLD_CITIES;
export type CitySlug = (typeof ALL_CITIES)[number];

export function citiesForMarket(market: MarketScope): readonly CitySlug[] {
  return market === "lebanon" ? (LEBANESE_CITIES as readonly CitySlug[]) : WORLD_CITIES;
}

/** Display labels for city slugs (profiles/events store the slug). */
export const CITY_LABELS: Record<
  CitySlug,
  { en: string; fr: string; ar: string; he: string }
> = {
  amsterdam: { en: "Amsterdam", fr: "Amsterdam", ar: "أمستردام", he: "אמסטרדם" },
  austin: { en: "Austin", fr: "Austin", ar: "أوستن", he: "אוסטין" },
  baalbek: { en: "Baalbek", fr: "Baalbek", ar: "بعلبك", he: "בעלבק" },
  bangalore: { en: "Bangalore", fr: "Bangalore", ar: "بنغالور", he: "בנגלור" },
  barcelona: { en: "Barcelona", fr: "Barcelone", ar: "برشلونة", he: "ברצלונה" },
  batroun: { en: "Batroun", fr: "Batroun", ar: "البترون", he: "בטרון" },
  beirut: { en: "Beirut", fr: "Beyrouth", ar: "بيروت", he: "ביירות" },
  berlin: { en: "Berlin", fr: "Berlin", ar: "برلين", he: "ברלין" },
  "buenos-aires": { en: "Buenos Aires", fr: "Buenos Aires", ar: "بوينس آيرس", he: "בואנוס איירס" },
  byblos: { en: "Byblos", fr: "Byblos", ar: "جبيل", he: "ביבלוס" },
  cairo: { en: "Cairo", fr: "Le Caire", ar: "القاهرة", he: "קהיר" },
  "cape-town": { en: "Cape Town", fr: "Le Cap", ar: "كيب تاون", he: "קייפטאון" },
  chicago: { en: "Chicago", fr: "Chicago", ar: "شيكاغو", he: "שיקגו" },
  diaspora: { en: "Diaspora", fr: "Diaspora", ar: "الشتات", he: "תפוצות" },
  dubai: { en: "Dubai", fr: "Dubaï", ar: "دبي", he: "דובאי" },
  istanbul: { en: "Istanbul", fr: "Istanbul", ar: "إسطنبول", he: "איסטנבול" },
  jounieh: { en: "Jounieh", fr: "Jounieh", ar: "جونيه", he: "ג'וניה" },
  lagos: { en: "Lagos", fr: "Lagos", ar: "لاغوس", he: "לאגוס" },
  lisbon: { en: "Lisbon", fr: "Lisbonne", ar: "لشبونة", he: "ליסבון" },
  london: { en: "London", fr: "Londres", ar: "لندن", he: "לונדון" },
  "los-angeles": { en: "Los Angeles", fr: "Los Angeles", ar: "لوس أنجلوس", he: "לוס אנג'לס" },
  melbourne: { en: "Melbourne", fr: "Melbourne", ar: "ملبورن", he: "מלבורן" },
  "mexico-city": { en: "Mexico City", fr: "Mexico", ar: "مدينة المكسيك", he: "מקסיקו סיטי" },
  miami: { en: "Miami", fr: "Miami", ar: "ميامي", he: "מיאמי" },
  montreal: { en: "Montreal", fr: "Montréal", ar: "مونتريال", he: "מונטריאול" },
  mumbai: { en: "Mumbai", fr: "Mumbai", ar: "مومباي", he: "מומבאי" },
  nabatieh: { en: "Nabatieh", fr: "Nabatiyeh", ar: "النبطية", he: "נבטיה" },
  nairobi: { en: "Nairobi", fr: "Nairobi", ar: "نيروبي", he: "ניירובי" },
  "new-york": { en: "New York", fr: "New York", ar: "نيويورك", he: "ניו יורק" },
  other: { en: "Other", fr: "Autre", ar: "أخرى", he: "אחר" },
  paris: { en: "Paris", fr: "Paris", ar: "باريس", he: "פריז" },
  remote: { en: "Remote", fr: "À distance", ar: "عن بُعد", he: "מרחוק" },
  saida: { en: "Saida", fr: "Saïda", ar: "صيدا", he: "צידון" },
  "sao-paulo": { en: "São Paulo", fr: "São Paulo", ar: "ساو باولو", he: "סאו פאולו" },
  seoul: { en: "Seoul", fr: "Séoul", ar: "سيول", he: "סיאול" },
  shanghai: { en: "Shanghai", fr: "Shanghai", ar: "شنغهاي", he: "שנחאי" },
  singapore: { en: "Singapore", fr: "Singapour", ar: "سنغافورة", he: "סינגפור" },
  sydney: { en: "Sydney", fr: "Sydney", ar: "سيدني", he: "סידני" },
  tokyo: { en: "Tokyo", fr: "Tokyo", ar: "طوكيو", he: "טוקיו" },
  toronto: { en: "Toronto", fr: "Toronto", ar: "تورونتو", he: "טורונטו" },
  tripoli: { en: "Tripoli", fr: "Tripoli", ar: "طرابلس", he: "טריפולי" },
  tyre: { en: "Tyre", fr: "Tyr", ar: "صور", he: "צור" },
  zahle: { en: "Zahle", fr: "Zahlé", ar: "زحلة", he: "זחלה" },
};

export function cityLabel(slug?: string | null, locale: string = "en"): string {
  if (!slug) return "—";
  const labels = CITY_LABELS[slug as CitySlug];
  if (!labels) return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  const key = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : "en";
  return labels[key] ?? labels.en;
}

export const USER_ROLES = ["member", "editor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CLAIM_STATUSES = ["unclaimed", "pending", "claimed"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const WORK_STATUSES = ["draft", "published", "archived", "hidden"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const OPPORTUNITY_STATUSES = ["open", "closed", "draft"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const EVENT_STATUSES = ["draft", "published", "cancelled", "past"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const EDITORIAL_PLACEMENTS = [
  "explore_featured_creators",
  "explore_featured_works",
  "explore_upcoming_events",
  "explore_opportunities",
  "collection",
] as const;
export type EditorialPlacement = (typeof EDITORIAL_PLACEMENTS)[number];

export const NOTIFICATION_TYPES = [
  "collab_interest",
  "contact_message",
  "follow",
  "security",
  "claim",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
