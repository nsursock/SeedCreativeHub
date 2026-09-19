<script lang="ts">
  import { link } from "svelte-spa-router";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf, workMediaUrl } from "../lib/reveal";

  let { params }: { params?: { slug?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  type MediaRow = {
    kind?: string;
    publicUrl?: string | null;
    externalUrl?: string | null;
    mimeType?: string | null;
  };

  let work = $state<{
    id: string;
    title: string;
    slug: string;
    type: "text" | "image" | "audio" | "video";
    description?: string | null;
    externalUrl?: string | null;
    status: string;
    media: MediaRow[];
    profile: { handle: string; displayName: string; avatarUrl?: string | null };
  } | null>(null);

  let mediaUrl = $derived(work ? workMediaUrl(work) : null);
  let loadError = $state("");

  $effect(() => {
    const slug = params?.slug;
    if (!slug) return;
    work = null;
    loadError = "";
    let cancelled = false;
    (async () => {
      try {
        const res = await gql<{ work: typeof work }>(
          `query($slug: String!) {
            work(slug: $slug) {
              id title slug type description externalUrl status
              media { kind publicUrl externalUrl mimeType }
              profile { handle displayName avatarUrl }
            }
          }`,
          { slug },
        );
        if (!cancelled) work = res.work;
      } catch (e) {
        if (!cancelled) loadError = e instanceof Error ? e.message : "Failed to load";
      }
    })();
    return () => {
      cancelled = true;
    };
  });
</script>

<main class="hub-page hub-page--work">
  {#if loadError}
    <p class="text-error">{loadError}</p>
  {:else if !work}
    <div class="space-y-3">
      <div class="skeleton h-56"></div>
      <div class="skeleton h-16"></div>
    </div>
  {:else}
    <p class="label-kicker neon-flicker text-scifi-primary mb-4">// work · {work.type}</p>

    {#if work.type === "image"}
      <figure class="work-photo" use:reveal style="--h: {hueOf(work.slug)}">
        {#if mediaUrl}
          <img src={mediaUrl} alt={work.title} loading="eager" />
        {:else}
          <div class="work-photo__empty"></div>
        {/if}
        <figcaption class="work-photo__cap">
          <h1 class="work-photo__title">{work.title}</h1>
          <a use:link class="work-creator" href={localePath(locale, `u/${work.profile.handle}`)}>
            <span class="avatar avatar--sm" style="--h: {hueOf(work.profile.handle)}">
              {#if work.profile.avatarUrl}
                <img src={work.profile.avatarUrl} alt="" loading="lazy" />
              {:else}
                {initialsOf(work.profile.displayName)}
              {/if}
            </span>
            <span>@{work.profile.handle}</span>
          </a>
        </figcaption>
      </figure>
      {#if work.description}
        <p class="work-caption" use:reveal={60}>{work.description}</p>
      {/if}
    {:else if work.type === "video"}
      <div class="work-cinema" use:reveal>
        <div class="work-cinema__stage">
          {#if mediaUrl}
            <video
              class="work-cinema__player"
              controls
              playsinline
              preload="auto"
              crossorigin="anonymous"
              src={mediaUrl}
            >
              <track kind="captions" />
            </video>
          {:else}
            <div class="work-cinema__empty">No video</div>
          {/if}
        </div>
        <div class="work-cinema__meta">
          <h1 class="work-cinema__title">{work.title}</h1>
          <a use:link class="work-creator" href={localePath(locale, `u/${work.profile.handle}`)}>
            <span class="avatar avatar--sm" style="--h: {hueOf(work.profile.handle)}">
              {#if work.profile.avatarUrl}
                <img src={work.profile.avatarUrl} alt="" loading="lazy" />
              {:else}
                {initialsOf(work.profile.displayName)}
              {/if}
            </span>
            <span>@{work.profile.handle}</span>
          </a>
          {#if work.description}
            <p class="work-cinema__desc">{work.description}</p>
          {/if}
        </div>
      </div>
    {:else if work.type === "audio"}
      <div class="work-deck console-panel" use:reveal style="--h: {hueOf(work.slug)}">
        <div class="work-deck__art" aria-hidden="true">
          <span class="work-deck__glyph">♪</span>
        </div>
        <div class="work-deck__body">
          <div class="work-deck__head">
            <span class="label-kicker text-scifi-muted">track</span>
            <h1 class="work-deck__title">{work.title}</h1>
            <a use:link class="work-creator" href={localePath(locale, `u/${work.profile.handle}`)}>
              <span class="avatar avatar--sm" style="--h: {hueOf(work.profile.handle)}">
                {#if work.profile.avatarUrl}
                  <img src={work.profile.avatarUrl} alt="" loading="lazy" />
                {:else}
                  {initialsOf(work.profile.displayName)}
                {/if}
              </span>
              <span>@{work.profile.handle}</span>
            </a>
          </div>
          <div class="work-deck__wave" aria-hidden="true">
            {#each Array(48) as _, i}
              <span style="--i: {i}; --bar: {18 + ((i * 7) % 70)}%"></span>
            {/each}
          </div>
          {#if mediaUrl}
            <audio class="work-deck__player" controls preload="metadata" src={mediaUrl}></audio>
          {:else}
            <p class="text-sm text-scifi-muted">No audio attached</p>
          {/if}
          {#if work.description}
            <p class="work-deck__desc">{work.description}</p>
          {/if}
        </div>
      </div>
    {:else}
      <article class="work-read console-panel" use:reveal>
        <header class="work-read__head">
          <span class="label-kicker text-scifi-muted">writing</span>
          <h1 class="work-read__title">{work.title}</h1>
          <a use:link class="work-creator" href={localePath(locale, `u/${work.profile.handle}`)}>
            <span class="avatar avatar--sm" style="--h: {hueOf(work.profile.handle)}">
              {#if work.profile.avatarUrl}
                <img src={work.profile.avatarUrl} alt="" loading="lazy" />
              {:else}
                {initialsOf(work.profile.displayName)}
              {/if}
            </span>
            <span>@{work.profile.handle}</span>
          </a>
        </header>
        <div class="work-read__body">
          {#if work.description}
            {#each work.description.split(/\n\n+/).filter(Boolean) as para}
              <p>{para}</p>
            {/each}
          {:else}
            <p class="text-scifi-muted">No text yet.</p>
          {/if}
        </div>
      </article>
    {/if}

    <div class="work-actions" use:reveal={100}>
      {#if work.externalUrl}
        <a class="btn-cta px-4 py-2 text-sm" href={work.externalUrl} target="_blank" rel="noreferrer">Open link ↗</a>
      {/if}
      <a use:link class="cta-secondary px-4 py-2 text-sm" href={localePath(locale, `u/${work.profile.handle}`)}
        >{t(messages, "profile.contact")}</a
      >
      <span class="badge badge-ghost">{work.status}</span>
    </div>
  {/if}
</main>
