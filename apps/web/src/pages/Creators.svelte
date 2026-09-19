<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { DISCIPLINES, LEBANESE_CITIES } from "@creative-hub/shared";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { viewMode } from "../lib/viewMode";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf } from "../lib/reveal";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let q = $state("");
  let discipline = $state("");
  let city = $state("");
  let claimStatus = $state("");
  let foundingOnly = $state(false);
  let loading = $state(true);
  let creators = $state<
    Array<{
      id: string;
      handle: string;
      displayName: string;
      city?: string;
      claimStatus: string;
      avatarUrl?: string | null;
      coverUrl?: string | null;
      isFounding?: boolean;
      worksCount: number;
      disciplines: Array<{ slug: string }>;
    }>
  >([]);

  async function load() {
    loading = true;
    const res = await gql<{ creators: typeof creators }>(
      `query Creators($discipline: String, $city: String, $claimStatus: ClaimStatus, $isFounding: Boolean, $q: String) {
        creators(discipline: $discipline, city: $city, claimStatus: $claimStatus, isFounding: $isFounding, q: $q, limit: 80) {
          id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount
          disciplines { slug }
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
          {#each LEBANESE_CITIES as c}<option value={c}>{c}</option>{/each}
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
  {:else if creators.length === 0}
    <p class="text-sm text-scifi-muted">No creators match these filters.</p>
  {:else if $viewMode === "table"}
    <div class="hub-table-wrap" use:reveal>
      <table class="hub-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Handle</th>
            <th>City</th>
            <th>Works</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each creators as c}
            <tr>
              <td>
                <a use:link href={localePath(locale, `u/${c.handle}`)} class="avatar avatar--sm inline-grid" style="--h: {hueOf(c.handle)}">
                  {#if c.avatarUrl}
                    <img src={c.avatarUrl} alt="" loading="lazy" />
                  {:else}
                    {initialsOf(c.displayName)}
                  {/if}
                </a>
              </td>
              <td class="font-medium">
                <a use:link class="hover:text-scifi-primary" href={localePath(locale, `u/${c.handle}`)}>{c.displayName}</a>
              </td>
              <td class="font-mono text-scifi-cyan">@{c.handle}</td>
              <td class="text-scifi-muted">{c.city ?? "—"}</td>
              <td>{c.worksCount}</td>
              <td>
                {#if c.isFounding}<span class="badge badge-primary badge-sm me-1">founding</span>{/if}
                {#if c.claimStatus !== "claimed"}
                  <span class="badge badge-warning badge-sm">{c.claimStatus}</span>
                {:else}
                  <span class="badge badge-success badge-sm">claimed</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each creators as c, i}
        <a
          use:link
          use:reveal={(i % 9) * 50}
          class="creator-card pane pane-bracketed card-lift"
          href={localePath(locale, `u/${c.handle}`)}
        >
          <div class="creator-card__cover" style="--h: {hueOf(c.handle)}">
            {#if c.coverUrl}
              <img src={c.coverUrl} alt="" loading="lazy" />
            {/if}
          </div>
          <div class="creator-card__body">
            <span class="creator-card__avatar" style="--h: {hueOf(c.handle)}">
              {#if c.avatarUrl}
                <img src={c.avatarUrl} alt="" loading="lazy" />
              {:else}
                <span class="creator-card__avatar-fallback">{initialsOf(c.displayName)}</span>
              {/if}
            </span>
            <span class="block truncate pe-14 text-base font-semibold">{c.displayName}</span>
            <span class="mt-0.5 block truncate pe-14 text-xs text-scifi-muted">@{c.handle} · {c.city ?? "—"}</span>
            <span class="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span class="badge badge-outline badge-sm">{c.worksCount} {c.worksCount === 1 ? "work" : "works"}</span>
              {#if c.isFounding}<span class="badge badge-primary badge-sm">founding</span>{/if}
              {#if c.claimStatus !== "claimed"}
                <span class="badge badge-warning badge-sm">{c.claimStatus}</span>
              {/if}
            </span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</main>
