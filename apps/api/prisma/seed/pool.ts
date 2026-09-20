/** Run async work over items with a fixed concurrency limit (cuts remote RTT wait). */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

export function seedConcurrency(fallback = 8): number {
  const raw = process.env.SEED_CONCURRENCY;
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 16) : fallback;
}

export async function timedPhase<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  console.log(`[seed] → ${name}`);
  try {
    return await fn();
  } finally {
    console.log(`[seed] ← ${name} ${Date.now() - t0}ms`);
  }
}
