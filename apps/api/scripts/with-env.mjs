#!/usr/bin/env node
/**
 * Load an env file with override, then run a command.
 * Keeps apps/api/.env (local) intact while running staging migrate/checks.
 * Assembles DATABASE_URL from DATABASE_PASSWORD when the URL still has a placeholder.
 *
 * Usage: node scripts/with-env.mjs .env.staging -- prisma migrate deploy
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDatabaseUrl } from "./db-url.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, "..");

const envFileArg = process.argv[2];
const dash = process.argv[3];
const cmd = process.argv.slice(4);

if (!envFileArg || dash !== "--" || cmd.length === 0) {
  console.error("Usage: node scripts/with-env.mjs <env-file> -- <command…>");
  process.exit(1);
}

const envPath = resolve(apiRoot, envFileArg);
if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  console.error("Copy .env.staging.example → apps/api/.env.staging and fill secrets locally.");
  process.exit(1);
}

const parsed = {};
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  parsed[key] = value;
}

const env = { ...process.env, ...parsed };
const assembled = resolveDatabaseUrl(env);
if (assembled) env.DATABASE_URL = assembled;

const result = spawnSync(cmd[0], cmd.slice(1), {
  cwd: apiRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
