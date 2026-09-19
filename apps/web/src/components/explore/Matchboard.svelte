<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { reveal, hueOf, initialsOf } from "../../lib/reveal";
  import { labelOf, payBadgeClass, dayOf, monthOf, type CreatorRow, type EventRow, type CollabRow } from "../../lib/directory";

  let {
    creators,
    events,
    collabs,
  }: {
    creators: CreatorRow[];
    events: EventRow[];
    collabs: CollabRow[];
  } = $props();

  let locale = $derived($localeStore);

  let openCreators = $derived(
    creators.filter((c) => {
      const a = (c.availability ?? "").toLowerCase();
      return a.includes("collab") || a.includes("open") || a.includes("available") || c.claimStatus === "claimed";
    }).slice(0, 12),
  );

  let pairs = $derived.by(() => {
    return collabs.slice(0, 8).map((o) => {
      const disc = (o.discipline ?? "").toLowerCase();
      const matches = openCreators.filter((c) => {
        const discs = (c.disciplines ?? []).map((d) => d.slug);
        if (disc && discs.includes(disc)) return true;
        if (!disc) return true;
        return discs.length === 0;
      }).slice(0, 3);
      return { opp: o, matches: matches.length ? matches : openCreators.slice(0, 2) };
    });
  });

  let nextNight = $derived(events.find((e) => e.isHubNight) ?? events[0] ?? null);
</script>

<section class="mb-8" use:reveal>
  <h2 class="m-0 text-2xl font-extrabold tracking-tight">Looking for ↔ offering</h2>
  <p class="m-0 mt-1 text-sm text-scifi-muted">
    Open calls paired with people on the roster. Directories stay the catalogs —
    <a use:link class="text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, "collaborate")}>all collabs →</a>
  </p>
</section>

<div class="space-y-4">
  {#each pairs as pair, i}
    <article class="console-panel" use:reveal={(i % 6) * 40}>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> match</span>
        {#if pair.opp.compensationStatus}
          <span class="badge badge-sm {payBadgeClass(pair.opp.compensationStatus)}">{labelOf(pair.opp.compensationStatus)}</span>
        {/if}
      </div>
      <div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <p class="label-kicker m-0 text-scifi-muted">need</p>
          <a use:link class="mt-1 block text-lg font-bold hover:text-scifi-primary" href={localePath(locale, `collaborate/${pair.opp.slug}`)}>
            {pair.opp.title}
          </a>
          <p class="mt-1 text-sm text-scifi-muted">
            {pair.opp.location ?? "—"} · {labelOf(pair.opp.discipline)}
            {#if pair.opp.roles} · {pair.opp.roles}{/if}
          </p>
        </div>
        <div>
          <p class="label-kicker m-0 text-scifi-muted">possible fits</p>
          <ul class="m-0 mt-2 list-none space-y-2 p-0">
            {#each pair.matches as c}
              <li>
                <a use:link class="flex items-center gap-2 hover:text-scifi-primary" href={localePath(locale, `u/${c.handle}`)}>
                  <span class="avatar avatar--sm" style="--h: {hueOf(c.handle)}">
                    {#if c.avatarUrl}<img src={c.avatarUrl} alt="" />{:else}{initialsOf(c.displayName)}{/if}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate font-medium">{c.displayName}</span>
                    <span class="block truncate text-xs text-scifi-muted">@{c.handle}</span>
                  </span>
                </a>
              </li>
            {:else}
              <li class="text-sm text-scifi-muted">No matches yet — browse creators.</li>
            {/each}
          </ul>
        </div>
      </div>
    </article>
  {:else}
    <p class="text-sm text-scifi-muted">No open collabs to match.</p>
  {/each}
</div>

<section class="mt-10" use:reveal>
  <div class="mb-3 flex items-end justify-between">
    <h3 class="m-0 text-lg font-bold">Open to collab</h3>
    <a use:link class="text-xs text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, "creators")}>Full roster →</a>
  </div>
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {#each openCreators.slice(0, 6) as c}
      <a use:link class="pane flex items-center gap-3 p-3 card-lift" href={localePath(locale, `u/${c.handle}`)}>
        <span class="avatar avatar--sm" style="--h: {hueOf(c.handle)}">
          {#if c.avatarUrl}<img src={c.avatarUrl} alt="" />{:else}{initialsOf(c.displayName)}{/if}
        </span>
        <span class="min-w-0">
          <span class="block truncate font-semibold">{c.displayName}</span>
          <span class="block truncate text-xs text-scifi-muted">{c.availability ?? "claimed · open"}</span>
        </span>
      </a>
    {/each}
  </div>
</section>

{#if nextNight}
  <section class="console-panel mt-10" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> IRL match moment</span>
    </div>
    <div class="flex flex-wrap items-center gap-4 p-5">
      <span class="date-block">
        <span class="date-block__day">{dayOf(nextNight.startsAt)}</span>
        <span class="date-block__month">{monthOf(nextNight.startsAt, locale)}</span>
      </span>
      <div class="min-w-0 flex-1">
        <div class="font-bold">{nextNight.name}</div>
        <div class="text-sm text-scifi-muted">Meet collaborators in person · {nextNight.venue}</div>
      </div>
      <a use:link class="btn-cta px-4 py-2 text-sm" href={localePath(locale, `events/${nextNight.slug}`)}>Details</a>
    </div>
  </section>
{/if}

<div class="mt-8 flex flex-wrap gap-2">
  <a use:link class="btn-cta px-4 py-2 text-sm" href={localePath(locale, "collaborate")}>Post a need</a>
  <a use:link class="cta-secondary" href={localePath(locale, "auth")}>Express interest →</a>
</div>
