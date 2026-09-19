/** Fixed epoch for deterministic dates (events, deadlines, claim expiry offsets). */
export const SEED_EPOCH = new Date("2026-09-01T12:00:00.000Z");

export function daysFromEpoch(days: number, epoch: Date = SEED_EPOCH): Date {
  return new Date(epoch.getTime() + days * 86_400_000);
}

export function hoursAfter(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

/** Default demo member password when fixtures omit one. */
export const DEFAULT_SEED_MEMBER_PASSWORD = "SeedMember123!";

export function seedEmail(handle: string): string {
  return `seed+${handle}@creativehub.local`;
}
