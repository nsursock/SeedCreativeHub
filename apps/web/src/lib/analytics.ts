/** Browser analytics — Statsman custom events + optional Sentry hook. */

declare global {
  interface Window {
    statsman?: {
      track: (event: string, props?: Record<string, string | number | boolean>) => void;
    };
  }
}

export function initClientObservability() {
  const sentry = import.meta.env.VITE_PUBLIC_SENTRY_DSN ?? "";
  if (sentry) console.info("[observability] Sentry DSN present");
}

/**
 * Product events for Statsman. Never pass emails, passwords, tokens, or message bodies.
 * Automatic pageview / engagement / scroll / outbound come from tracker.js.
 */
export function track(event: string, props?: Record<string, string | number | boolean>) {
  if (import.meta.env.DEV) console.info("[product]", event, props ?? {});
  try {
    window.statsman?.track(event, props);
  } catch {
    /* tracker optional / blocked */
  }
}
