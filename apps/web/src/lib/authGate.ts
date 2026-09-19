import { push } from "svelte-spa-router";
import { localePath, type Locale } from "./i18n";

const AUTH_NEXT_KEY = "hub-auth-next";

/** Path after `/{locale}/` (no leading slash). "" = landing. */
export function routeRest(path: string): string {
  return (path || "/").replace(/^\//, "").replace(/^[a-z]{2}\/?/, "");
}

export function rememberAuthNext(absoluteHashPath: string) {
  try {
    sessionStorage.setItem(AUTH_NEXT_KEY, absoluteHashPath);
  } catch {
    /* ignore */
  }
}

/** After sign-in, return to the action the guest tried — or Explore. */
export function consumeAuthNext(locale: Locale): string {
  try {
    const next = sessionStorage.getItem(AUTH_NEXT_KEY);
    sessionStorage.removeItem(AUTH_NEXT_KEY);
    if (next && next.startsWith(`/${locale}`)) return next;
  } catch {
    /* ignore */
  }
  return localePath(locale, "explore");
}

/** Send guests to auth when they try to interact (create, follow, etc.). */
export function requireAccount(locale: Locale, currentPath?: string) {
  const path = currentPath ?? (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "");
  if (path) rememberAuthNext(path.startsWith("/") ? path : `/${path}`);
  push(localePath(locale, "auth"));
}

export function goLanding(locale: Locale) {
  push(localePath(locale, ""));
}
