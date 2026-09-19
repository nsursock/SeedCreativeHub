/** Shared entity shapes + formatters for directory tables/grids. */

import { cityLabel as formatCity } from "@creative-hub/shared";

export type CreatorRow = {
  id: string;
  handle: string;
  displayName: string;
  city?: string | null;
  claimStatus: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  isFounding?: boolean;
  worksCount?: number;
  availability?: string | null;
  disciplines?: Array<{ slug: string; nameEn?: string }>;
};

export type WorkRow = {
  id: string;
  slug: string;
  title: string;
  type: "text" | "image" | "audio" | "video" | string;
  publishedAt?: string | null;
  viewCount?: number;
  profile: { handle: string; displayName: string };
  primaryDiscipline?: { slug: string; nameEn: string } | null;
  media: Array<{ publicUrl?: string | null; externalUrl?: string | null }>;
};

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  startsAt: string;
  endsAt?: string | null;
  venue?: string | null;
  city?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  isHubNight: boolean;
  capacity?: number | null;
};

export type CollabRow = {
  id: string;
  slug: string;
  title: string;
  location?: string | null;
  discipline?: string | null;
  remoteMode?: string | null;
  compensationStatus?: string | null;
  deadline?: string | null;
  interestCount?: number;
  imageUrl?: string | null;
  roles?: string | null;
};

export function dayOf(iso: string) {
  return new Date(iso).getDate().toString().padStart(2, "0");
}

export function monthOf(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { month: "short" });
}

export function shortDate(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function timeOf(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function labelOf(value?: string | null) {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

/** Pretty-print a city slug stored on profiles/events. */
export function cityLabel(slug?: string | null, locale = "en") {
  return formatCity(slug, locale);
}

export function payBadgeClass(status?: string | null) {
  if (status === "paid") return "badge-success";
  if (status === "unpaid" || status === "volunteer") return "badge-warning";
  return "badge-outline";
}
