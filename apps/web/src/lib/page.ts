import { get } from "svelte/store";
import { getMessages, type Locale, type Messages } from "./i18n";
import { locale as localeStore } from "./stores";

/** Resolve locale + messages for route components (props optional). */
export function usePageLocale(propsLocale?: Locale): { locale: Locale; messages: Messages } {
  const locale = propsLocale ?? get(localeStore);
  return { locale, messages: getMessages(locale) };
}
