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
export type CitySlug = (typeof LEBANESE_CITIES)[number];

/** Display labels for city slugs (profiles/events store the slug). */
export const CITY_LABELS: Record<
  CitySlug,
  { en: string; fr: string; ar: string; he: string }
> = {
  beirut: { en: "Beirut", fr: "Beyrouth", ar: "بيروت", he: "ביירות" },
  tripoli: { en: "Tripoli", fr: "Tripoli", ar: "طرابلس", he: "טריפולי" },
  saida: { en: "Saida", fr: "Saïda", ar: "صيدا", he: "צידון" },
  tyre: { en: "Tyre", fr: "Tyr", ar: "صور", he: "צור" },
  byblos: { en: "Byblos", fr: "Byblos", ar: "جبيل", he: "ביבלוס" },
  zahle: { en: "Zahle", fr: "Zahlé", ar: "زحلة", he: "זחלה" },
  jounieh: { en: "Jounieh", fr: "Jounieh", ar: "جونيه", he: "ג'וניה" },
  baalbek: { en: "Baalbek", fr: "Baalbek", ar: "بعلبك", he: "בעלבק" },
  nabatieh: { en: "Nabatieh", fr: "Nabatiyeh", ar: "النبطية", he: "נבטיה" },
  batroun: { en: "Batroun", fr: "Batroun", ar: "البترون", he: "בטרון" },
  diaspora: { en: "Diaspora", fr: "Diaspora", ar: "الشتات", he: "תפוצות" },
  other: { en: "Other", fr: "Autre", ar: "أخرى", he: "אחר" },
};

export function cityLabel(slug?: string | null, locale: string = "en"): string {
  if (!slug) return "—";
  const labels = CITY_LABELS[slug as CitySlug];
  if (!labels) return slug.charAt(0).toUpperCase() + slug.slice(1);
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
