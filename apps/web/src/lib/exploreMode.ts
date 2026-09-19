import { writable } from "svelte/store";

export const EXPLORE_MODES = [
  {
    id: "editorial",
    label: "Editorial",
    blurb: "Curated magazine of what matters this week.",
  },
  {
    id: "story",
    label: "Scene story",
    blurb: "One narrative arc across people, work, and IRL.",
  },
  {
    id: "pulse",
    label: "Live pulse",
    blurb: "Cross-entity activity stream.",
  },
  {
    id: "lens",
    label: "City / craft",
    blurb: "Compose the scene through a place or discipline.",
  },
  {
    id: "match",
    label: "Matchboard",
    blurb: "Open needs paired with people ready to collab.",
  },
] as const;

export type ExploreModeId = (typeof EXPLORE_MODES)[number]["id"];

function readInitial(): ExploreModeId {
  try {
    const v = localStorage.getItem("hub-explore-mode");
    if (EXPLORE_MODES.some((m) => m.id === v)) return v as ExploreModeId;
  } catch {
    /* ignore */
  }
  return "editorial";
}

export const exploreMode = writable<ExploreModeId>(
  typeof window !== "undefined" ? readInitial() : "editorial",
);

if (typeof window !== "undefined") {
  exploreMode.subscribe((v) => {
    try {
      localStorage.setItem("hub-explore-mode", v);
    } catch {
      /* ignore */
    }
  });
}
