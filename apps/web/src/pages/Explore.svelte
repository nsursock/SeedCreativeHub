<script lang="ts">
  import { onMount } from "svelte";
  import PageHero from "../components/PageHero.svelte";
  import EditorialHome from "../components/explore/EditorialHome.svelte";
  import SceneStory from "../components/explore/SceneStory.svelte";
  import LivePulse from "../components/explore/LivePulse.svelte";
  import CityLens from "../components/explore/CityLens.svelte";
  import Matchboard from "../components/explore/Matchboard.svelte";
  import { getMessages, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { EXPLORE_MODES, exploreMode, type ExploreModeId } from "../lib/exploreMode";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import type { CreatorRow, WorkRow, EventRow, CollabRow } from "../lib/directory";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let data = $state<{
    featuredCreators: CreatorRow[];
    latestCreators: CreatorRow[];
    featuredWorks: WorkRow[];
    latestWorks: WorkRow[];
    featuredEvents: EventRow[];
    latestEvents: EventRow[];
    featuredOpportunities: CollabRow[];
    latestOpportunities: CollabRow[];
  } | null>(null);
  let error = $state("");

  let creators = $derived(
    !data ? [] : [...data.featuredCreators, ...data.latestCreators].filter(
      (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
    ),
  );
  let works = $derived(
    !data ? [] : [...data.featuredWorks, ...data.latestWorks].filter(
      (w, i, arr) => arr.findIndex((x) => x.id === w.id) === i,
    ),
  );
  let events = $derived(
    !data ? [] : [...data.featuredEvents, ...data.latestEvents].filter(
      (e, i, arr) => arr.findIndex((x) => x.id === e.id) === i,
    ),
  );
  let collabs = $derived(
    !data ? [] : [...data.featuredOpportunities, ...data.latestOpportunities].filter(
      (o, i, arr) => arr.findIndex((x) => x.id === o.id) === i,
    ),
  );

  let activeMeta = $derived(EXPLORE_MODES.find((m) => m.id === $exploreMode) ?? EXPLORE_MODES[0]);

  function setMode(id: ExploreModeId) {
    exploreMode.set(id);
  }

  onMount(async () => {
    try {
      const res = await gql<{ explore: typeof data }>(`
        query Explore {
          explore {
            featuredCreators {
              id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount availability
              disciplines { slug nameEn }
            }
            latestCreators {
              id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount availability
              disciplines { slug nameEn }
            }
            featuredWorks {
              id slug title type aiGenerated publishedAt viewCount
              profile { handle displayName }
              primaryDiscipline { slug nameEn }
              media { kind mimeType publicUrl externalUrl }
            }
            latestWorks {
              id slug title type aiGenerated publishedAt viewCount
              profile { handle displayName }
              primaryDiscipline { slug nameEn }
              media { kind mimeType publicUrl externalUrl }
            }
            featuredEvents { id slug name startsAt endsAt venue city category imageUrl isHubNight capacity }
            latestEvents { id slug name startsAt endsAt venue city category imageUrl isHubNight capacity }
            featuredOpportunities {
              id slug title location discipline remoteMode compensationStatus deadline interestCount imageUrl roles
            }
            latestOpportunities {
              id slug title location discipline remoteMode compensationStatus deadline interestCount imageUrl roles
            }
          }
        }
      `);
      data = res.explore;
    } catch (e) {
      error = e instanceof Error ? e.message : t(messages, "common.error");
    }
  });
</script>

<main class="hub-page">
  <PageHero
    kicker="home"
    title={t(messages, "explore.title")}
    sub={t(messages, "explore.modeSub")}
  />

  {#if error}<p class="text-error mb-4">{error}</p>{/if}

  <div class="console-panel mb-8" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> explore mode</span>
      <span class="status-chip"><span class="dot"></span> {activeMeta.label}</span>
    </div>
    <div class="space-y-3 p-3 sm:p-4">
      <p class="m-0 text-sm text-scifi-muted">{activeMeta.blurb}</p>
      <div class="flex flex-wrap gap-2">
        {#each EXPLORE_MODES as mode}
          <button
            type="button"
            class="btn btn-sm {$exploreMode === mode.id ? 'btn-primary' : 'btn-ghost'}"
            aria-pressed={$exploreMode === mode.id}
            onclick={() => setMode(mode.id)}
          >
            {mode.label}
          </button>
        {/each}
      </div>
      <p class="m-0 text-xs text-scifi-muted">
        Creators, works, events, and collabs live in the nav. Explore is a different lens — pick yours.
      </p>
    </div>
  </div>

  {#if !data}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <div class="skeleton h-48"></div>
      {/each}
    </div>
  {:else if $exploreMode === "editorial"}
    <EditorialHome {creators} {works} {events} {collabs} />
  {:else if $exploreMode === "story"}
    <SceneStory {creators} {works} {events} {collabs} />
  {:else if $exploreMode === "pulse"}
    <LivePulse {creators} {works} {events} {collabs} />
  {:else if $exploreMode === "lens"}
    <CityLens {creators} {works} {events} {collabs} />
  {:else}
    <Matchboard {creators} {events} {collabs} />
  {/if}
</main>
