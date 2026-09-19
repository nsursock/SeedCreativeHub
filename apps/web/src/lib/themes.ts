/** ScifiUI themes available in Creative Hub. Keep in sync with @scifiui/core themes.css.
 *  Note: `seed-hub` is intentionally excluded — spec forbids it as a product theme. */

export const THEME_IDS = [
  "retrowave",
  "synthwave84",
  "fiesta",
  "goldenTwilight",
  "solarizedDark",
  "ghibli",
  "dawn",
  "cottonCandy",
  "brightContrasts",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_META: Record<ThemeId, { label: string }> = {
  retrowave: { label: "Retrowave" },
  synthwave84: { label: "Synthwave '84" },
  fiesta: { label: "Fiesta" },
  goldenTwilight: { label: "Golden Twilight" },
  solarizedDark: { label: "Solarized Dark" },
  ghibli: { label: "Ghibli" },
  dawn: { label: "Dawn" },
  cottonCandy: { label: "Cotton Candy" },
  brightContrasts: { label: "Bright Contrasts" },
};

export const DEFAULT_THEME: ThemeId = "retrowave";
export const THEME_STORAGE_KEY = "creative-hub-theme";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return Boolean(value && (THEME_IDS as readonly string[]).includes(value));
}

export function readStoredTheme(): ThemeId {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode / blocked storage */
  }
  document.documentElement.dispatchEvent(new CustomEvent("hub:theme", { detail: { theme } }));
}
