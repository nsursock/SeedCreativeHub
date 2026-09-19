<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { viewMode } from "../lib/viewMode";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";

  let { params }: { params?: { slug?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let list = $state<any[]>([]);
  let detail = $state<any>(null);
  let loading = $state(true);
  let hubOnly = $state(false);

  function dayOf(iso: string) {
    return new Date(iso).getDate().toString().padStart(2, "0");
  }
  function monthOf(iso: string) {
    return new Date(iso).toLocaleString(locale, { month: "short" });
  }

  let visible = $derived(hubOnly ? list.filter((e) => e.isHubNight) : list);

  onMount(async () => {
    if (params?.slug) {
      const res = await gql<{ event: any }>(
        `query($slug: String!) {
          event(slug: $slug) {
            id name slug description startsAt endsAt venue city externalUrl imageUrl isHubNight
          }
        }`,
        { slug: params.slug },
      );
      detail = res.event;
    } else {
      const res = await gql<{ events: any[] }>(
        `query { events(limit: 40) { id slug name startsAt venue city imageUrl isHubNight } }`,
      );
      list = res.events;
    }
    loading = false;
  });
</script>

<main class="hub-page">
  <PageHero kicker="calendar" title={t(messages, "events.title")} sub="Upcoming Hub Nights and scene listings." />

  {#if !params?.slug}
    <div class="console-panel mb-8" use:reveal>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> browse</span>
        <div class="flex items-center gap-2">
          <span class="status-chip"><span class="dot"></span> {visible.length} live</span>
          <ViewModeToggle />
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <label class="flex cursor-pointer items-center gap-2 text-xs text-scifi-muted">
          <input type="checkbox" class="checkbox checkbox-xs checkbox-primary" bind:checked={hubOnly} />
          {t(messages, "events.hubNight")} only
        </label>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each Array(4) as _}
        <div class="skeleton h-56"></div>
      {/each}
    </div>
  {:else if detail}
    <article class="console-panel relative overflow-hidden" use:reveal>
      {#if detail.imageUrl}
        <img class="absolute inset-0 h-full w-full object-cover opacity-30" src={detail.imageUrl} alt="" loading="lazy" />
      {/if}
      <div class="pane-scan"></div>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> event</span>
        {#if detail.isHubNight}<span class="badge badge-primary">{t(messages, "events.hubNight")}</span>{/if}
      </div>
      <div class="relative flex gap-5 p-6 sm:p-8">
        <span class="date-block h-fit">
          <span class="date-block__day">{dayOf(detail.startsAt)}</span>
          <span class="date-block__month">{monthOf(detail.startsAt)}</span>
        </span>
        <div class="min-w-0 space-y-3">
          <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{detail.name}</h2>
          <p class="m-0 text-sm text-scifi-muted">
            {new Date(detail.startsAt).toLocaleString(locale)} · {detail.venue} · {detail.city}
          </p>
          <p class="m-0 leading-relaxed text-scifi-muted">{detail.description}</p>
          {#if detail.externalUrl}
            <a class="btn-cta mt-1 px-4 py-2 text-sm" href={detail.externalUrl} target="_blank" rel="noreferrer"
              >Tickets / info ↗</a
            >
          {/if}
        </div>
      </div>
    </article>
  {:else if visible.length === 0}
    <p class="text-scifi-muted">{t(messages, "events.empty")}</p>
  {:else if $viewMode === "table"}
    <div class="hub-table-wrap" use:reveal>
      <table class="hub-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Name</th>
            <th>Venue</th>
            <th>City</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each visible as e}
            <tr>
              <td class="whitespace-nowrap text-scifi-muted">{dayOf(e.startsAt)} {monthOf(e.startsAt)}</td>
              <td class="font-medium">
                <a use:link class="hover:text-scifi-primary" href={localePath(locale, `events/${e.slug}`)}>{e.name}</a>
              </td>
              <td class="text-scifi-muted">{e.venue ?? "—"}</td>
              <td class="text-scifi-muted">{e.city ?? "—"}</td>
              <td>
                {#if e.isHubNight}<span class="badge badge-primary badge-sm">{t(messages, "events.hubNight")}</span>{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
      {#each visible as e, i}
        <li use:reveal={(i % 6) * 50}>
          <a
            use:link
            class="pane pane-bracketed card-lift flex h-full flex-col overflow-hidden p-0"
            href={localePath(locale, `events/${e.slug}`)}
          >
            <div class="feature-thumb">
              {#if e.imageUrl}
                <img src={e.imageUrl} alt="" loading="lazy" />
              {/if}
            </div>
            <span class="flex flex-1 items-center gap-4 p-4 sm:p-5">
              <span class="date-block">
                <span class="date-block__day">{dayOf(e.startsAt)}</span>
                <span class="date-block__month">{monthOf(e.startsAt)}</span>
              </span>
              <span class="min-w-0">
                <span class="block truncate text-base font-semibold">{e.name}</span>
                <span class="mt-0.5 block truncate text-sm text-scifi-muted">{e.venue} · {e.city}</span>
                {#if e.isHubNight}
                  <span class="badge badge-primary badge-sm mt-1.5">{t(messages, "events.hubNight")}</span>
                {/if}
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>
