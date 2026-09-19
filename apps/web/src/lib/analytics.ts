/** Browser analytics / Sentry hooks — no-ops until PUBLIC_* keys are set. */
export function initClientObservability() {
  const sentry = import.meta.env.VITE_PUBLIC_SENTRY_DSN ?? "";
  const analytics = import.meta.env.VITE_PUBLIC_ANALYTICS_KEY ?? "";
  if (sentry) console.info("[observability] Sentry DSN present");
  if (analytics) console.info("[observability] Analytics key present");
}

export function track(event: string, props?: Record<string, unknown>) {
  if (import.meta.env.DEV) console.info("[product]", event, props ?? {});
  // Wire PostHog/Plausible when VITE_PUBLIC_ANALYTICS_KEY is set.
}
