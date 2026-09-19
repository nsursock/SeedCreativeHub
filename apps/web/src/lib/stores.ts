import { writable } from "svelte/store";
import { gql, setCsrfToken } from "./gql";
import type { Locale } from "./i18n";
import { detectLocale } from "./i18n";

export type Me = {
  id: string;
  email: string;
  role: string;
  locale: string;
  profile?: { handle: string; displayName: string } | null;
};

export const locale = writable<Locale>(detectLocale());
export const me = writable<Me | null>(null);
export const perfLite = writable(false);
/** True after the first session probe finishes (success or failure). */
export const sessionReady = writable(false);
/** Opens the create-work drawer from AppShell (also used by /create deep link). */
export const createDrawerOpen = writable(false);

export async function refreshSession() {
  try {
    const data = await gql<{ me: Me | null; csrfToken: string | null }>(`
      query Me {
        me { id email role locale profile { handle displayName } }
        csrfToken
      }
    `);
    me.set(data.me);
    setCsrfToken(data.csrfToken);
    return data.me;
  } finally {
    sessionReady.set(true);
  }
}
