#!/usr/bin/env node
/**
 * Verify staging secrets exist without printing values.
 * Usage: node scripts/with-env.mjs .env.staging -- node scripts/staging-check.mjs
 */
import { databaseUrlLooksConfigured, resolveDatabaseUrl } from "./db-url.mjs";

const missing = [];
const weak = [];

const password = (
  process.env.DATABASE_PASSWORD ??
  process.env.SUPABASE_DB_PASSWORD ??
  ""
).trim();
const dbUrl = resolveDatabaseUrl(process.env);

if (!password && !databaseUrlLooksConfigured((process.env.DATABASE_URL ?? "").trim())) {
  missing.push("DATABASE_PASSWORD");
}
if (!dbUrl || !databaseUrlLooksConfigured(dbUrl)) {
  weak.push("DATABASE_URL");
}

const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
if (!supabaseUrl) missing.push("SUPABASE_URL");
else if (supabaseUrl.includes("YOUR_") || supabaseUrl.includes("your-")) weak.push("SUPABASE_URL");

const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? "").trim();
if (!bucket) missing.push("SUPABASE_STORAGE_BUCKET");
else if (bucket !== "media") {
  console.warn(`Note: SUPABASE_STORAGE_BUCKET=${bucket} (expected media for MVP).`);
}

const secret =
  (process.env.SUPABASE_SECRET_KEY ?? "").trim() ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!secret) missing.push("SUPABASE_SECRET_KEY");
else if (secret.includes("YOUR_") || secret.includes("your-") || secret.includes("change-me")) {
  weak.push("SUPABASE_SECRET_KEY");
}

if (dbUrl.includes("6543")) {
  console.warn(
    "Note: DATABASE_URL uses pooler :6543 (transaction). Session pooler :5432 is usually better for migrate.",
  );
}

if (missing.length || weak.length) {
  if (missing.length) console.error("Missing:", missing.join(", "));
  if (weak.length) console.error("Placeholder/incomplete:", weak.join(", "));
  process.exit(1);
}

console.log("Staging secrets present (values not shown).");
console.log("Target schema: creative_hub · bucket: media · project: My Stuff");
console.log("DATABASE_URL assembled from connection template + DATABASE_PASSWORD");
console.log("Next: pnpm db:migrate:staging  (no seed, no auth)");
