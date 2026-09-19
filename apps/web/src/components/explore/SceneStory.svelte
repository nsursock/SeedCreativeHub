<script lang="ts">
  import { link } from "svelte-spa-router";
  import { getMessages, localePath, t } from "../../lib/i18n";
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

  let storyWork = $derived(works[0] ?? null);
  let storyCreator = $derived(creators[0] ?? null);
  let storyEvent = $derived(events[0] ?? null);
  let storyCollab = $derived(collabs[0] ?? null);
  let relatedCreators = $derived(creators.slice(1, 4));
  let relatedWorks = $derived(works.slice(1, 4));
</script>

<article class="space-y-8">
  <header class="console-panel relative overflow-hidden" use:reveal>
    {#if storyWork && workCoverUrl(storyWork)}
      <img class="absolute inset-0 h-full w-full object-cover opacity-30" src={workCoverUrl(storyWork)} alt="" />
    {:else if storyEvent?.imageUrl}
      <img class="absolute inset-0 h-full w-full object-cover opacity-30" src={storyEvent.imageUrl} alt="" />
    {/if}
    <div class="pane-scan"></div>
    <div class="relative space-y-3 p-8 sm:p-12">
      <p class="label-kicker m-0 text-scifi-primary">// scene story</p>
      <h2 class="m-0 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
        {#if storyCreator && storyWork}
          {storyCreator.displayName} and the work reshaping {storyCreator.city ? cityLabel(storyCreator.city, locale) : t(messages, "explore.sceneStoryPlaceFallback")}
        {:else}
          {t(messages, "explore.sceneStoryPeople")}
        {/if}
      </h2>
      <p class="m-0 max-w-xl text-sm text-scifi-muted">
        {t(messages, "explore.sceneStoryArc")}
      </p>
    </div>
  </header>

  {#if storyCreator}
    <section class="pane p-5 sm:p-6" use:reveal={40}>
      <p class="label-kicker text-scifi-muted">01 · the person</p>
      <div class="mt-3 flex items-center gap-4">
        <span class="avatar" style="--h: {hueOf(storyCreator.handle)}">
          {#if storyCreator.avatarUrl}<img src={storyCreator.avatarUrl} alt="" />{:else}{initialsOf(storyCreator.displayName)}{/if}
        </span>
        <div>
          <a use:link class="text-xl font-bold hover:text-scifi-primary" href={localePath(locale, `u/${storyCreator.handle}`)}>
            {storyCreator.displayName}
          </a>
          <div class="text-sm text-scifi-muted">@{storyCreator.handle} · {cityLabel(storyCreator.city, locale)}</div>
        </div>
      </div>
    </section>
  {/if}

  {#if storyWork}
    <section class="pane overflow-hidden p-0" use:reveal={80}>
      <div class="work-thumb min-h-48 sm:min-h-64" class:work-thumb--photo={!!workCoverUrl(storyWork)} style="--h: {hueOf(storyWork.slug)}">
        {#if workCoverUrl(storyWork)}<img src={workCoverUrl(storyWork)} alt="" loading="lazy" />{/if}
      </div>
      <div class="p-5 sm:p-6">
        <p class="label-kicker text-scifi-muted">02 · the work</p>
        <a use:link class="mt-2 block text-xl font-bold hover:text-scifi-primary" href={localePath(locale, `works/${storyWork.slug}`)}>
          {storyWork.title}
        </a>
        <p class="mt-1 text-sm text-scifi-muted">{storyWork.type} · {storyWork.primaryDiscipline?.nameEn ?? "—"}</p>
      </div>
    </section>
  {/if}

  {#if storyCollab}
    <section class="pane p-5 sm:p-6" use:reveal={120}>
      <p class="label-kicker text-scifi-muted">03 · the need</p>
      <a use:link class="mt-2 block text-xl font-bold hover:text-scifi-primary" href={localePath(locale, `collaborate/${storyCollab.slug}`)}>
        {storyCollab.title}
      </a>
      <p class="mt-1 text-sm text-scifi-muted">{storyCollab.location} · {labelOf(storyCollab.discipline)}</p>
    </section>
  {/if}

  {#if storyEvent}
    <section class="pane p-5 sm:p-6" use:reveal={160}>
      <p class="label-kicker text-scifi-muted">04 · the night</p>
      <div class="mt-3 flex items-center gap-4">
        <span class="date-block">
          <span class="date-block__day">{dayOf(storyEvent.startsAt)}</span>
          <span class="date-block__month">{monthOf(storyEvent.startsAt, locale)}</span>
        </span>
        <div>
          <a use:link class="text-xl font-bold hover:text-scifi-primary" href={localePath(locale, `events/${storyEvent.slug}`)}>
            {storyEvent.name}
          </a>
          <div class="text-sm text-scifi-muted">{storyEvent.venue} · {cityLabel(storyEvent.city, locale)}</div>
        </div>
      </div>
    </section>
  {/if}

  <section use:reveal={200}>
    <h3 class="mb-3 text-lg font-bold">Related in this story</h3>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {#each relatedCreators as c}
        <a use:link class="pane flex items-center gap-3 p-3" href={localePath(locale, `u/${c.handle}`)}>
          <span class="avatar avatar--sm" style="--h: {hueOf(c.handle)}">
            {#if c.avatarUrl}<img src={c.avatarUrl} alt="" />{:else}{initialsOf(c.displayName)}{/if}
          </span>
          <span class="truncate font-medium">{c.displayName}</span>
        </a>
      {/each}
      {#each relatedWorks as w}
        <a use:link class="pane p-3" href={localePath(locale, `works/${w.slug}`)}>
          <span class="block truncate font-medium">{w.title}</span>
          <span class="text-xs text-scifi-muted">{w.profile.displayName}</span>
        </a>
      {/each}
    </div>
  </section>
</article>
