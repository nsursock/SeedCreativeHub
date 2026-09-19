<script lang="ts">
  import { onMount } from "svelte";
  import { DISCIPLINES, WORK_TYPES } from "@creative-hub/shared";
  import { marketCities } from "../lib/i18n";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import WorksList from "../components/directory/WorksList.svelte";
  import { getMessages, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import { cityLabel, type WorkRow } from "../lib/directory";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let q = $state("");
  let discipline = $state("");
  let city = $state("");
  let type = $state("");
  let loading = $state(true);
  let works = $state<WorkRow[]>([]);

  async function load() {
    loading = true;
    const res = await gql<{ works: WorkRow[] }>(
      `query Works($discipline: String, $city: String, $type: WorkType, $q: String) {
        works(discipline: $discipline, city: $city, type: $type, q: $q, limit: 80) {
          id slug title type publishedAt viewCount
          profile { handle displayName }
          primaryDiscipline { slug nameEn }
          media { publicUrl externalUrl }
        }
      }`,
      {
        discipline: discipline || null,
        city: city || null,
        type: type || null,
        q: q.trim() || null,
      },
    );
    works = res.works;
    loading = false;
  }

  function clearFilters() {
    q = "";
    discipline = "";
    city = "";
    type = "";
    load();
  }

  onMount(load);
</script>

<main class="hub-page">
  <PageHero kicker="catalog" title={t(messages, "nav.works")} sub="Browse published work across music, photo, film, and writing." />

  <div class="console-panel mb-8" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> filter</span>
      <div class="flex items-center gap-2">
        <span class="status-chip"><span class="dot"></span> {works.length} live</span>
        <ViewModeToggle />
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-3 p-3 sm:p-4">
      <label class="form-control min-w-[10rem] flex-1">
        <span class="label-kicker mb-1 block text-scifi-muted">search</span>
        <input
          class="input input-bordered input-sm w-full"
          placeholder="title"
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
        <span class="label-kicker mb-1 block text-scifi-muted">type</span>
        <select class="select select-bordered select-sm" bind:value={type} onchange={load}>
          <option value="">All</option>
          {#each WORK_TYPES as wt}<option value={wt}>{wt}</option>{/each}
        </select>
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">{t(messages, "search.city")}</span>
        <select class="select select-bordered select-sm" bind:value={city} onchange={load}>
          <option value="">All</option>
          {#each marketCities() as c}<option value={c}>{cityLabel(c, locale)}</option>{/each}
        </select>
      </label>
      <button class="btn-cta btn-sm px-4 py-2 text-xs" type="button" onclick={load}>Apply</button>
      <button class="btn btn-ghost btn-sm" type="button" onclick={clearFilters}>Clear</button>
    </div>
  </div>

  {#if loading}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each Array(8) as _}
        <div class="skeleton h-48"></div>
      {/each}
    </div>
  {:else}
    <WorksList items={works} empty="No works match these filters." />
  {/if}
</main>
