#!/usr/bin/env node
/**
 * Ensure Supabase Storage bucket exists (idempotent).
 * Usage: node scripts/with-env.mjs .env.staging -- node scripts/ensure-media-bucket.mjs
 * Never prints secret values.
 */
const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const key =
  (process.env.SUPABASE_SECRET_KEY ?? "").trim() ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? "media").trim() || "media";

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  apikey: key,
  "Content-Type": "application/json",
};

const listRes = await fetch(`${url}/storage/v1/bucket`, { headers });
if (!listRes.ok) {
  console.error("List buckets failed:", listRes.status, await listRes.text());
  process.exit(1);
}
const buckets = /** @type {Array<{ id: string; name: string; public?: boolean }>} */ (
  await listRes.json()
);
const existing = buckets.find((b) => b.id === bucket || b.name === bucket);
if (existing) {
  console.log(`bucket present: ${bucket} public=${Boolean(existing.public)}`);
  process.exit(0);
}

const createRes = await fetch(`${url}/storage/v1/bucket`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    id: bucket,
    name: bucket,
    public: true,
    file_size_limit: 52_428_800,
  }),
});
if (!createRes.ok) {
  console.error("Create bucket failed:", createRes.status, await createRes.text());
  process.exit(1);
}
console.log(`bucket created: ${bucket} public=true`);
