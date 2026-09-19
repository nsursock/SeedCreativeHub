export const MARKET_SCOPES = ["lebanon", "worldwide"] as const;
export type MarketScope = (typeof MARKET_SCOPES)[number];

export function isMarketScope(value: string): value is MarketScope {
  return (MARKET_SCOPES as readonly string[]).includes(value);
}

/**
 * Resolve market from an explicit env value, falling back by environment.
 * Local / non-prod → lebanon · production → worldwide.
 */
export function resolveMarketScope(
  raw: string | undefined | null,
  opts: { isProduction: boolean },
): MarketScope {
  const trimmed = (raw ?? "").trim().toLowerCase();
  if (isMarketScope(trimmed)) return trimmed;
  return opts.isProduction ? "worldwide" : "lebanon";
}

export function defaultCountryForMarket(market: MarketScope): string {
  return market === "lebanon" ? "Lebanon" : "";
}
