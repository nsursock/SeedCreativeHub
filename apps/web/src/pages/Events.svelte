<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import EventsList from "../components/directory/EventsList.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import { dayOf, monthOf, cityLabel, type EventRow } from "../lib/directory";

  let { params }: { params?: { slug?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let list = $state<EventRow[]>([]);
  let detail = $state<any>(null);
  let loading = $state(true);
  let hubOnly = $state(false);

  let visible = $derived(hubOnly ? list.filter((e) => e.isHubNight) : list);

  onMount(async () => {
    if (params?.slug) {
      const res = await gql<{ event: any }>(
        `query($slug: String!) {
          event(slug: $slug) {
            id name slug description startsAt endsAt venue city category externalUrl imageUrl isHubNight capacity
          }
        }`,
        { slug: params.slug },
      );
      detail = res.event;
    } else {
      const res = await gql<{ events: EventRow[] }>(
        `query {
          events(limit: 40, upcomingOnly: false) {
            id slug name startsAt endsAt venue city category imageUrl isHubNight capacity status
          }
        }`,
      );
      list = res.events;
    }
    loading = false;
  });
</script>

<main class="hub-page">
  <PageHero kicker="calendar" title={t(messages, "events.title")} sub="Upcoming and recent Hub Nights and scene listings." />

  {#if !params?.slug}
    <div class="console-panel mb-8" use:reveal>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> browse</span>
        <div class="flex items-center gap-2">
          <span class="status-chip"><span class="dot"></span> {visible.length} listed</span>
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
          <span class="date-block__month">{monthOf(detail.startsAt, locale)}</span>
        </span>
        <div class="min-w-0 space-y-3">
          <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{detail.name}</h2>
          <p class="m-0 text-sm text-scifi-muted">
            {new Date(detail.startsAt).toLocaleString(locale)} · {detail.venue} · {cityLabel(detail.city, locale)}
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
  {:else}
    <EventsList items={visible} empty={t(messages, "events.empty")} />
  {/if}
</main>
