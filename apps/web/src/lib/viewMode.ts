import { writable } from "svelte/store";

export type ViewMode = "grid" | "table";

function readInitial(): ViewMode {
  try {
    const v = localStorage.getItem("hub-view-mode");
    if (v === "grid" || v === "table") return v;
  } catch {
    /* ignore */
  }
  return "grid";
}

/** Shared across Creators / Explore / Events / Collabs. */
export const viewMode = writable<ViewMode>(typeof window !== "undefined" ? readInitial() : "grid");

if (typeof window !== "undefined") {
  viewMode.subscribe((v) => {
    try {
      localStorage.setItem("hub-view-mode", v);
    } catch {
      /* ignore */
    }
  });
}
