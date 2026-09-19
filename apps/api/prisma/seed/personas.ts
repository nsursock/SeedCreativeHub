import type { BehavioralPersona, BehavioralPersonaId, FollowGraphConfig } from "./types.js";

/**
 * Latent behavioral segments for the follow / interest / contact graph.
 * These are seeded patterns for demo + future Research Lab — not claims about real psychology.
 */
export const BEHAVIORAL_PERSONAS: Record<BehavioralPersonaId, BehavioralPersona> = {
  photo_explorer: {
    id: "photo_explorer",
    description: "Prefers photography; secondary film; moderate follows.",
    followTargets: [
      { discipline: "photography", weight: 0.7 },
      { discipline: "film", weight: 0.2 },
      { discipline: "*", weight: 0.1 },
    ],
    followCount: { min: 12, max: 24 },
    opportunityInterestProbability: 0.25,
    contactProbability: 0.15,
    viewMultiplier: 1,
  },
  music_explorer: {
    id: "music_explorer",
    description: "Prefers music; secondary writing.",
    followTargets: [
      { discipline: "music", weight: 0.7 },
      { discipline: "writing", weight: 0.15 },
      { discipline: "*", weight: 0.15 },
    ],
    followCount: { min: 12, max: 24 },
    opportunityInterestProbability: 0.3,
    contactProbability: 0.2,
    viewMultiplier: 1,
  },
  cross_discipline_collaborator: {
    id: "cross_discipline_collaborator",
    description: "Broad follows; high opportunity interest and contacts.",
    followTargets: [
      { discipline: "music", weight: 0.25 },
      { discipline: "photography", weight: 0.25 },
      { discipline: "film", weight: 0.25 },
      { discipline: "writing", weight: 0.25 },
    ],
    followCount: { min: 20, max: 35 },
    opportunityInterestProbability: 0.75,
    contactProbability: 0.55,
    viewMultiplier: 1.2,
  },
  hub_night_regular: {
    id: "hub_night_regular",
    description: "Beirut / Hub Night affinity; local organizers and creators.",
    followTargets: [
      { discipline: "music", weight: 0.3 },
      { discipline: "photography", weight: 0.3 },
      { discipline: "film", weight: 0.2 },
      { discipline: "writing", weight: 0.2 },
    ],
    cityAffinity: [{ city: "beirut", boost: 2.5 }],
    preferHubNightOrganizers: true,
    followCount: { min: 14, max: 28 },
    opportunityInterestProbability: 0.45,
    contactProbability: 0.35,
    viewMultiplier: 1.1,
  },
  lurker: {
    id: "lurker",
    description: "Very few follows; disproportionately high work views.",
    followTargets: [
      { discipline: "*", weight: 1 },
    ],
    followCount: { min: 1, max: 4 },
    opportunityInterestProbability: 0.05,
    contactProbability: 0.05,
    viewMultiplier: 4,
  },
};

/** Staging follow-graph targets. */
export const FOLLOW_GRAPH_CONFIG: FollowGraphConfig = {
  targetFollowCount: 1000,
  rngSeed: 20260901,
  // Pending/unclaimed (e.g. maya_k) are not followable until claimed.
  sceneAnchorHandles: [
    "rami_beats",
    "elio_noir",
    "karim_film",
    "noura_lens",
    "sora_keys",
    "sofia_cut",
    "lina_writes",
  ],
};

export function getPersona(id: BehavioralPersonaId): BehavioralPersona {
  return BEHAVIORAL_PERSONAS[id];
}
