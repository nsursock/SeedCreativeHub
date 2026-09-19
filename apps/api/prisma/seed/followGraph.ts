import type { DisciplineSlug } from "@creative-hub/shared";
import { getPersona, FOLLOW_GRAPH_CONFIG } from "./personas.js";
import type {
  BehavioralPersonaId,
  FollowEdge,
  FollowGraphConfig,
  SeedCreatorFixture,
  SeedExplorerFixture,
} from "./types.js";

/** Mulberry32 — tiny deterministic PRNG. */
export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedDiscipline(
  rng: () => number,
  weights: { discipline: DisciplineSlug | "*"; weight: number }[],
): DisciplineSlug | "*" {
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = rng() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.discipline;
  }
  return weights[weights.length - 1]?.discipline ?? "*";
}

function primaryDiscipline(creator: SeedCreatorFixture): DisciplineSlug {
  return creator.disciplineSlugs[0] ?? "music";
}

function scoreCandidate(
  explorer: SeedExplorerFixture,
  personaId: BehavioralPersonaId,
  candidate: SeedCreatorFixture,
  hubOrganizerHandles: Set<string>,
  desired: DisciplineSlug | "*",
  rng: () => number,
): number {
  const persona = getPersona(personaId);
  let score = (candidate.sceneWeight ?? 1) + rng() * 0.3;

  if (desired === "*" || candidate.disciplineSlugs.includes(desired as DisciplineSlug)) {
    score += 2;
  } else if (desired !== "*" && primaryDiscipline(candidate) === desired) {
    score += 2;
  }

  for (const aff of persona.cityAffinity ?? []) {
    if (candidate.city === aff.city) score += aff.boost;
  }

  if (persona.preferHubNightOrganizers && hubOrganizerHandles.has(candidate.handle)) {
    score += 2;
  }

  // Slight preference for same city as explorer
  if (explorer.city && candidate.city === explorer.city) score += 0.4;

  return score;
}

export type FollowGraphInput = {
  explorers: SeedExplorerFixture[];
  /** Only claimed creators can be followed (must have User). */
  followableCreators: SeedCreatorFixture[];
  /** Handles that organize Hub Nights (from events fixtures). */
  hubOrganizerHandles?: string[];
  config?: FollowGraphConfig;
};

/**
 * Build follow edges from behavioral personas.
 * Only explorers (and optionally creators as followers later) → claimed creators.
 * Self-follows and duplicate pairs are excluded.
 */
export function buildFollowEdges(input: FollowGraphInput): FollowEdge[] {
  const config = input.config ?? FOLLOW_GRAPH_CONFIG;
  const rng = createRng(config.rngSeed);
  const hubOrganizers = new Set(input.hubOrganizerHandles ?? []);
  const followable = input.followableCreators.filter((c) => c.claimStatus === "claimed");
  const byHandle = new Map(followable.map((c) => [c.handle, c]));
  const sceneWeight = new Map(
    followable.map((c) => [c.handle, c.sceneWeight ?? 1] as const),
  );
  for (const h of config.sceneAnchorHandles) {
    sceneWeight.set(h, Math.max(sceneWeight.get(h) ?? 1, 8));
  }

  const edges: FollowEdge[] = [];
  const seen = new Set<string>();

  const add = (followerHandle: string, followingHandle: string) => {
    if (followerHandle === followingHandle) return;
    if (!byHandle.has(followingHandle)) return;
    const key = `${followerHandle}->${followingHandle}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ followerHandle, followingHandle });
  };

  const scoreWithWeight = (
    explorer: SeedExplorerFixture,
    personaId: BehavioralPersonaId,
    candidate: SeedCreatorFixture,
    desired: ReturnType<typeof pickWeightedDiscipline>,
  ) => {
    const base = scoreCandidate(explorer, personaId, candidate, hubOrganizers, desired, rng);
    return base - (candidate.sceneWeight ?? 1) + (sceneWeight.get(candidate.handle) ?? 1);
  };

  for (const explorer of input.explorers) {
    const persona = getPersona(explorer.persona);
    const span = persona.followCount.max - persona.followCount.min + 1;
    const count = Math.min(
      persona.followCount.min + Math.floor(rng() * span),
      followable.length,
    );
    const pool = [...followable];

    for (let i = 0; i < count && pool.length > 0; i++) {
      const desired = pickWeightedDiscipline(rng, persona.followTargets);
      let bestIdx = 0;
      let bestScore = -Infinity;
      for (let j = 0; j < pool.length; j++) {
        const s = scoreWithWeight(explorer, explorer.persona, pool[j]!, desired);
        if (s > bestScore) {
          bestScore = s;
          bestIdx = j;
        }
      }
      const chosen = pool.splice(bestIdx, 1)[0]!;
      add(explorer.handle, chosen.handle);
    }
  }

  // Creator→creator follows among claimed (scene density), deterministic
  const claimed = followable;
  for (let i = 0; i < claimed.length; i++) {
    const from = claimed[i]!;
    const weight = sceneWeight.get(from.handle) ?? 1;
    const followN = weight >= 8 ? 4 + Math.floor(rng() * 4) : 2 + Math.floor(rng() * 3);
    for (let n = 0; n < followN; n++) {
      const to = claimed[Math.floor(rng() * claimed.length)]!;
      add(from.handle, to.handle);
    }
  }

  // Cap toward target (POC will be well under 1000)
  if (edges.length > config.targetFollowCount) {
    return edges.slice(0, config.targetFollowCount);
  }
  return edges;
}
