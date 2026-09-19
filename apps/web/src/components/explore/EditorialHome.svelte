<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath, getMessages, t } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { reveal, hueOf, workCoverUrl, initialsOf } from "../../lib/reveal";
  import { dayOf, monthOf, labelOf, cityLabel, type CreatorRow, type WorkRow, type EventRow, type CollabRow } from "../../lib/directory";

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
  let messages = $derived(getMessages(locale));

  let heroWork = $derived(works[0] ?? null);
  let heroCreator = $derived(creators[0] ?? null);
  let nextNight = $derived(events.find((e) => e.isHubNight) ?? events[0] ?? null);
  let openCalls = $derived(collabs.slice(0, 4));
  let newCreators = $derived(creators.slice(0, 6));
  let newWorks = $derived(works.slice(0, 6));
</script>

{#if heroWork}
  <section class="console-panel relative mb-8 overflow-hidden" use:reveal>
    {#if workCoverUrl(heroWork)}
      <img class="absolute inset-0 h-full w-full object-cover opacity-25" src={workCoverUrl(heroWork)} alt="" />
    {/if}
    <div class="pane-scan"></div>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> featured story</span>
      <span class="badge badge-primary badge-sm">editorial</span>
    </div>
    <div class="relative grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
      <div class="min-w-0 space-y-3">
        <p class="label-kicker m-0 text-scifi-primary">// this week</p>
        <h2 class="m-0 text-2xl font-extrabold tracking-tight sm:text-3xl">{heroWork.title}</h2>
        <p class="m-0 text-sm text-scifi-muted">
          by
          <a use:link class="text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, `u/${heroWork.profile.handle}`)}>
            {heroWork.profile.displayName}
          </a>
          {#if heroWork.primaryDiscipline}
            · {heroWork.primaryDiscipline.nameEn}
          {/if}
        </p>
        <div class="flex flex-wrap gap-2 pt-2">
          <a use:link class="btn-cta px-4 py-2 text-sm" href={localePath(locale, `works/${heroWork.slug}`)}>Open work</a>
          <a use:link class="cta-secondary" href={localePath(locale, "works")}>All works →</a>
        </div>
      </div>
      <a
        use:link
        class="work-thumb min-h-44 sm:min-h-56"
        class:work-thumb--photo={!!workCoverUrl(heroWork)}
        style="--h: {hueOf(heroWork.slug)}"
        href={localePath(locale, `works/${heroWork.slug}`)}
      >
        {#if workCoverUrl(heroWork)}
          <img src={workCoverUrl(heroWork)} alt="" loading="lazy" />
        {/if}
        <span class="work-thumb__type">{heroWork.type}</span>
      </a>
    </div>
  </section>
{:else if heroCreator}
  <section class="console-panel mb-8 p-6 sm:p-8" use:reveal>
    <p class="label-kicker text-scifi-primary">// featured creator</p>
    <h2 class="mt-2 text-2xl font-extrabold">{heroCreator.displayName}</h2>
    <a use:link class="btn-cta mt-4 inline-flex px-4 py-2 text-sm" href={localePath(locale, `u/${heroCreator.handle}`)}>View profile</a>
  </section>
{/if}

<section class="mb-10" use:reveal>
  <div class="mb-4 flex items-end justify-between gap-3">
    <div>
      <h3 class="m-0 text-lg font-bold">New this week</h3>
      <p class="m-0 mt-1 text-sm text-scifi-muted">Fresh people and work across the Hub.</p>
    </div>
    <a use:link class="text-xs text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, "creators")}>See all creators →</a>
  </div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each newCreators as c, i}
      <a use:link use:reveal={(i % 6) * 40} class="pane flex items-center gap-3 p-3 card-lift" href={localePath(locale, `u/${c.handle}`)}>
        <span class="avatar avatar--sm" style="--h: {hueOf(c.handle)}">
          {#if c.avatarUrl}<img src={c.avatarUrl} alt="" />{:else}{initialsOf(c.displayName)}{/if}
        </span>
        <span class="min-w-0">
          <span class="block truncate font-semibold">{c.displayName}</span>
          <span class="block truncate text-xs text-scifi-muted">@{c.handle} · {cityLabel(c.city, locale)}</span>
        </span>
      </a>
    {/each}
  </div>
  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each newWorks.slice(0, 3) as w}
      <a use:link class="pane overflow-hidden p-0 card-lift" href={localePath(locale, `works/${w.slug}`)}>
        <div class="work-thumb h-28" class:work-thumb--photo={!!workCoverUrl(w)} style="--h: {hueOf(w.slug)}">
          {#if workCoverUrl(w)}<img src={workCoverUrl(w)} alt="" loading="lazy" />{/if}
        </div>
        <div class="p-3">
          <div class="truncate font-semibold">{w.title}</div>
          <div class="truncate text-xs text-scifi-muted">{w.profile.displayName}</div>
        </div>
      </a>
    {/each}
  </div>
</section>

<section class="mb-10" use:reveal>
  <div class="mb-4 flex items-end justify-between gap-3">
    <div>
      <h3 class="m-0 text-lg font-bold">Open calls worth answering</h3>
      <p class="m-0 mt-1 text-sm text-scifi-muted">Collabs editors want you to see.</p>
    </div>
    <a use:link class="text-xs text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, "collaborate")}>All collabs →</a>
  </div>
  <div class="grid gap-3 sm:grid-cols-2">
    {#each openCalls as o}
      <a use:link class="pane p-4 card-lift" href={localePath(locale, `collaborate/${o.slug}`)}>
        <div class="font-semibold">{o.title}</div>
        <div class="mt-1 text-sm text-scifi-muted">{o.location} · {labelOf(o.discipline)}</div>
        {#if o.compensationStatus}
          <span class="badge badge-outline badge-sm mt-2">{labelOf(o.compensationStatus)}</span>
        {/if}
      </a>
    {/each}
  </div>
</section>

{#if nextNight}
  <section class="console-panel mb-8" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> next hub night</span>
      {#if nextNight.isHubNight}<span class="badge badge-primary badge-sm">{t(messages, "events.hubNight")}</span>{/if}
    </div>
    <div class="flex flex-wrap items-center gap-4 p-5 sm:p-6">
      <span class="date-block">
        <span class="date-block__day">{dayOf(nextNight.startsAt)}</span>
        <span class="date-block__month">{monthOf(nextNight.startsAt, locale)}</span>
      </span>
      <div class="min-w-0 flex-1">
        <div class="truncate text-lg font-bold">{nextNight.name}</div>
        <div class="text-sm text-scifi-muted">{nextNight.venue} · {cityLabel(nextNight.city, locale)}</div>
      </div>
      <a use:link class="btn-cta px-4 py-2 text-sm" href={localePath(locale, `events/${nextNight.slug}`)}>Details</a>
      <a use:link class="cta-secondary" href={localePath(locale, "events")}>Calendar →</a>
    </div>
  </section>
{/if}

<section class="pane p-5 sm:p-6" use:reveal>
  <h3 class="m-0 text-lg font-bold">Ship something</h3>
  <p class="m-0 mt-1 text-sm text-scifi-muted">Publish a work, post a collab, or claim your profile.</p>
  <div class="mt-4 flex flex-wrap gap-2">
    <a use:link class="btn-cta px-4 py-2 text-sm" href={localePath(locale, "auth")}>{t(messages, "nav.create")}</a>
    <a use:link class="cta-secondary" href={localePath(locale, "creators")}>Browse creators →</a>
  </div>
</section>
