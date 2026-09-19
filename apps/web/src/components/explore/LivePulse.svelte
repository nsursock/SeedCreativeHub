<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { reveal } from "../../lib/reveal";
  import { shortDate, cityLabel, type CreatorRow, type WorkRow, type EventRow, type CollabRow } from "../../lib/directory";

  type PulseKind = "work" | "creator" | "event" | "collab";
  type PulseItem = {
    id: string;
    kind: PulseKind;
    at: number;
    title: string;
    meta: string;
    href: string;
  };

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
  let filter = $state<"all" | PulseKind>("all");

  let items = $derived.by(() => {
    const rows: PulseItem[] = [];
    for (const w of works) {
      rows.push({
        id: `w-${w.id}`,
        kind: "work",
        at: w.publishedAt ? new Date(w.publishedAt).getTime() : 0,
        title: w.title,
        meta: `${w.profile.displayName} published a ${w.type}`,
        href: localePath(locale, `works/${w.slug}`),
      });
    }
    for (const c of creators) {
      rows.push({
        id: `c-${c.id}`,
        kind: "creator",
        at: Date.now() - creators.indexOf(c) * 86_400_000,
        title: c.displayName,
        meta: `@${c.handle} joined the roster · ${cityLabel(c.city, locale)}`,
        href: localePath(locale, `u/${c.handle}`),
      });
    }
    for (const e of events) {
      rows.push({
        id: `e-${e.id}`,
        kind: "event",
        at: new Date(e.startsAt).getTime(),
        title: e.name,
        meta: `${e.isHubNight ? "Hub Night" : "Event"} · ${e.venue ?? ""} · ${cityLabel(e.city, locale)}`,
        href: localePath(locale, `events/${e.slug}`),
      });
    }
    for (const o of collabs) {
      rows.push({
        id: `o-${o.id}`,
        kind: "collab",
        at: o.deadline ? new Date(o.deadline).getTime() : Date.now() - collabs.indexOf(o) * 43_200_000,
        title: o.title,
        meta: `Open call · ${o.location ?? "—"} · ${o.interestCount ?? 0} interested`,
        href: localePath(locale, `collaborate/${o.slug}`),
      });
    }
    return rows.sort((a, b) => b.at - a.at);
  });

  let visible = $derived(filter === "all" ? items : items.filter((i) => i.kind === filter));
  let nextNight = $derived(events.find((e) => e.isHubNight) ?? events[0] ?? null);

  const filters: Array<{ id: typeof filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "work", label: "Works" },
    { id: "creator", label: "Creators" },
    { id: "event", label: "Events" },
    { id: "collab", label: "Collabs" },
  ];
</script>

{#if nextNight}
  <div class="console-panel mb-6" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> pinned</span>
      <span class="status-chip"><span class="dot"></span> upcoming</span>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <div class="font-semibold">{nextNight.name}</div>
        <div class="text-sm text-scifi-muted">{shortDate(nextNight.startsAt, locale)} · {cityLabel(nextNight.city, locale)}</div>
      </div>
      <a use:link class="btn-cta px-3 py-1.5 text-xs" href={localePath(locale, `events/${nextNight.slug}`)}>Open</a>
    </div>
  </div>
{/if}

<div class="mb-4 flex flex-wrap gap-2" use:reveal>
  {#each filters as f}
    <button
      type="button"
      class="btn btn-sm {filter === f.id ? 'btn-primary' : 'btn-ghost'}"
      aria-pressed={filter === f.id}
      onclick={() => (filter = f.id)}
    >
      {f.label}
    </button>
  {/each}
</div>

<ul class="m-0 list-none space-y-2 p-0">
  {#each visible as row, i}
    <li use:reveal={(i % 8) * 30}>
      <a use:link class="pane flex items-start gap-3 p-4 card-lift" href={row.href}>
        <span class="badge badge-outline badge-sm mt-0.5 shrink-0">{row.kind}</span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{row.title}</span>
          <span class="block text-sm text-scifi-muted">{row.meta}</span>
        </span>
        <span class="shrink-0 text-xs tabular-nums text-scifi-muted">
          {row.at ? shortDate(new Date(row.at).toISOString(), locale) : "—"}
        </span>
      </a>
    </li>
  {:else}
    <li class="text-sm text-scifi-muted">No pulse items yet.</li>
  {/each}
</ul>
