/**
 * Build DATABASE_URL from parts + DATABASE_PASSWORD (password never required in the URL template).
 * Password is percent-encoded for special characters.
 */
export function resolveDatabaseUrl(env = process.env) {
  const password = (env.DATABASE_PASSWORD ?? env.SUPABASE_DB_PASSWORD ?? "").trim();
  let url = (env.DATABASE_URL ?? "").trim();

  if (url) {
    if (password) {
      url = url
        .replaceAll("${DATABASE_PASSWORD}", encodeURIComponent(password))
        .replaceAll("${SUPABASE_DB_PASSWORD}", encodeURIComponent(password))
        .replaceAll("[YOUR-PASSWORD]", encodeURIComponent(password))
        .replaceAll("YOUR_DB_PASSWORD", encodeURIComponent(password));
    }
    return url;
  }

  const host = (env.DATABASE_HOST ?? "").trim();
  const port = (env.DATABASE_PORT ?? "5432").trim();
  const database = (env.DATABASE_NAME ?? "postgres").trim();
  const user = (env.DATABASE_USER ?? "").trim();
  if (!host || !user || !password) return "";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function databaseUrlLooksConfigured(url) {
  if (!url) return false;
  if (url.includes("YOUR_") || url.includes("[YOUR-PASSWORD]") || url.includes("${DATABASE_PASSWORD}")) {
    return false;
  }
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  return true;
}
