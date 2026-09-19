import { env } from "./env.js";

/** Optional Sentry init — no-op without DSN so local/VPS stays lean. */
export function initObservability() {
  if (!env.sentryDsn) {
    if (env.nodeEnv !== "production") {
      console.info("[observability] Sentry disabled (no SENTRY_DSN)");
    }
    return;
  }
  console.info("[observability] Sentry DSN configured — wire @sentry/node when deploying");
}

export function trackProductEvent(name: string, props?: Record<string, unknown>) {
  if (env.nodeEnv === "development") {
    console.info("[analytics]", name, props ?? {});
  }
}
