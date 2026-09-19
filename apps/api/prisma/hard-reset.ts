/**
 * Hard reset for multi-schema setups.
 * `prisma migrate reset` only drops `creative_hub`, leaving public leftovers /
 * public._prisma_migrations — later seed then fails with P2021.
 *
 * Leaves a migrated empty DB (no seed). Seed separately:
 *   pnpm db:seed:smoke | pnpm db:seed:normal
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sql = join(root, "hard-reset.sql");

console.log("Hard-resetting database (creative_hub + public leftovers)…");
execSync(`pnpm exec prisma db execute --file "${sql}" --schema prisma/schema.prisma`, {
  stdio: "inherit",
  cwd: join(root, ".."),
});
execSync("pnpm exec prisma migrate deploy", { stdio: "inherit", cwd: join(root, "..") });
console.log("Hard reset complete (empty DB). Seed with: pnpm db:seed:smoke | pnpm db:seed:normal");
