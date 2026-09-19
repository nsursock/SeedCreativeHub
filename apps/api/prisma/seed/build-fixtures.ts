/**
 * One-shot fixture builder for full staging dataset.
 * Output: apps/api/data/seed/*.json (identity source of truth).
 * Seed runtime loads JSON only — does not call this module.
 *
 * Run: node --import tsx prisma/seed/build-fixtures.ts
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../../src/lib/slug.js";
import { createRng } from "./followGraph.js";
import type {
  BehavioralPersonaId,
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
  SeedAuditFixture,
} from "./types.js";
import type { CitySlug, DisciplineSlug, WorkType } from "@creative-hub/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../data/seed");
const rng = createRng(20260901);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]!);
  }
  return out;
}
function chance(p: number) {
  return rng() < p;
}
function write(name: string, data: unknown) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`wrote ${name}`);
}

/** Skewed view counts: many low, few viral. */
function skewedViews(): number {
  const r = rng();
  if (r < 0.45) return Math.floor(rng() * 120); // quiet
  if (r < 0.75) return 120 + Math.floor(rng() * 800); // modest
  if (r < 0.92) return 900 + Math.floor(rng() * 2500); // solid
  if (r < 0.98) return 3400 + Math.floor(rng() * 2800); // popular
  return 6200 + Math.floor(rng() * 1800); // scene hit
}

const CITY_COUNTRY: Partial<Record<CitySlug, string>> = {
  beirut: "Lebanon",
  tripoli: "Lebanon",
  saida: "Lebanon",
  tyre: "Lebanon",
  byblos: "Lebanon",
  paris: "France",
  london: "United Kingdom",
  berlin: "Germany",
  "new-york": "United States",
  montreal: "Canada",
  barcelona: "Spain",
  dubai: "United Arab Emirates",
  cairo: "Egypt",
  istanbul: "Turkey",
  lisbon: "Portugal",
  lagos: "Nigeria",
  tokyo: "Japan",
  "buenos-aires": "Argentina",
  "cape-town": "South Africa",
  amsterdam: "Netherlands",
  toronto: "Canada",
  "los-angeles": "United States",
  "mexico-city": "Mexico",
  mumbai: "India",
  seoul: "South Korea",
  sydney: "Australia",
  nairobi: "Kenya",
  remote: "—",
};

const CREATOR_CITIES: CitySlug[] = [
  "beirut", "beirut", "beirut", "beirut", "beirut", "beirut", "beirut", // denser Beirut
  "paris", "paris", "paris",
  "london", "london", "london",
  "berlin", "berlin", "berlin",
  "new-york", "new-york",
  "montreal", "montreal",
  "barcelona", "dubai", "cairo", "istanbul",
  "lisbon", "lagos", "tokyo", "buenos-aires", "cape-town",
  "amsterdam", "toronto", "los-angeles", "mexico-city",
  "tripoli", "saida", "byblos", "mumbai", "seoul", "sydney", "nairobi",
];

type PersonSeed = {
  handle: string;
  displayName: string;
  first: string;
};

const MUSIC_PEOPLE: PersonSeed[] = [
  { handle: "rami_beats", displayName: "Rami Beats", first: "Rami" },
  { handle: "sora_keys", displayName: "Sora Keys", first: "Sora" },
  { handle: "milo_wave", displayName: "Milo Wave", first: "Milo" },
  { handle: "nadia_freq", displayName: "Nadia Freq", first: "Nadia" },
  { handle: "jax_lowend", displayName: "Jax Lowend", first: "Jax" },
  { handle: "yara_strings", displayName: "Yara Strings", first: "Yara" },
  { handle: "kenji_tape", displayName: "Kenji Tape", first: "Kenji" },
  { handle: "amina_pulse", displayName: "Amina Pulse", first: "Amina" },
  { handle: "theo_reverb", displayName: "Theo Reverb", first: "Theo" },
  { handle: "leila_chord", displayName: "Leila Chord", first: "Leila" },
  { handle: "omar_drum", displayName: "Omar Drum", first: "Omar" },
  { handle: "iris_synth", displayName: "Iris Synth", first: "Iris" },
  { handle: "diego_bass", displayName: "Diego Bass", first: "Diego" },
  { handle: "hana_echo", displayName: "Hana Echo", first: "Hana" },
  { handle: "samir_groove", displayName: "Samir Groove", first: "Samir" },
];

const PHOTO_PEOPLE: PersonSeed[] = [
  { handle: "maya_k", displayName: "Maya Khoury", first: "Maya" },
  { handle: "noura_lens", displayName: "Noura Lens", first: "Noura" },
  { handle: "caleb_frame", displayName: "Caleb Frame", first: "Caleb" },
  { handle: "zara_grain", displayName: "Zara Grain", first: "Zara" },
  { handle: "pedro_street", displayName: "Pedro Street", first: "Pedro" },
  { handle: "noor_light", displayName: "Noor Light", first: "Noor" },
  { handle: "ines_aperture", displayName: "Inès Aperture", first: "Inès" },
  { handle: "jun_shadow", displayName: "Jun Shadow", first: "Jun" },
  { handle: "rita_film", displayName: "Rita Film", first: "Rita" },
  { handle: "adel_portrait", displayName: "Adel Portrait", first: "Adel" },
];

const FILM_PEOPLE: PersonSeed[] = [
  { handle: "karim_film", displayName: "Karim Abou", first: "Karim" },
  { handle: "sofia_cut", displayName: "Sofia Cut", first: "Sofia" },
  { handle: "malik_reel", displayName: "Malik Reel", first: "Malik" },
  { handle: "elena_lens", displayName: "Elena Lens", first: "Elena" },
  { handle: "tomas_shot", displayName: "Tomás Shot", first: "Tomás" },
  { handle: "aya_frame", displayName: "Aya Frame", first: "Aya" },
  { handle: "nico_doc", displayName: "Nico Doc", first: "Nico" },
  { handle: "priya_cut", displayName: "Priya Cut", first: "Priya" },
];

const WRITE_PEOPLE: PersonSeed[] = [
  { handle: "lina_writes", displayName: "Lina Haddad", first: "Lina" },
  { handle: "marc_verse", displayName: "Marc Verse", first: "Marc" },
  { handle: "sara_page", displayName: "Sara Page", first: "Sara" },
  { handle: "ibrahim_ink", displayName: "Ibrahim Ink", first: "Ibrahim" },
  { handle: "claire_essay", displayName: "Claire Essay", first: "Claire" },
  { handle: "yuki_flash", displayName: "Yuki Flash", first: "Yuki" },
  { handle: "dalia_poem", displayName: "Dalia Poem", first: "Dalia" },
  { handle: "ben_draft", displayName: "Ben Draft", first: "Ben" },
];

const MULTI_PEOPLE: PersonSeed[] = [
  { handle: "elio_noir", displayName: "Elio Noir", first: "Elio" },
  { handle: "mira_hybrid", displayName: "Mira Hybrid", first: "Mira" },
  { handle: "kasper_mix", displayName: "Kasper Mix", first: "Kasper" },
  { handle: "layla_cross", displayName: "Layla Cross", first: "Layla" },
  { handle: "oren_studio", displayName: "Oren Studio", first: "Oren" },
];

/** Extra claimed creators to reach ~50. */
const EXTRA_PEOPLE: { person: PersonSeed; discs: DisciplineSlug[] }[] = [
  { person: { handle: "rita_vinyl", displayName: "Rita Vinyl", first: "Rita" }, discs: ["music"] },
  { person: { handle: "hugo_still", displayName: "Hugo Still", first: "Hugo" }, discs: ["photography"] },
  { person: { handle: "mina_cut", displayName: "Mina Cut", first: "Mina" }, discs: ["film"] },
  { person: { handle: "joel_line", displayName: "Joel Line", first: "Joel" }, discs: ["writing"] },
];

const AVAIL = [
  "open · looking for vocalist",
  "open · looking for cinematographer",
  "open · looking for stylist",
  "open · looking for illustrator",
  "open · looking for electronic musician",
  "selective · remote OK",
  "open · looking for editor",
  "selective · onsite preferred",
  "open · looking for producer",
  "closed for commissions this season",
];

const MUSIC_TITLES = [
  ["Dream Harbor", "dream-pop single — soft chorus, distant traffic"],
  ["Grid Static", "experimental electronic — broken clock, warm noise"],
  ["Night Shift Trio", "jazz composition for late kitchen radios"],
  ["Concrete Cipher", "hip-hop instrumental — tight hats, city air"],
  ["Porch Light", "acoustic singer-songwriter sketch"],
  ["Soft Horizon", "ambient piece for ferry crossings"],
  ["Sidewalk Amplifier", "indie rock demo — two guitars, one room"],
  ["Velvet Delay", "neo-soul groove with clipped brass"],
  ["Basement Voltage", "live tape of a basement set"],
  ["Port Loop Redux", "extended port-side loop"],
  ["Copper Morning", "folk-electronic hybrid"],
  ["Signal Drift", "modular improvisation"],
  ["Low Tide Kick", "club sketch under 130bpm"],
  ["Atlas Hum", "drone with field recordings"],
  ["Paper Mic", "intimate vocal take, no polish"],
];

const PHOTO_TITLES = [
  ["Corniche After Midnight", "Night walk — sodium lights, wet asphalt"],
  ["Grain on Hamra", "Analog street: shutters, buses, film grain"],
  ["Paris Blue Hour", "Facades at the last blue minute"],
  ["Portrait Room 4", "Quiet studio portraits, window light"],
  ["Analog Sundays", "Medium-format weekend series"],
  ["Night Market", "Documentary flash work after closing"],
  ["Scaffold Geometry", "Architecture: temporary structures"],
  ["River Fog", "Early mist along the waterfront"],
  ["Metro Hands", "Hands on rails, tickets, phones"],
  ["Roof Laundry", "Domestic lines against sky"],
  ["Glass Lobby", "Reflections in corporate lobbies"],
  ["Ferry Deck", "Crossing light, salt air"],
];

const FILM_TITLES = [
  ["The Stairs", "One-shot climb through a stairwell"],
  ["Harbor Cut", "Doc fragment: morning catch, radio"],
  ["Neon Crossing", "Micro-short: rain, synth, late arrival"],
  ["Kitchen Documentary", "Short doc about a family kitchen"],
  ["Tape Over Credits", "Experimental short with found audio"],
  ["Music Video: Drift", "Performance clip for an ambient track"],
  ["Narrative Bus Stop", "Two strangers, one missed bus"],
  ["Animation Dust", "Hand-drawn loop of city dust"],
  ["Rehearsal Take 3", "Behind-the-scenes rehearsal cut"],
  ["Window Seat", "Travel short from a train window"],
];

const WRITE_TITLES = [
  ["Letters from the Port", "Essay on leaving and returning", "We measure distance in ferry horns. Drafts stay in one city; edits in another."],
  ["Ferry Drafts", "Flash fiction: three crossings", "She wrote the first page outbound and the last inbound. The middle stayed on the water."],
  ["Inventory of Quiet", "Personal essay on apartment noise", "The upstairs chair scrapes at 6:12. I keep a list of sounds that mean someone is home."],
  ["Short Story: Keys", "A lost set of keys and two versions of a night", "He said he left them on the bar. She said the bar never opened that Tuesday."],
  ["City Sonnets", "Eight sonnets about shared taxis", "Meter tries to keep up with traffic. Sometimes it fails on purpose."],
  ["Flash: Receipt", "A grocery receipt as a love letter", "Line four is the only thing she always buys. He notices. He doesn't say."],
  ["Essay: Archives", "On family hard drives", "We inherit folders named FINAL_FINAL2 and call it history."],
  ["Poem: Scaffolding", "Poetry for temporary cities", "The building wears a cage. Birds learn the new skyline first."],
  ["Notes from a Screening", "Essay after a shorts night", "The ending stayed with me longer than the plot summary."],
  ["Border Grammar", "Essay on bilingual drafts", "I switch languages mid-sentence when the feeling won't sit still."],
];

const GENRES: Record<DisciplineSlug, string[][]> = {
  music: [
    ["indie", "dream-pop"],
    ["experimental", "electronic"],
    ["jazz"],
    ["hip-hop", "instrumental"],
    ["folk", "acoustic"],
    ["ambient"],
    ["indie", "rock"],
    ["neo-soul"],
  ],
  photography: [
    ["street", "documentary"],
    ["architecture"],
    ["portrait"],
    ["analog", "street"],
    ["night", "documentary"],
    ["documentary"],
  ],
  film: [
    ["narrative short"],
    ["documentary", "short"],
    ["experimental short"],
    ["music video"],
    ["animation"],
  ],
  writing: [
    ["essay", "personal"],
    ["short story"],
    ["poetry"],
    ["flash fiction"],
    ["essay"],
  ],
};

const MOODS = [
  ["melancholic", "dreamy"],
  ["nocturnal", "grainy"],
  ["tense", "intimate"],
  ["warm", "observational"],
  ["abrasive", "hypnotic"],
  ["reflective", "tender"],
  ["sparse", "quiet"],
  ["energetic", "urban"],
];

const THEMES = [
  ["city", "solitude"],
  ["distance", "identity"],
  ["labor", "morning"],
  ["night", "waiting"],
  ["return", "memory"],
  ["transit", "port"],
  ["family", "archives"],
  ["performance", "rehearsal"],
];

const LANGUAGES = ["English", "French", "Arabic", "Spanish", "instrumental", "wordless", "bilingual", "n/a"];

function workTypeFor(d: DisciplineSlug): WorkType {
  return d === "music" ? "audio" : d === "photography" ? "image" : d === "film" ? "video" : "text";
}

function bioFor(p: PersonSeed, disc: DisciplineSlug[], city: CitySlug): { short: string; long: string } {
  const primary = disc[0]!;
  const cityName = city.replace(/-/g, " ");
  const shortBank: Record<DisciplineSlug, string[]> = {
    music: [
      `${p.first} makes ${primary} from ${cityName} — late sessions and portable speakers.`,
      `Producer / performer shaping small rooms into bigger nights.`,
      `Sound sketches for film, live sets, and unfinished playlists.`,
    ],
    photography: [
      `${p.first} photographs ${cityName} edges — light, grain, and waiting.`,
      `Documentary and portrait work with patience for ordinary rooms.`,
      `Architecture and street studies between commissions.`,
    ],
    film: [
      `Independent filmmaker cutting shorts between longer waits.`,
      `${p.first} directs lean crews and keeps the takes honest.`,
      `Narrative and doc fragments from ${cityName}.`,
    ],
    writing: [
      `Poet and essayist drafting between cities.`,
      `${p.first} writes short forms that refuse neat endings.`,
      `Essays, flash, and notes from ${cityName} desks.`,
    ],
  };
  const short = pick(shortBank[primary]);
  const long = `${p.displayName} works primarily in ${disc.join(" + ")}. Based in ${cityName}. Skills woven into practice rather than a résumé line. Looking for collaborators who care about the middle of a piece as much as the hook.`;
  return { short, long };
}

// —— Preserve POC core works ——
const CORE_WORKS: SeedWorkFixture[] = [
  {
    slug: "cornice-after-midnight",
    creatorHandle: "maya_k",
    title: "Corniche After Midnight",
    type: "image",
    description: "Night walk along the Corniche — sodium lights, wet asphalt.",
    primaryDiscipline: "photography",
    status: "published",
    viewCount: 4200,
    mediaMode: "picsum",
  },
  {
    slug: "grain-on-hamra",
    creatorHandle: "maya_k",
    title: "Grain on Hamra",
    type: "image",
    description: "Analog street series: shop shutters, late buses, film grain.",
    primaryDiscipline: "photography",
    status: "published",
    viewCount: 1800,
    mediaMode: "picsum",
  },
  {
    slug: "port-loop",
    creatorHandle: "rami_beats",
    title: "Port Loop",
    type: "audio",
    description: "Two-minute port-side loop for late drives — low kick, distant horns.",
    primaryDiscipline: "music",
    status: "published",
    viewCount: 6100,
    mediaMode: "sample",
  },
  {
    slug: "midnight-pad",
    creatorHandle: "rami_beats",
    title: "Midnight Pad",
    type: "audio",
    description: "Ambient pad sketch for film temp scores.",
    primaryDiscipline: "music",
    status: "published",
    viewCount: 900,
    mediaMode: "sample",
  },
  {
    slug: "letters-from-the-port",
    creatorHandle: "lina_writes",
    title: "Letters from the Port",
    type: "text",
    description: "A short essay on leaving and returning.",
    body: "We measure distance in ferry horns. Tripoli keeps the drafts; Beirut keeps the edits. Between them, a sentence tries to stay honest — not prettier, just truer than the last crossing.",
    primaryDiscipline: "writing",
    status: "published",
    viewCount: 2400,
  },
  {
    slug: "ferry-drafts",
    creatorHandle: "lina_writes",
    title: "Ferry Drafts",
    type: "text",
    description: "Flash fiction: three crossings, one unfinished letter.",
    body: "She wrote the first page on the way out and the last on the way back. The middle stayed on the water — salt in the ink, a name she almost used.",
    primaryDiscipline: "writing",
    status: "published",
    viewCount: 700,
  },
  {
    slug: "the-stairs",
    creatorHandle: "karim_film",
    title: "The Stairs",
    type: "video",
    description: "A one-shot climb through a Saida stairwell.",
    primaryDiscipline: "film",
    status: "published",
    viewCount: 3300,
    mediaMode: "sample",
  },
  {
    slug: "harbor-cut",
    creatorHandle: "karim_film",
    title: "Harbor Cut",
    type: "video",
    description: "Short documentary fragment: morning catch, radio static, hands.",
    primaryDiscipline: "film",
    status: "published",
    viewCount: 1100,
    mediaMode: "sample",
  },
  {
    slug: "berlin-basement-tape",
    creatorHandle: "elio_noir",
    title: "Berlin Basement Tape",
    type: "audio",
    description: "Experimental electronic — tape hiss, broken kick, neon bleed.",
    primaryDiscipline: "music",
    status: "published",
    viewCount: 5200,
    mediaMode: "sample",
  },
  {
    slug: "neon-crossing",
    creatorHandle: "elio_noir",
    title: "Neon Crossing",
    type: "video",
    description: "Micro-short: a crosswalk, rain, and a synth stab that arrives late.",
    primaryDiscipline: "film",
    status: "published",
    viewCount: 2700,
    mediaMode: "sample",
  },
];

function buildCreators(): SeedCreatorFixture[] {
  const cityPool = [...CREATOR_CITIES];
  const takeCity = () => {
    if (!cityPool.length) return pick(CREATOR_CITIES);
    return cityPool.splice(Math.floor(rng() * cityPool.length), 1)[0]!;
  };

  type Slot = { person: PersonSeed; discs: DisciplineSlug[]; forcedCity?: CitySlug; country?: string };
  const slots: Slot[] = [
    { person: MUSIC_PEOPLE[0]!, discs: ["music"], forcedCity: "beirut", country: "Lebanon" },
    ...MUSIC_PEOPLE.slice(1).map((p) => ({ person: p, discs: ["music"] as DisciplineSlug[] })),
    { person: PHOTO_PEOPLE[0]!, discs: ["photography"], forcedCity: "beirut", country: "Lebanon" },
    { person: PHOTO_PEOPLE[1]!, discs: ["photography"], forcedCity: "paris", country: "France" },
    ...PHOTO_PEOPLE.slice(2).map((p) => ({ person: p, discs: ["photography"] as DisciplineSlug[] })),
    { person: FILM_PEOPLE[0]!, discs: ["film"], forcedCity: "saida", country: "Lebanon" },
    ...FILM_PEOPLE.slice(1).map((p) => ({ person: p, discs: ["film"] as DisciplineSlug[] })),
    { person: WRITE_PEOPLE[0]!, discs: ["writing"], forcedCity: "tripoli", country: "Lebanon" },
    ...WRITE_PEOPLE.slice(1).map((p) => ({ person: p, discs: ["writing"] as DisciplineSlug[] })),
    { person: MULTI_PEOPLE[0]!, discs: ["music", "film"], forcedCity: "berlin", country: "Germany" },
    { person: MULTI_PEOPLE[1]!, discs: ["photography", "writing"] },
    { person: MULTI_PEOPLE[2]!, discs: ["music", "photography"] },
    { person: MULTI_PEOPLE[3]!, discs: ["film", "writing"] },
    { person: MULTI_PEOPLE[4]!, discs: ["music", "film", "photography"] },
    ...EXTRA_PEOPLE.map((e) => ({ person: e.person, discs: e.discs })),
  ];

  // Claim plan: maya pending; 2 more pending; 5 unclaimed; rest claimed
  const pendingHandles = new Set(["maya_k", "zara_grain", "nico_doc"]);
  const unclaimedHandles = new Set([
    "hana_echo",
    "adel_portrait",
    "priya_cut",
    "ben_draft",
    "oren_studio",
  ]);

  const creators: SeedCreatorFixture[] = [];
  let i = 0;
  for (const slot of slots) {
    const city = slot.forcedCity ?? takeCity();
    const country = slot.country ?? CITY_COUNTRY[city] ?? "—";
    const { short, long } = bioFor(slot.person, slot.discs, city);
    let claimStatus: SeedCreatorFixture["claimStatus"] = "claimed";
    if (pendingHandles.has(slot.person.handle)) claimStatus = "pending";
    if (unclaimedHandles.has(slot.person.handle)) claimStatus = "unclaimed";

    const sceneWeight =
      slot.person.handle === "maya_k"
        ? 9
        : ["rami_beats", "elio_noir", "karim_film", "noura_lens", "sora_keys", "sofia_cut"].includes(
              slot.person.handle,
            )
          ? 8
          : 2 + Math.floor(rng() * 5);

    creators.push({
      handle: slot.person.handle,
      displayName: slot.person.displayName,
      bioShort: short,
      bioLong: long,
      city,
      country,
      disciplineSlugs: slot.discs,
      claimStatus,
      availability: pick(AVAIL),
      websiteUrl: chance(0.45) ? `https://example.com/${slot.person.handle}` : undefined,
      instagramUrl: chance(0.55) ? `https://instagram.com/${slot.person.handle.replace(/_/g, ".")}` : undefined,
      isFounding: i < 12,
      sceneWeight,
      locale: pick(["en", "en", "en", "fr", "ar"]),
      workSlugs: [],
      userStatus: "active",
    });
    i++;
  }

  // spam-like suspended claimed account (extra beyond 50? keep inside by marking one claimed as suspended)
  const spam = creators.find((c) => c.handle === "jax_lowend");
  if (spam) {
    spam.userStatus = "suspended";
    spam.bioShort = "Promotional account — limited engagement (seed moderation demo).";
    spam.availability = "closed for commissions this season";
    spam.claimStatus = "claimed";
  }

  return creators;
}

function buildWorks(creators: SeedCreatorFixture[]): {
  works: SeedWorkFixture[];
  meta: SeedWorkMeta[];
} {
  const works: SeedWorkFixture[] = [...CORE_WORKS];
  const meta: SeedWorkMeta[] = [];
  const usedSlugs = new Set(works.map((w) => w.slug));

  const byDisc: Record<DisciplineSlug, SeedCreatorFixture[]> = {
    music: [],
    photography: [],
    film: [],
    writing: [],
  };
  for (const c of creators) {
    for (const d of c.disciplineSlugs) byDisc[d].push(c);
  }

  const targets: Record<DisciplineSlug, number> = {
    music: 45,
    photography: 40,
    film: 30,
    writing: 35,
  };

  // Count existing core toward targets
  for (const w of works) {
    targets[w.primaryDiscipline] -= 1;
  }

  function addWork(
    creator: SeedCreatorFixture,
    discipline: DisciplineSlug,
    title: string,
    description: string,
    body?: string,
  ) {
    let base = slugify(title);
    let slug = base;
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = `${base}-${n++}`;
    }
    usedSlugs.add(slug);
    const type = workTypeFor(discipline);
    const w: SeedWorkFixture = {
      slug,
      creatorHandle: creator.handle,
      title,
      type,
      description,
      body: type === "text" ? body ?? description : undefined,
      primaryDiscipline: discipline,
      status: "published",
      viewCount: skewedViews(),
      mediaMode: type === "image" ? "picsum" : type === "text" ? undefined : "sample",
      aiGenerated: false,
    };
    works.push(w);
    creator.workSlugs.push(slug);

    const city = creator.city;
    meta.push({
      slug,
      discipline,
      genre: pick(GENRES[discipline]),
      mood: pick(MOODS),
      themes: pick(THEMES),
      style: pick([
        "analog-leaning",
        "loop-based",
        "one-shot",
        "literary nonfiction",
        "vérité fragment",
        "studio polish",
        "field recording",
        "compressed narrative",
      ]),
      language: discipline === "music" ? pick(["instrumental", "English", "Arabic", "French"]) : pick(LANGUAGES),
      city,
    });
  }

  // Meta for core works (fixed)
  const coreMeta: SeedWorkMeta[] = [
    {
      slug: "cornice-after-midnight",
      discipline: "photography",
      genre: ["street", "documentary"],
      mood: ["nocturnal", "grainy"],
      themes: ["city", "solitude"],
      style: "analog-leaning",
      language: "n/a",
      city: "beirut",
    },
    {
      slug: "grain-on-hamra",
      discipline: "photography",
      genre: ["street", "analog"],
      mood: ["observational", "warm"],
      themes: ["everyday", "city"],
      style: "35mm grain",
      language: "n/a",
      city: "beirut",
    },
    {
      slug: "port-loop",
      discipline: "music",
      genre: ["electronic", "lo-fi"],
      mood: ["nocturnal", "driving"],
      themes: ["port", "transit"],
      style: "loop-based instrumental",
      language: "instrumental",
      city: "beirut",
    },
    {
      slug: "midnight-pad",
      discipline: "music",
      genre: ["ambient"],
      mood: ["dreamy", "sparse"],
      themes: ["night", "waiting"],
      style: "pad sketch",
      language: "instrumental",
      city: "beirut",
    },
    {
      slug: "letters-from-the-port",
      discipline: "writing",
      genre: ["essay", "personal"],
      mood: ["reflective", "tender"],
      themes: ["distance", "identity", "return"],
      style: "literary nonfiction",
      language: "English",
      city: "tripoli",
    },
    {
      slug: "ferry-drafts",
      discipline: "writing",
      genre: ["flash fiction"],
      mood: ["melancholic"],
      themes: ["crossing", "unfinished"],
      style: "compressed narrative",
      language: "English",
      city: "tripoli",
    },
    {
      slug: "the-stairs",
      discipline: "film",
      genre: ["narrative short", "experimental"],
      mood: ["tense", "intimate"],
      themes: ["ascent", "place"],
      style: "one-shot",
      language: "minimal dialogue",
      city: "saida",
    },
    {
      slug: "harbor-cut",
      discipline: "film",
      genre: ["documentary", "short"],
      mood: ["observational"],
      themes: ["labor", "morning"],
      style: "vérité fragment",
      language: "Arabic/English",
      city: "saida",
    },
    {
      slug: "berlin-basement-tape",
      discipline: "music",
      genre: ["experimental electronic"],
      mood: ["abrasive", "hypnotic"],
      themes: ["basement", "night"],
      style: "tape-damaged techno-adjacent",
      language: "instrumental",
      city: "berlin",
    },
    {
      slug: "neon-crossing",
      discipline: "film",
      genre: ["experimental short", "music video"],
      mood: ["neon", "wet"],
      themes: ["city", "timing"],
      style: "micro-short",
      language: "wordless",
      city: "berlin",
    },
  ];
  meta.push(...coreMeta);
  for (const c of creators) {
    for (const w of CORE_WORKS) {
      if (w.creatorHandle === c.handle) c.workSlugs.push(w.slug);
    }
  }

  const titleBanks: Record<DisciplineSlug, typeof MUSIC_TITLES> = {
    music: MUSIC_TITLES,
    photography: PHOTO_TITLES,
    film: FILM_TITLES,
    writing: WRITE_TITLES.map(([t, d]) => [t, d] as [string, string]),
  };

  for (const disc of ["music", "photography", "film", "writing"] as DisciplineSlug[]) {
    let need = targets[disc];
    let titleIdx = 0;
    const pool = byDisc[disc].length ? byDisc[disc] : creators;
    // Uneven distribution: shuffle creators and give 1–5 works
    const order = [...pool].sort(() => rng() - 0.5);
    let guard = 0;
    while (need > 0 && guard < 5000) {
      guard++;
      const creator = order[titleIdx % order.length]!;
      titleIdx++;
      const bank = titleBanks[disc];
      const [titleBase, descBase] = bank[titleIdx % bank.length]!;
      const title = `${titleBase}${titleIdx > bank.length ? ` ${Math.floor(titleIdx / bank.length) + 1}` : ""}`;
      // skip if creator already has many works (cap ~6)
      if (creator.workSlugs.length >= 6 && chance(0.7)) continue;
      const writeBody =
        disc === "writing"
          ? (WRITE_TITLES[titleIdx % WRITE_TITLES.length]?.[2] ??
            `${descBase} ${creator.displayName} keeps the sentence moving.`)
          : undefined;
      addWork(creator, disc, title, `${descBase} — ${creator.city.replace(/-/g, " ")}.`, writeBody);
      need--;
    }
  }

  return { works, meta };
}

function buildExplorers(): SeedExplorerFixture[] {
  const personas: BehavioralPersonaId[] = [
    "photo_explorer",
    "music_explorer",
    "cross_discipline_collaborator",
    "hub_night_regular",
    "lurker",
  ];
  const firsts = [
    "Sara", "Omar", "Jade", "Nabil", "Quiet", "Mona", "Leo", "Rana", "Chris", "Aya",
    "Paul", "Hiba", "Dev", "Nora", "Sam", "Farah", "Alex", "Tala", "Kit", "Rami",
    "Eve", "Ziad", "Jon", "Maya", "Gus", "Lana", "Vic", "Dana", "Rex", "Salma",
    "Hugo", "Iman", "Max", "Ruba", "Ned", "Celi", "Tom", "Yas", "Ben", "Kim",
    "Lou", "Amir", "Sky", "Vera", "Oz", "Nina", "Jay", "Reem", "Fox", "Hana",
  ];
  const lasts = [
    "Photo", "Listen", "Collab", "Hub", "Viewer", "North", "Wave", "Quiet", "Field", "Note",
    "Lane", "Atlas", "Drift", "Moss", "Reed", "Pike", "Vale", "Shore", "Bloom", "Clay",
  ];
  const cities: CitySlug[] = [
    "paris", "cairo", "montreal", "beirut", "london", "berlin", "new-york", "lisbon",
    "lagos", "tokyo", "barcelona", "dubai", "istanbul", "amsterdam", "toronto",
    "cape-town", "buenos-aires", "beirut", "beirut", "beirut",
  ];

  // Preserve POC handles
  const explorers: SeedExplorerFixture[] = [
    {
      handle: "sara_photo",
      displayName: "Sara N.",
      bioShort: "Follows photographers and the occasional film short.",
      city: "paris",
      country: "France",
      persona: "photo_explorer",
      locale: "en",
      disciplineSlugs: ["photography"],
    },
    {
      handle: "omar_listen",
      displayName: "Omar Listen",
      bioShort: "Mostly here for music — and the writers who soundtrack nights.",
      city: "cairo",
      country: "Egypt",
      persona: "music_explorer",
      locale: "en",
      disciplineSlugs: ["music"],
    },
    {
      handle: "jade_collab",
      displayName: "Jade Collab",
      bioShort: "Cross-discipline collaborator hunting projects across media.",
      city: "montreal",
      country: "Canada",
      persona: "cross_discipline_collaborator",
      locale: "en",
      disciplineSlugs: ["film", "music"],
    },
    {
      handle: "nabil_hub",
      displayName: "Nabil Hub",
      bioShort: "Beirut Hub Night regular — shows up early, stays for the recap.",
      city: "beirut",
      country: "Lebanon",
      persona: "hub_night_regular",
      locale: "en",
      disciplineSlugs: ["music", "photography"],
    },
    {
      handle: "quiet_viewer",
      displayName: "Quiet Viewer",
      bioShort: "Watches a lot. Follows almost no one.",
      city: "london",
      country: "United Kingdom",
      persona: "lurker",
      locale: "en",
    },
  ];

  for (let i = explorers.length; i < 50; i++) {
    const persona = personas[i % personas.length]!;
    const first = firsts[i]!;
    const last = lasts[i % lasts.length]!;
    const handle = `ex_${String(i + 1).padStart(2, "0")}_${persona.split("_")[0]}`;
    const city = cities[i % cities.length]!;
    explorers.push({
      handle,
      displayName: `${first} ${last}`,
      bioShort: `${first} explores Creative Hub as a ${persona.replace(/_/g, " ")}.`,
      city,
      country: CITY_COUNTRY[city] ?? "—",
      persona,
      locale: pick(["en", "en", "fr", "ar"]),
      disciplineSlugs:
        persona === "photo_explorer"
          ? ["photography"]
          : persona === "music_explorer"
            ? ["music"]
            : persona === "hub_night_regular"
              ? pickN(["music", "photography", "film", "writing"], 2)
              : persona === "cross_discipline_collaborator"
                ? pickN(["music", "photography", "film", "writing"], 2)
                : [],
    });
  }

  // One more spam-like suspended explorer
  explorers[49]!.userStatus = "suspended";
  explorers[49]!.bioShort = "Automated promo account (seed moderation demo).";
  explorers[49]!.displayName = "Promo Blast";

  return explorers;
}

function buildOpportunities(creators: SeedCreatorFixture[]): SeedOpportunityFixture[] {
  const claimed = creators.filter((c) => c.claimStatus === "claimed" && c.userStatus !== "suspended");
  const templates: Omit<SeedOpportunityFixture, "slug" | "creatorHandle">[] = [
    {
      title: "Looking for a vocalist",
      description: "Need a soft vocal line — Arabic or English. Remote OK.",
      roles: "Vocalist",
      discipline: "music",
      location: "Beirut / remote",
      remoteMode: "hybrid",
      compensationStatus: "negotiable",
      status: "open",
      deadlineDaysFromEpoch: 45,
    },
    {
      title: "Filmmaker looking for cinematographer",
      description: "Expanding a harbor short into a 12-minute doc. Dawn handheld.",
      roles: "Cinematographer",
      discipline: "film",
      location: "Onsite",
      remoteMode: "onsite",
      compensationStatus: "negotiable",
      status: "open",
      deadlineDaysFromEpoch: 60,
    },
    {
      title: "Photographer looking for stylist",
      description: "Portrait series needs wardrobe / set styling for three looks.",
      roles: "Stylist",
      discipline: "photography",
      location: "Paris / remote prep",
      remoteMode: "hybrid",
      compensationStatus: "paid",
      status: "open",
      deadlineDaysFromEpoch: 40,
    },
    {
      title: "Writer looking for illustrator",
      description: "Chapbook needs 6–8 ink or collage pieces.",
      roles: "Illustrator",
      discipline: "writing",
      location: "Remote",
      remoteMode: "remote",
      compensationStatus: "tbd",
      status: "open",
      deadlineDaysFromEpoch: 90,
    },
    {
      title: "Producer looking for electronic musician",
      description: "Label night — 20-minute back-to-back, experimental.",
      roles: "Electronic musician",
      discipline: "music",
      location: "Berlin",
      remoteMode: "onsite",
      compensationStatus: "unpaid",
      status: "open",
      deadlineDaysFromEpoch: 30,
    },
    {
      title: "Designer looking for filmmaker",
      description: "Need a motion piece for an exhibition loop.",
      roles: "Filmmaker / motion",
      discipline: "film",
      location: "Remote / Lisbon",
      remoteMode: "hybrid",
      compensationStatus: "negotiable",
      status: "open",
      deadlineDaysFromEpoch: 55,
    },
    {
      title: "Editor for local shorts reel",
      description: "Compile 3–5 shorts into a Hub Night screening block.",
      roles: "Film editor",
      discipline: "film",
      location: "Beirut",
      remoteMode: "hybrid",
      compensationStatus: "negotiable",
      status: "open",
      deadlineDaysFromEpoch: 25,
    },
    {
      title: "Sound designer for narrative short",
      description: "Foley + score bed for a 10-minute piece.",
      roles: "Sound designer",
      discipline: "music",
      location: "Remote",
      remoteMode: "remote",
      compensationStatus: "paid",
      status: "open",
      deadlineDaysFromEpoch: 70,
    },
  ];

  const opps: SeedOpportunityFixture[] = [];
  for (let i = 0; i < 30; i++) {
    const t = templates[i % templates.length]!;
    const creator = claimed[i % claimed.length]!;
    const slug = slugify(`${t.title}-${creator.handle}-${i}`);
    const status = i === 27 ? "closed" : i === 28 || i === 29 ? "draft" : "open";
    opps.push({
      slug,
      creatorHandle: creator.handle,
      title: i < templates.length ? t.title : `${t.title} (${creator.city})`,
      description: `${t.description} Posted by ${creator.displayName}.`,
      roles: t.roles,
      discipline: t.discipline,
      location: t.location,
      remoteMode: t.remoteMode,
      compensationStatus: t.compensationStatus,
      status,
      deadlineDaysFromEpoch: t.deadlineDaysFromEpoch,
    });
  }
  return opps;
}

const INTEREST_LINES = [
  "The mid-piece shift into noise is the part I'd keep in a live set.",
  "Would shoot stills for a second cut if you need coverage.",
  "The ending stayed with me — happy to help rethink the last minute.",
  "Love the grain timing; I can bring a small kit for dawn light.",
  "I write captions that don't flatten the image — samples on request.",
  "Can trade a 20-minute back-to-back if the pocket matches.",
  "First half feels stronger; I have edit notes if useful.",
  "Would love to see this performed live with one vocal take.",
  "I know a collagist if you want an intro — or I can try ink studies.",
  "The ferry-horn measure of distance is exact; Hub Night reading?",
];

function buildInterests(
  opps: SeedOpportunityFixture[],
  explorers: SeedExplorerFixture[],
): SeedInterestFixture[] {
  const open = opps.filter((o) => o.status === "open");
  const interested = explorers.filter((e) =>
    ["cross_discipline_collaborator", "hub_night_regular", "music_explorer", "photo_explorer"].includes(
      e.persona,
    ),
  );
  const out: SeedInterestFixture[] = [];
  let i = 0;
  while (out.length < 50 && i < 500) {
    const opp = open[i % open.length]!;
    const ex = interested[Math.floor(rng() * interested.length)]!;
    const key = `${ex.handle}-${opp.slug}`;
    if (!out.some((x) => x.key === key)) {
      out.push({
        key,
        opportunitySlug: opp.slug,
        fromHandle: ex.handle,
        message: INTEREST_LINES[out.length % INTEREST_LINES.length],
      });
    }
    i++;
  }
  return out.slice(0, 50);
}

function buildEvents(creators: SeedCreatorFixture[]): SeedEventFixture[] {
  const claimed = creators.filter((c) => c.claimStatus === "claimed");
  const rami = claimed.find((c) => c.handle === "rami_beats")?.handle ?? "rami_beats";
  const karim = claimed.find((c) => c.handle === "karim_film")?.handle ?? "karim_film";
  const elio = claimed.find((c) => c.handle === "elio_noir")?.handle ?? "elio_noir";
  const lina = claimed.find((c) => c.handle === "lina_writes")?.handle ?? "lina_writes";
  const noura = claimed.find((c) => c.handle === "noura_lens")?.handle ?? "noura_lens";

  return [
    {
      slug: "hub-night-beirut-soft-launch",
      name: "Hub Night — Beirut",
      description: "Founding creators meetup: show work, swap contacts, plan the season.",
      venue: "TBD — Mar Mikhael",
      city: "beirut",
      category: "hub_night",
      isHubNight: true,
      organizerHandle: rami,
      daysFromEpoch: 21,
      durationHours: 4,
      status: "published",
    },
    {
      slug: "independent-film-night-paris",
      name: "Independent Film Night — Paris",
      description: "An evening of shorts from independent makers.",
      venue: "Microcinema Belleville",
      city: "paris",
      category: "screening",
      organizerHandle: karim,
      daysFromEpoch: 35,
      status: "published",
    },
    {
      slug: "experimental-music-showcase-berlin",
      name: "Experimental Music Showcase — Berlin",
      description: "Basement sets and tape experiments.",
      venue: "Kellerraum",
      city: "berlin",
      category: "showcase",
      organizerHandle: elio,
      daysFromEpoch: 28,
      status: "published",
    },
    {
      slug: "photography-walk-beirut",
      name: "Photography Walk — Beirut",
      description: "Golden-hour walk from Hamra toward the Corniche.",
      venue: "Meet at Hamra",
      city: "beirut",
      category: "community",
      organizerHandle: "admin",
      daysFromEpoch: 14,
      status: "published",
    },
    {
      slug: "writers-open-mic-london",
      name: "Writers' Open Mic — London",
      description: "Short readings — essay, poetry, flash.",
      venue: "Independent bookshop basement",
      city: "london",
      category: "open_mic",
      organizerHandle: lina,
      daysFromEpoch: 40,
      status: "published",
    },
    {
      slug: "creative-coding-night-montreal",
      name: "Creative Coding Night — Montreal",
      description: "Visuals + sound sketches; bring a laptop.",
      venue: "Studio co-op",
      city: "montreal",
      category: "workshop",
      organizerHandle: elio,
      daysFromEpoch: 50,
      status: "published",
    },
    {
      slug: "portrait-salon-paris",
      name: "Portrait Salon — Paris",
      description: "Small salon for portrait series and critique.",
      venue: "Shared studio",
      city: "paris",
      category: "salon",
      organizerHandle: noura,
      daysFromEpoch: 18,
      status: "published",
    },
    {
      slug: "hub-night-beirut-spring-recap",
      name: "Hub Night — Beirut (Spring Recap)",
      description: "Past Hub Night — coverage and reunions.",
      venue: "Mar Mikhael",
      city: "beirut",
      category: "hub_night",
      isHubNight: true,
      organizerHandle: rami,
      daysFromEpoch: -40,
      status: "past",
    },
    {
      slug: "lagos-listening-room",
      name: "Listening Room — Lagos",
      description: "Past listening session for new instrumentals.",
      venue: "Community room",
      city: "lagos",
      category: "listening",
      organizerHandle: claimed.find((c) => c.city === "lagos")?.handle ?? rami,
      daysFromEpoch: -25,
      status: "past",
    },
    {
      slug: "tokyo-micro-shorts",
      name: "Micro Shorts — Tokyo",
      description: "Past screening of under-3-minute works.",
      venue: "Micro theater",
      city: "tokyo",
      category: "screening",
      organizerHandle: claimed.find((c) => c.city === "tokyo")?.handle ?? karim,
      daysFromEpoch: -60,
      status: "past",
    },
  ];
}

const CONTACT_LINES = [
  {
    subject: "Live set thought",
    message: "The mid-piece shift into noise is the part I'd keep in a live set.",
  },
  {
    subject: "Coverage offer",
    message: "Would shoot stills for a second cut if you need coverage.",
  },
  {
    subject: "After the ending",
    message: "The ending stayed with me. Happy to share edit notes if useful.",
  },
  {
    subject: "Grain and timing",
    message: "Love the grain in this series — the timing against the soundtrack is exact.",
  },
  {
    subject: "Hub Night reading",
    message: "Would love to see this read or screened at the next Hub Night.",
  },
  {
    subject: "Stronger first half",
    message: "The first half feels stronger than the second — curious if you agree.",
  },
  {
    subject: "Collab spark",
    message: "This sits next to something I'm drafting. Open to a short exchange?",
  },
  {
    subject: "Instrumental pocket",
    message: "This pocket matches a vocal take I've been sitting on. Trade?",
  },
];

function buildContacts(
  explorers: SeedExplorerFixture[],
  creators: SeedCreatorFixture[],
): SeedContactFixture[] {
  const claimed = creators.filter((c) => c.claimStatus === "claimed");
  const senders = explorers.filter((e) => e.persona !== "lurker" || chance(0.2));
  const out: SeedContactFixture[] = [];
  for (let i = 0; i < 40; i++) {
    const from = senders[i % senders.length]!;
    const to = claimed[(i * 3) % claimed.length]!;
    const line = CONTACT_LINES[i % CONTACT_LINES.length]!;
    out.push({
      key: `contact-${from.handle}-${to.handle}-${i}`,
      fromHandle: from.handle,
      toHandle: to.handle,
      subject: `${line.subject} — ${to.displayName}`,
      message: line.message,
    });
  }
  return out;
}

function buildNotifications(
  explorers: SeedExplorerFixture[],
  creators: SeedCreatorFixture[],
  interests: SeedInterestFixture[],
  contacts: SeedContactFixture[],
): SeedNotificationFixture[] {
  const claimed = creators.filter((c) => c.claimStatus === "claimed");
  const out: SeedNotificationFixture[] = [];

  // follows (~35)
  for (let i = 0; i < 35; i++) {
    const creator = claimed[i % claimed.length]!;
    const ex = explorers[i % explorers.length]!;
    out.push({
      key: `notif-follow-${i}`,
      userHandle: creator.handle,
      type: "follow",
      title: "New follower",
      body: "Someone started following you.",
      payload: { fromHandle: ex.handle },
    });
  }
  // collab (~20) — notify opportunity owners when possible
  for (let i = 0; i < Math.min(20, interests.length); i++) {
    const interest = interests[i]!;
    const oppOwner =
      claimed.find((c) => interest.opportunitySlug.includes(c.handle)) ?? claimed[i % claimed.length]!;
    out.push({
      key: `notif-interest-${i}`,
      userHandle: oppOwner.handle,
      type: "collab_interest",
      title: "Collaboration interest",
      body: `${interest.fromHandle} expressed interest.`,
      payload: { opportunitySlug: interest.opportunitySlug, fromHandle: interest.fromHandle },
    });
  }
  // contacts (~15)
  for (let i = 0; i < Math.min(15, contacts.length); i++) {
    const c = contacts[i]!;
    out.push({
      key: `notif-contact-${i}`,
      userHandle: c.toHandle,
      type: "contact_message",
      title: "New message",
      body: c.subject,
      payload: { fromHandle: c.fromHandle },
    });
  }
  // claim + system to fill to ~80
  out.push({
    key: "notif-maya-claim",
    userHandle: "admin",
    type: "claim",
    title: "Claim link active",
    body: "Demo claim token for maya_k is ready.",
    payload: { profileHandle: "maya_k" },
  });
  out.push({
    key: "notif-pending-zara",
    userHandle: "admin",
    type: "claim",
    title: "Pending claim",
    body: "Claim token active for zara_grain.",
    payload: { profileHandle: "zara_grain" },
  });
  let n = out.length;
  while (n < 80) {
    const ex = explorers[n % explorers.length]!;
    out.push({
      key: `notif-system-${n}`,
      userHandle: ex.handle,
      type: "system",
      title: "Welcome to Creative Hub",
      body: "Explore creators, works, and collaboration opportunities.",
      read: n % 3 === 0,
    });
    n++;
  }
  return out.slice(0, 80);
}

function buildReports(explorers: SeedExplorerFixture[], works: SeedWorkFixture[]): SeedReportFixture[] {
  return [
    {
      key: "report-open-1",
      reporterHandle: "nabil_hub",
      entityType: "profile",
      entityRef: "jax_lowend",
      reason: "spam",
      details: "Seed demo open report.",
      status: "open",
    },
    {
      key: "report-open-2",
      reporterHandle: "sara_photo",
      entityType: "work",
      entityRef: works.find((w) => w.slug === "port-loop")?.slug ?? works[0]!.slug,
      reason: "copyright_claim",
      details: "Seed demo report — not a real claim.",
      status: "open",
    },
    {
      key: "report-open-3",
      reporterHandle: "omar_listen",
      entityType: "user",
      entityRef: explorers[49]!.handle,
      reason: "spam",
      details: "Suspended promo account — seed demo.",
      status: "open",
    },
    {
      key: "report-resolved-1",
      reporterHandle: "jade_collab",
      entityType: "work",
      entityRef: works.find((w) => w.slug === "harbor-cut")?.slug ?? works[1]!.slug,
      reason: "inappropriate",
      details: "Resolved seed demo.",
      status: "resolved",
      resolvedByHandle: "admin",
    },
    {
      key: "report-dismissed-1",
      reporterHandle: "quiet_viewer",
      entityType: "work",
      entityRef: works.find((w) => w.slug === "neon-crossing")?.slug ?? works[2]!.slug,
      reason: "other",
      details: "Dismissed seed demo.",
      status: "dismissed",
      resolvedByHandle: "admin",
    },
  ];
}

function buildWaitlist(): SeedWaitlistFixture[] {
  const names = [
    "Leila", "Youssef", "Amina", "Noah", "Sami", "Elena", "Karim", "Mia", "Omar", "Jules", "Rania", "Theo",
  ];
  return names.map((n, i) => ({
    email: `waitlist+${n.toLowerCase()}@example.com`,
    displayName: n,
    disciplines: pickN(["music", "photography", "film", "writing"], 1 + (i % 2)),
    locale: pick(["en", "fr", "ar"]),
    referralCode: i % 4 === 0 ? "hub-night" : undefined,
  }));
}

function buildClaims(): SeedClaimTokenFixture[] {
  return [
    {
      token: "demo-claim-token-maya-k-phase1",
      profileHandle: "maya_k",
      expiresDaysFromEpoch: 120,
      used: false,
    },
    {
      token: "demo-claim-token-zara-grain",
      profileHandle: "zara_grain",
      expiresDaysFromEpoch: 90,
      used: false,
    },
    {
      token: "demo-claim-token-nico-doc",
      profileHandle: "nico_doc",
      expiresDaysFromEpoch: 90,
      used: false,
    },
  ];
}

function buildEditorial(creators: SeedCreatorFixture[], works: SeedWorkFixture[]): SeedEditorialFixture[] {
  const claimed = creators.filter((c) => c.claimStatus === "claimed");
  const featuredCreators = [
    "rami_beats",
    "elio_noir",
    "karim_film",
    "lina_writes",
    "noura_lens",
    "maya_k",
    "sora_keys",
    "sofia_cut",
  ];
  const featuredWorks = [
    "port-loop",
    "cornice-after-midnight",
    "berlin-basement-tape",
    "the-stairs",
    "letters-from-the-port",
  ];
  const out: SeedEditorialFixture[] = [];
  featuredCreators.forEach((h, i) => {
    if (creators.some((c) => c.handle === h) || claimed.some((c) => c.handle === h)) {
      out.push({
        entityType: "profile",
        entityRef: h,
        placement: "explore_featured_creators",
        sortOrder: i,
      });
    }
  });
  featuredWorks.forEach((slug, i) => {
    if (works.some((w) => w.slug === slug)) {
      out.push({
        entityType: "work",
        entityRef: slug,
        placement: "explore_featured_works",
        sortOrder: i,
      });
    }
  });
  out.push({
    entityType: "event",
    entityRef: "hub-night-beirut-soft-launch",
    placement: "explore_upcoming_events",
    sortOrder: 0,
  });
  out.push({
    entityType: "opportunity",
    entityRef: "", // fill below
    placement: "explore_opportunities",
    sortOrder: 0,
  });
  return out;
}

function buildAudits(): SeedAuditFixture[] {
  return [
    {
      key: "audit-seed-bootstrap",
      actorHandle: "admin",
      action: "seed.bootstrap",
      target: "creative_hub",
      metadata: { phase: "full-staging", fixture: true },
    },
    {
      key: "audit-feature-works",
      actorHandle: "admin",
      action: "editorial.feature",
      target: "explore_featured_works",
      metadata: { count: 5 },
    },
    {
      key: "audit-resolve-report",
      actorHandle: "admin",
      action: "moderation.resolve",
      target: "report-resolved-1",
    },
  ];
}

function main() {
  const creators = buildCreators();
  console.log("creators", creators.length, {
    claimed: creators.filter((c) => c.claimStatus === "claimed").length,
    pending: creators.filter((c) => c.claimStatus === "pending").length,
    unclaimed: creators.filter((c) => c.claimStatus === "unclaimed").length,
  });

  const { works, meta } = buildWorks(creators);
  console.log("works", works.length, {
    music: works.filter((w) => w.primaryDiscipline === "music").length,
    photography: works.filter((w) => w.primaryDiscipline === "photography").length,
    film: works.filter((w) => w.primaryDiscipline === "film").length,
    writing: works.filter((w) => w.primaryDiscipline === "writing").length,
    meta: meta.length,
  });

  const explorers = buildExplorers();
  const opportunities = buildOpportunities(creators);
  const interests = buildInterests(opportunities, explorers);
  const events = buildEvents(creators);
  const contacts = buildContacts(explorers, creators);
  const notifications = buildNotifications(explorers, creators, interests, contacts);
  const reports = buildReports(explorers, works);
  const waitlist = buildWaitlist();
  const claimTokens = buildClaims();
  let editorial = buildEditorial(creators, works);
  // fix opportunity editorial ref
  editorial = editorial.map((e) =>
    e.placement === "explore_opportunities" && !e.entityRef
      ? { ...e, entityRef: opportunities[0]!.slug }
      : e,
  );
  const audits = buildAudits();

  write("creators.json", creators);
  write("explorers.json", explorers);
  write("works.json", works);
  write("works.meta.json", meta);
  write("opportunities.json", opportunities);
  write("interests.json", interests);
  write("events.json", events);
  write("contacts.json", contacts);
  write("notifications.json", notifications);
  write("reports.json", reports);
  write("waitlist.json", waitlist);
  write("claim-tokens.json", claimTokens);
  write("editorial.json", editorial);
  write("audits.json", audits);

  // Validate meta coverage
  const metaSlugs = new Set(meta.map((m) => m.slug));
  const missing = works.filter((w) => !metaSlugs.has(w.slug));
  if (missing.length) {
    console.error("MISSING META", missing.map((m) => m.slug));
    process.exit(1);
  }
  console.log("fixture build complete");
}

main();
