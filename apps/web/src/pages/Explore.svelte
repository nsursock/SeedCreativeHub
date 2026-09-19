<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { viewMode } from "../lib/viewMode";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf, workCoverUrl } from "../lib/reveal";

  type Creator = {
    id: string;
    handle: string;
    displayName: string;
    city?: string;
    claimStatus: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    isFounding?: boolean;
    worksCount?: number;
  };
  type Work = {
    id: string;
    slug: string;
    title: string;
    type: "text" | "image" | "audio" | "video";
    publishedAt?: string | null;
    viewCount?: number;
    profile: { handle: string; displayName: string };
    primaryDiscipline?: { slug: string; nameEn: string } | null;
    media: Array<{ publicUrl?: string | null; externalUrl?: string | null }>;
  };
  type EventRow = {
    id: string;
    slug: string;
    name: string;
    startsAt: string;
    venue?: string;
    city?: string;
    imageUrl?: string | null;
    isHubNight: boolean;
  };
  type Opp = {
    id: string;
    slug: string;
    title: string;
    location?: string;
    discipline?: string;
    compensationStatus?: string;
    imageUrl?: string | null;
  };

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let tab = $state<"creators" | "works" | "events" | "collabs">("creators");
  let pill = $state<"featured" | "latest">("featured");

  let data = $state<{
    featuredCreators: Creator[];
    latestCreators: Creator[];
    featuredWorks: Work[];
    latestWorks: Work[];
    featuredEvents: EventRow[];
    latestEvents: EventRow[];
    featuredOpportunities: Opp[];
    latestOpportunities: Opp[];
  } | null>(null);
  let error = $state("");

  const tabs = [
    { id: "creators" as const, labelKey: "explore.tabCreators" },
    { id: "works" as const, labelKey: "explore.tabWorks" },
    { id: "events" as const, labelKey: "explore.tabEvents" },
    { id: "collabs" as const, labelKey: "explore.tabCollabs" },
  ];

  function setTab(next: typeof tab) {
    tab = next;
    pill = "featured";
  }

  function dayOf(iso: string) {
    return new Date(iso).getDate().toString().padStart(2, "0");
  }
  function monthOf(iso: string) {
    return new Date(iso).toLocaleString(locale, { month: "short" });
  }
  function shortDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  }

  onMount(async () => {
    try {
      const res = await gql<{ explore: typeof data }>(`
        query Explore {
          explore {
            featuredCreators { id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount }
            latestCreators { id handle displayName city claimStatus avatarUrl coverUrl isFounding worksCount }
            featuredWorks {
              id slug title type publishedAt viewCount
              profile { handle displayName }
              primaryDiscipline { slug nameEn }
              media { publicUrl externalUrl }
            }
            latestWorks {
              id slug title type publishedAt viewCount
              profile { handle displayName }
              primaryDiscipline { slug nameEn }
              media { publicUrl externalUrl }
            }
            featuredEvents { id slug name startsAt venue city imageUrl isHubNight }
            latestEvents { id slug name startsAt venue city imageUrl isHubNight }
            featuredOpportunities { id slug title location discipline compensationStatus imageUrl }
            latestOpportunities { id slug title location discipline compensationStatus imageUrl }
          }
        }
      `);
      data = res.explore;
    } catch (e) {
      error = e instanceof Error ? e.message : t(messages, "common.error");
    }
  });

  let creators = $derived(
    !data ? [] : pill === "featured" ? data.featuredCreators : data.latestCreators,
  );
  let works = $derived(!data ? [] : pill === "featured" ? data.featuredWorks : data.latestWorks);
  let events = $derived(!data ? [] : pill === "featured" ? data.featuredEvents : data.latestEvents);
  let collabs = $derived(
    !data ? [] : pill === "featured" ? data.featuredOpportunities : data.latestOpportunities,
  );
</script>

<main class="hub-page">
  <PageHero kicker="directory" title={t(messages, "explore.title")} sub={t(messages, "landing.heroSub")} />

  {#if error}<p class="text-error mb-4">{error}</p>{/if}

  <div class="console-panel mb-8" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> browse</span>
      <div class="flex items-center gap-2">
        <span class="status-chip"><span class="dot"></span> live</span>
        <ViewModeToggle />
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2 p-3 sm:p-4">
      {#each tabs as tb}
        <button
          type="button"
          class="btn btn-sm {tab === tb.id ? 'btn-primary' : 'btn-ghost'}"
          aria-pressed={tab === tb.id}
          onclick={() => setTab(tb.id)}
        >
          {t(messages, tb.labelKey)}
        </button>
      {/each}
      <span class="mx-1 hidden h-5 w-px bg-[var(--scifi-border)] sm:inline-block" aria-hidden="true"></span>
      <button
        type="button"
        class="feature-pill {pill === 'featured' ? 'border-[var(--scifi-primary)] text-scifi-primary' : ''}"
        aria-pressed={pill === "featured"}
        onclick={() => (pill = "featured")}
      >
        {t(messages, "explore.pillFeatured")}
      </button>
      <button
        type="button"
        class="feature-pill {pill === 'latest' ? 'border-[var(--scifi-primary)] text-scifi-primary' : ''}"
        aria-pressed={pill === "latest"}
        onclick={() => (pill = "latest")}
      >
        {t(messages, "explore.pillLatest")}
      </button>
    </div>
  </div>

  {#if !data}
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each Array(6) as _}
        <div class="skeleton h-48"></div>
      {/each}
    </div>
  {:else if tab === "creators"}
    {#if creators.length === 0}
      <p class="text-sm text-scifi-muted">{t(messages, "explore.empty")}</p>
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
                    {#if c.avatarUrl}<img src={c.avatarUrl} alt="" loading="lazy" />{:else}{initialsOf(c.displayName)}{/if}
                  </a>
                </td>
                <td class="font-medium">
                  <a use:link class="hover:text-scifi-primary" href={localePath(locale, `u/${c.handle}`)}>{c.displayName}</a>
                </td>
                <td class="font-mono text-scifi-cyan">@{c.handle}</td>
                <td class="text-scifi-muted">{c.city ?? "—"}</td>
                <td>{c.worksCount ?? 0}</td>
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
                {#if typeof c.worksCount === "number"}
                  <span class="badge badge-outline badge-sm">{c.worksCount} {c.worksCount === 1 ? "work" : "works"}</span>
                {/if}
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
  {:else if tab === "works"}
    {#if works.length === 0}
      <p class="text-sm text-scifi-muted">{t(messages, "explore.empty")}</p>
    {:else if $viewMode === "table"}
      <div class="hub-table-wrap" use:reveal>
        <table class="hub-table">
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Type</th>
              <th>Discipline</th>
              <th>Creator</th>
              <th>Published</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {#each works as w}
              <tr>
                <td>
                  <a
                    use:link
                    href={localePath(locale, `works/${w.slug}`)}
                    class="work-thumb work-thumb--table"
                    class:work-thumb--photo={!!workCoverUrl(w)}
                    style="--h: {hueOf(w.slug)}"
                    aria-hidden="true"
                    tabindex="-1"
                  >
                    {#if workCoverUrl(w)}
                      <img src={workCoverUrl(w)} alt="" loading="lazy" />
                    {/if}
                  </a>
                </td>
                <td class="font-medium">
                  <a use:link class="hover:text-scifi-primary" href={localePath(locale, `works/${w.slug}`)}>{w.title}</a>
                </td>
                <td>
                  <span class="badge badge-outline badge-sm">{w.type}</span>
                </td>
                <td class="text-scifi-muted">{w.primaryDiscipline?.nameEn ?? "—"}</td>
                <td>
                  <a use:link class="hover:text-scifi-primary" href={localePath(locale, `u/${w.profile.handle}`)}>
                    <span class="block truncate font-medium">{w.profile.displayName}</span>
                    <span class="font-mono text-xs text-scifi-cyan">@{w.profile.handle}</span>
                  </a>
                </td>
                <td class="whitespace-nowrap text-scifi-muted">{shortDate(w.publishedAt)}</td>
                <td class="tabular-nums text-scifi-muted">{w.viewCount ?? 0}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {#each works as w, i}
          <a
            use:link
            use:reveal={i * 50}
            class="pane card-lift overflow-hidden p-0"
            href={localePath(locale, `works/${w.slug}`)}
          >
            <div class="work-thumb" class:work-thumb--photo={!!workCoverUrl(w)} style="--h: {hueOf(w.slug)}">
              {#if workCoverUrl(w)}
                <img src={workCoverUrl(w)} alt="" loading="lazy" />
              {/if}
              <span class="work-thumb__type">{w.type}</span>
            </div>
            <div class="p-3.5">
              <div class="truncate font-semibold">{w.title}</div>
              <div class="mt-0.5 truncate text-xs text-scifi-muted">
                {w.profile.displayName} · @{w.profile.handle}
              </div>
              {#if w.primaryDiscipline}
                <div class="mt-1.5">
                  <span class="badge badge-outline badge-sm">{w.primaryDiscipline.nameEn}</span>
                </div>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {:else if tab === "events"}
    {#if events.length === 0}
      <p class="text-sm text-scifi-muted">{t(messages, "explore.empty")}</p>
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
            {#each events as e}
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
        {#each events as e, i}
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
  {:else if tab === "collabs"}
    {#if collabs.length === 0}
      <p class="text-sm text-scifi-muted">{t(messages, "explore.empty")}</p>
    {:else if $viewMode === "table"}
      <div class="hub-table-wrap" use:reveal>
        <table class="hub-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Discipline</th>
              <th>Pay</th>
            </tr>
          </thead>
          <tbody>
            {#each collabs as o}
              <tr>
                <td class="font-medium">
                  <a use:link class="hover:text-scifi-primary" href={localePath(locale, `collaborate/${o.slug}`)}>{o.title}</a>
                </td>
                <td class="text-scifi-muted">{o.location ?? "—"}</td>
                <td class="text-scifi-muted">{o.discipline?.replaceAll("_", " ") ?? "—"}</td>
                <td>
                  {#if o.compensationStatus}
                    <span class="badge badge-outline badge-sm">{o.compensationStatus}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
        {#each collabs as o, i}
          <li use:reveal={(i % 6) * 50}>
            <a
              use:link
              class="pane pane-bracketed card-lift flex h-full flex-col overflow-hidden p-0"
              href={localePath(locale, `collaborate/${o.slug}`)}
            >
              <div class="feature-thumb">
                {#if o.imageUrl}
                  <img src={o.imageUrl} alt="" loading="lazy" />
                {/if}
              </div>
              <span class="block flex-1 p-4 sm:p-5">
                <span class="block truncate text-base font-semibold">{o.title}</span>
                <span class="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-scifi-muted">
                  {o.location} · {o.discipline?.replaceAll("_", " ")}
                  {#if o.compensationStatus}
                    <span class="badge badge-outline badge-sm">{o.compensationStatus}</span>
                  {/if}
                </span>
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>
