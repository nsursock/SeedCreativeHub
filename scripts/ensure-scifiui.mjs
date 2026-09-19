#!/usr/bin/env node
/**
 * Ensure @scifiui/core is available at ./ScifiUI (workspace path).
 * Local: symlink to ../ScifiUI when present.
 * CI/Vercel: shallow-clone nsursock/ScifiUI if missing/incomplete.
 */
import { existsSync, lstatSync, symlinkSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "ScifiUI");
const core = join(target, "packages", "core", "package.json");
const sibling = join(root, "..", "ScifiUI");
const siblingCore = join(sibling, "packages", "core", "package.json");

function removeTarget() {
  if (!existsSync(target)) return;
  rmSync(target, { recursive: true, force: true });
  console.log("[ensure-scifiui] removed incomplete", target);
}

if (existsSync(core)) {
  console.log("[ensure-scifiui] present:", target);
  process.exit(0);
}

// Broken/empty leftover (common on Vercel when an empty path was uploaded)
if (existsSync(target)) {
  try {
    const st = lstatSync(target);
    console.log(
      "[ensure-scifiui] incomplete target exists:",
      st.isSymbolicLink() ? "symlink" : st.isDirectory() ? "dir" : "other",
    );
  } catch {
    /* ignore */
  }
  removeTarget();
}

if (existsSync(siblingCore)) {
  symlinkSync(sibling, target);
  console.log("[ensure-scifiui] symlinked ScifiUI -> ../ScifiUI");
  process.exit(0);
}

console.log("[ensure-scifiui] cloning https://github.com/nsursock/ScifiUI.git …");
const r = spawnSync(
  "git",
  ["clone", "--depth", "1", "https://github.com/nsursock/ScifiUI.git", target],
  { stdio: "inherit" },
);
process.exit(r.status ?? 1);
