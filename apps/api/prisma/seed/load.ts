import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  SeedAuditFixture,
  SeedClaimTokenFixture,
  SeedContactFixture,
  SeedCreatorFixture,
  SeedEditorialFixture,
  SeedEventFixture,
  SeedExplorerFixture,
  SeedInterestFixture,
  SeedNotificationFixture,
  SeedOpportunityFixture,
  SeedReportFixture,
  SeedWaitlistFixture,
  SeedWorkFixture,
  SeedWorkMeta,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const SEED_DATA_DIR = join(__dirname, "../../data/seed");

export function loadJson<T>(name: string): T {
  const path = join(SEED_DATA_DIR, name);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function loadJsonIfExists<T>(name: string, fallback: T): T {
  const path = join(SEED_DATA_DIR, name);
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function loadSeedFixtures() {
  return {
    creators: loadJson<SeedCreatorFixture[]>("creators.json"),
    explorers: loadJsonIfExists<SeedExplorerFixture[]>("explorers.json", []),
    works: loadJson<SeedWorkFixture[]>("works.json"),
    workMeta: loadJsonIfExists<SeedWorkMeta[]>("works.meta.json", []),
    opportunities: loadJsonIfExists<SeedOpportunityFixture[]>("opportunities.json", []),
    interests: loadJsonIfExists<SeedInterestFixture[]>("interests.json", []),
    events: loadJsonIfExists<SeedEventFixture[]>("events.json", []),
    contacts: loadJsonIfExists<SeedContactFixture[]>("contacts.json", []),
    reports: loadJsonIfExists<SeedReportFixture[]>("reports.json", []),
    waitlist: loadJsonIfExists<SeedWaitlistFixture[]>("waitlist.json", []),
    claimTokens: loadJsonIfExists<SeedClaimTokenFixture[]>("claim-tokens.json", []),
    editorial: loadJsonIfExists<SeedEditorialFixture[]>("editorial.json", []),
    notifications: loadJsonIfExists<SeedNotificationFixture[]>("notifications.json", []),
    audits: loadJsonIfExists<SeedAuditFixture[]>("audits.json", []),
  };
}

export type SeedFixtures = ReturnType<typeof loadSeedFixtures>;
