<script lang="ts">
  import { onMount } from "svelte";
  import { DISCIPLINES } from "@creative-hub/shared";
  import { marketCities } from "../lib/i18n";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import CreatorsList from "../components/directory/CreatorsList.svelte";
  import { getMessages, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import { cityLabel, type CreatorRow } from "../lib/directory";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let q = $state("");
  let discipline = $state("");
  let city = $state("");
  let claimStatus = $state("");
  let foundingOnly = $state(false);
  let loading = $state(true);
  let creators = $state<CreatorRow[]>([]);

  async function load() {
    loading = true;
    const res = await gql<{ creators: CreatorRow[] }>(
      `query Creators($discipline: String, $city: String, $claimStatus: ClaimStatus, $isFounding: Boolean, $q: String) {
        creators(discipline: $discipline, city: $city, claimStatus: $claimStatus, isFounding: $isFounding, q: $q, limit: 80) {
          id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount
        }
      }`,
      {
        discipline: discipline || null,
        city: city || null,
        claimStatus: claimStatus || null,
        isFounding: foundingOnly ? true : null,
        q: q.trim() || null,
      },
    );
    creators = res.creators;
    loading = false;
  }

  function clearFilters() {
    q = "";
    discipline = "";
    city = "";
    claimStatus = "";
    foundingOnly = false;
    load();
  }

  onMount(load);
</script>

<main class="hub-page">
  <PageHero kicker="roster" title={t(messages, "nav.creators")} sub="Filter by craft, city, claim status, or founding cohort." />

  <div class="console-panel mb-8" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> filter</span>
      <div class="flex items-center gap-2">
        <span class="status-chip"><span class="dot"></span> {creators.length} live</span>
        <ViewModeToggle />
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-3 p-3 sm:p-4">
      <label class="form-control min-w-[10rem] flex-1">
        <span class="label-kicker mb-1 block text-scifi-muted">search</span>
        <input
          class="input input-bordered input-sm w-full"
          placeholder="name or handle"
          bind:value={q}
          onkeydown={(e) => e.key === "Enter" && load()}
        />
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">{t(messages, "search.discipline")}</span>
        <select class="select select-bordered select-sm" bind:value={discipline} onchange={load}>
          <option value="">All</option>
          {#each DISCIPLINES as d}<option value={d}>{d.replaceAll("_", " ")}</option>{/each}
        </select>
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">{t(messages, "search.city")}</span>
        <select class="select select-bordered select-sm" bind:value={city} onchange={load}>
          <option value="">All</option>
          {#each marketCities() as c}<option value={c}>{cityLabel(c, locale)}</option>{/each}
        </select>
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">claim</span>
        <select class="select select-bordered select-sm" bind:value={claimStatus} onchange={load}>
          <option value="">All</option>
          <option value="claimed">claimed</option>
          <option value="pending">pending</option>
          <option value="unclaimed">unclaimed</option>
        </select>
      </label>
      <label class="flex cursor-pointer items-center gap-2 pb-2 text-xs text-scifi-muted">
        <input type="checkbox" class="checkbox checkbox-xs checkbox-primary" bind:checked={foundingOnly} onchange={load} />
        founding only
      </label>
      <button class="btn-cta btn-sm px-4 py-2 text-xs" type="button" onclick={load}>Apply</button>
      <button class="btn btn-ghost btn-sm" type="button" onclick={clearFilters}>Clear</button>
    </div>
  </div>

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <div class="skeleton h-56"></div>
      {/each}
    </div>
  {:else}
    <CreatorsList items={creators} empty="No creators match these filters." />
  {/if}
</main>
