<script lang="ts">
  import { link } from "svelte-spa-router";
  import { DISCIPLINES, LEBANESE_CITIES } from "@creative-hub/shared";
  import IconSearch from "@tabler/icons-svelte/icons/search";
  import PageHero from "../components/PageHero.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf } from "../lib/reveal";
  import { cityLabel } from "../lib/directory";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let q = $state("");
  let discipline = $state("");
  let city = $state("");
  let searching = $state(false);
  let result = $state<any>(null);

  async function run(e?: Event) {
    e?.preventDefault();
    searching = true;
    const res = await gql<{ search: any }>(
      `query($q: String!, $discipline: String, $city: String) {
        search(q: $q, discipline: $discipline, city: $city) {
          creators { handle displayName city avatarUrl }
          works { slug title media { publicUrl externalUrl } }
          events { slug name }
          opportunities { slug title }
        }
      }`,
      { q, discipline: discipline || null, city: city || null },
    );
    result = res.search;
    searching = false;
  }
</script>

<main class="hub-page">
  <PageHero kicker="query" title={t(messages, "search.title")} sub="Search creators, works, events, and collabs." />

  <form class="console-panel mb-8" onsubmit={run} use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> browse</span>
      <span class="status-chip"><span class="dot"></span> query</span>
    </div>
    <div class="flex flex-wrap items-end gap-3 p-3 sm:p-4">
      <label class="form-control min-w-[14rem] flex-1">
        <span class="label-kicker mb-1 block text-scifi-muted">search</span>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-scifi-muted">
            <IconSearch size={15} />
          </span>
          <input
            class="input input-bordered input-sm w-full ps-9"
            placeholder={t(messages, "search.placeholder")}
            bind:value={q}
          />
        </div>
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">{t(messages, "search.discipline")}</span>
        <select class="select select-bordered select-sm" bind:value={discipline}>
          <option value="">All</option>
          {#each DISCIPLINES as d}<option value={d}>{d.replaceAll("_", " ")}</option>{/each}
        </select>
      </label>
      <label class="form-control">
        <span class="label-kicker mb-1 block text-scifi-muted">{t(messages, "search.city")}</span>
        <select class="select select-bordered select-sm" bind:value={city}>
          <option value="">All</option>
          {#each LEBANESE_CITIES as c}<option value={c}>{cityLabel(c, locale)}</option>{/each}
        </select>
      </label>
      <button class="btn-cta btn-sm px-4 py-2 text-xs" type="submit">{t(messages, "search.submit")}</button>
    </div>
  </form>

  {#if searching}
    <div class="grid gap-3 sm:grid-cols-2">
      {#each Array(4) as _}
        <div class="skeleton h-20"></div>
      {/each}
    </div>
  {:else if result}
    <div class="grid gap-10 md:grid-cols-2">
      <section use:reveal>
        <h2 class="pane-title mb-4 text-base"><span class="pane-title-bar"></span>{t(messages, "nav.creators")}</h2>
        <ul class="m-0 list-none space-y-2 p-0">
          {#each result.creators as c}
            <li>
              <a
                use:link
                class="pane pane-bracketed card-lift flex items-center gap-3 px-4 py-3"
                href={localePath(locale, `u/${c.handle}`)}
              >
                <span class="avatar avatar--sm" style="--h: {hueOf(c.handle)}">
                  {#if c.avatarUrl}
                    <img src={c.avatarUrl} alt="" loading="lazy" />
                  {:else}
                    {initialsOf(c.displayName)}
                  {/if}
                </span>
                <span class="min-w-0">
                  <span class="block truncate font-medium">{c.displayName}</span>
                  <span class="block truncate text-xs text-scifi-muted">@{c.handle} · {cityLabel(c.city, locale)}</span>
                </span>
              </a>
            </li>
          {/each}
        </ul>
      </section>
      <section use:reveal={80}>
        <h2 class="pane-title mb-4 text-base"><span class="pane-title-bar"></span>Works</h2>
        <ul class="m-0 list-none space-y-2 p-0">
          {#each result.works as w}
            <li class="pane pane-bracketed card-lift px-4 py-3">
              <a use:link class="font-medium hover:text-scifi-primary" href={localePath(locale, `works/${w.slug}`)}
                >{w.title}</a
              >
            </li>
          {/each}
        </ul>
      </section>
      <section use:reveal={120}>
        <h2 class="pane-title mb-4 text-base"><span class="pane-title-bar"></span>{t(messages, "nav.events")}</h2>
        <ul class="m-0 list-none space-y-2 p-0">
          {#each result.events as e}
            <li class="pane pane-bracketed card-lift px-4 py-3">
              <a use:link class="font-medium hover:text-scifi-primary" href={localePath(locale, `events/${e.slug}`)}
                >{e.name}</a
              >
            </li>
          {/each}
        </ul>
      </section>
      <section use:reveal={160}>
        <h2 class="pane-title mb-4 text-base"><span class="pane-title-bar"></span>{t(messages, "nav.collaborate")}</h2>
        <ul class="m-0 list-none space-y-2 p-0">
          {#each result.opportunities as o}
            <li class="pane pane-bracketed card-lift px-4 py-3">
              <a use:link class="font-medium hover:text-scifi-primary" href={localePath(locale, `collaborate/${o.slug}`)}
                >{o.title}</a
              >
            </li>
          {/each}
        </ul>
      </section>
    </div>
  {/if}
</main>
