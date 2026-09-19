<script lang="ts">
  import { DISCIPLINES, LEBANESE_CITIES } from "@creative-hub/shared";
  import { link } from "svelte-spa-router";
  import CreatorsList from "../directory/CreatorsList.svelte";
  import WorksList from "../directory/WorksList.svelte";
  import EventsList from "../directory/EventsList.svelte";
  import CollabsList from "../directory/CollabsList.svelte";
  import ViewModeToggle from "../ViewModeToggle.svelte";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { reveal } from "../../lib/reveal";
  import { labelOf, cityLabel, type CreatorRow, type WorkRow, type EventRow, type CollabRow } from "../../lib/directory";

  let {
    creators,
    works,
    events,
    collabs,
  }: {
    creators: CreatorRow[];
    works: WorkRow[];
    events: EventRow[];
    collabs: CollabRow[];
  } = $props();

  let locale = $derived($localeStore);
  let lensKind = $state<"city" | "discipline">("city");
  let city = $state<string>(LEBANESE_CITIES[0]);
  let discipline = $state<string>(DISCIPLINES[0]);

  let lensLabel = $derived(lensKind === "city" ? cityLabel(city, locale) : labelOf(discipline));

  let filteredCreators = $derived(
    creators.filter((c) =>
      lensKind === "city"
        ? (c.city ?? "").toLowerCase() === city
        : (c.disciplines ?? []).some((d) => d.slug === discipline),
    ),
  );
  let filteredWorks = $derived(
    works.filter((w) =>
      lensKind === "city"
        ? false // works don't carry city on row; show all for discipline, skip city filter via profile not available
        : w.primaryDiscipline?.slug === discipline,
    ),
  );
  // For city lens on works: we don't have city on WorkRow from explore — show latest works as atmosphere
  let worksForLens = $derived(lensKind === "discipline" ? filteredWorks : works.slice(0, 8));
  let filteredEvents = $derived(
    events.filter((e) => (lensKind === "city" ? (e.city ?? "").toLowerCase() === city : true)),
  );
  let filteredCollabs = $derived(
    collabs.filter((o) =>
      lensKind === "city"
        ? (o.location ?? "").toLowerCase().includes(city)
        : (o.discipline ?? "") === discipline,
    ),
  );
</script>

<div class="console-panel mb-8" use:reveal>
  <div class="pane-header">
    <span class="pane-title"><span class="pane-title-bar"></span> lens</span>
    <ViewModeToggle />
  </div>
  <div class="flex flex-wrap items-end gap-3 p-3 sm:p-4">
    <div class="flex gap-2">
      <button type="button" class="btn btn-sm {lensKind === 'city' ? 'btn-primary' : 'btn-ghost'}" onclick={() => (lensKind = "city")}>City</button>
      <button type="button" class="btn btn-sm {lensKind === 'discipline' ? 'btn-primary' : 'btn-ghost'}" onclick={() => (lensKind = "discipline")}>Craft</button>
    </div>
    {#if lensKind === "city"}
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">city</span>
        <select class="select select-bordered select-sm" bind:value={city}>
          {#each LEBANESE_CITIES as c}<option value={c}>{cityLabel(c, locale)}</option>{/each}
        </select>
      </label>
    {:else}
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">discipline</span>
        <select class="select select-bordered select-sm" bind:value={discipline}>
          {#each DISCIPLINES as d}<option value={d}>{labelOf(d)}</option>{/each}
        </select>
      </label>
    {/if}
    <div class="flex flex-wrap gap-2 pb-1 text-xs text-scifi-muted">
      <span class="badge badge-outline badge-sm">{filteredCreators.length} creators</span>
      <span class="badge badge-outline badge-sm">{worksForLens.length} works</span>
      <span class="badge badge-outline badge-sm">{filteredEvents.length} events</span>
      <span class="badge badge-outline badge-sm">{filteredCollabs.length} collabs</span>
    </div>
  </div>
</div>

<header class="mb-6" use:reveal>
  <h2 class="m-0 text-2xl font-extrabold tracking-tight">Scene through {lensLabel}</h2>
  <p class="m-0 mt-1 text-sm text-scifi-muted">
    Cross-cut of the four directories for this lens.
    <a use:link class="text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, lensKind === "city" ? `creators` : `works`)}>
      Open full directory →
    </a>
  </p>
</header>

<section class="mb-10 space-y-3">
  <h3 class="m-0 text-base font-bold">Creators</h3>
  <CreatorsList items={filteredCreators} empty={`No creators for ${lensLabel}.`} />
</section>

<section class="mb-10 space-y-3">
  <h3 class="m-0 text-base font-bold">Works</h3>
  <WorksList items={worksForLens} empty={`No works for ${lensLabel}.`} />
</section>

<section class="mb-10 space-y-3">
  <h3 class="m-0 text-base font-bold">Events</h3>
  <EventsList items={filteredEvents} empty={`No events for ${lensLabel}.`} />
</section>

<section class="space-y-3">
  <h3 class="m-0 text-base font-bold">Collabs</h3>
  <CollabsList items={filteredCollabs} empty={`No collabs for ${lensLabel}.`} />
</section>
