import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Supabase session pooler (:5432) caps ~15 clients and is shared with other
 * services — easy to hit EMAXCONNSESSION under load. Runtime traffic should use
 * transaction mode (:6543) with pgbouncer=true.
 */
export function prismaDatabaseUrl(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    if (u.hostname.includes("pooler.supabase.com") && (u.port === "5432" || u.port === "")) {
      u.port = "6543";
    }
    if (u.hostname.includes("pooler.supabase.com")) {
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) {
        u.searchParams.set(
          "connection_limit",
          process.env.DATABASE_CONNECTION_LIMIT?.trim() || "5",
        );
      }
      if (!u.searchParams.has("pool_timeout")) {
        u.searchParams.set("pool_timeout", "20");
      }
    }
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma = new PrismaClient({
  datasources: { db: { url: prismaDatabaseUrl(env.databaseUrl) } },
});
