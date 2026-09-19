<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore, me } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal, hueOf, initialsOf, workCoverUrl } from "../lib/reveal";

  let { params }: { params?: { handle?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let handle = $derived(params?.handle ?? "");
  let profile = $state<any>(null);
  let contactOpen = $state(false);
  let reportOpen = $state(false);
  let subject = $state("");
  let message = $state("");
  let reason = $state("");
  let flash = $state("");

  async function load() {
    const res = await gql<{ profile: any }>(
      `query Profile($handle: String!) {
        profile(handle: $handle) {
          id handle displayName bioShort bioLong city claimStatus websiteUrl instagramUrl
          avatarUrl coverUrl isFounding followerCount isFollowing
          disciplines { slug nameEn }
          works { id slug title type status media { publicUrl externalUrl } }
        }
      }`,
      { handle },
    );
    profile = res.profile;
  }

  onMount(load);

  async function toggleFollow() {
    if (!$me || !profile) return;
    if (profile.isFollowing) {
      await gql(`mutation($id: ID!) { unfollow(profileId: $id) }`, { id: profile.id });
    } else {
      await gql(`mutation($id: ID!) { follow(profileId: $id) }`, { id: profile.id });
    }
    await load();
  }

  async function sendContact() {
    await gql(
      `mutation($input: ContactInput!) { sendContact(input: $input) }`,
      { input: { toProfileId: profile.id, subject, message } },
    );
    contactOpen = false;
    flash = "Sent";
  }

  async function sendReport() {
    await gql(
      `mutation($input: ReportInput!) { createReport(input: $input) { id } }`,
      { input: { entityType: "profile", entityId: profile.id, reason } },
    );
    reportOpen = false;
    flash = "Reported";
  }
</script>

<main class="hub-page">
  {#if !profile}
    <div class="space-y-3">
      <div class="skeleton h-32"></div>
      <div class="skeleton h-16"></div>
    </div>
  {:else}
    {#if profile.claimStatus !== "claimed"}
      <div class="alert alert-warning mb-6">
        <div>
          <div class="font-semibold">{t(messages, "profile.unclaimed")}</div>
          <div class="text-sm">{t(messages, "profile.unclaimedHint")}</div>
        </div>
      </div>
    {/if}

    <!-- Identity header -->
    <header class="console-panel relative mb-10 overflow-hidden" use:reveal>
      {#if profile.coverUrl}
        <img
          class="absolute inset-0 h-full w-full object-cover opacity-35"
          src={profile.coverUrl}
          alt=""
          loading="lazy"
        />
      {/if}
      <div class="pane-scan"></div>
      <div class="profile-identity relative p-6 sm:p-8">
        <span class="profile-hero-avatar" style="--h: {hueOf(profile.handle)}">
          {#if profile.avatarUrl}
            <img src={profile.avatarUrl} alt="" loading="lazy" />
          {:else}
            {initialsOf(profile.displayName)}
          {/if}
        </span>
        <div class="min-w-0">
          <p class="label-kicker neon-flicker text-scifi-primary mb-1">// profile</p>
          <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span class="brand-mark">{profile.displayName}</span>
          </h1>
          <p class="mt-1 text-sm text-scifi-muted">
            @{profile.handle} · {profile.city ?? "—"} · {profile.followerCount} followers
          </p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            {#each profile.disciplines as d}
              <span class="feature-pill">{d.slug.replaceAll("_", " ")}</span>
            {/each}
            {#if profile.isFounding}
              <span class="badge badge-primary">founding</span>
            {/if}
          </div>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:justify-start">
          {#if $me && profile.claimStatus === "claimed"}
            <button class="btn-cta btn-sm px-4 py-2 text-sm" type="button" onclick={toggleFollow}>
              {profile.isFollowing ? t(messages, "profile.unfollow") : t(messages, "profile.follow")}
            </button>
            <button class="cta-secondary px-4 py-2 text-sm" type="button" onclick={() => (contactOpen = true)}
              >{t(messages, "profile.contact")}</button
            >
          {/if}
          {#if $me}
            <button class="btn btn-ghost btn-sm" type="button" onclick={() => (reportOpen = true)}
              >{t(messages, "profile.report")}</button
            >
          {/if}
        </div>
      </div>
      {#if profile.bioShort}
        <p class="relative m-0 border-t border-[var(--scifi-border)] px-6 py-4 text-sm leading-relaxed text-scifi-muted sm:px-8">
          {profile.bioShort}
        </p>
      {/if}
    </header>

    {#if flash}<p class="mb-4 text-scifi-success">{flash}</p>{/if}

    <!-- Works -->
    <section use:reveal>
      <h2 class="pane-title mb-5 text-base"><span class="pane-title-bar"></span>{t(messages, "profile.works")}</h2>
      {#if profile.works.length === 0}
        <p class="text-sm text-scifi-muted">—</p>
      {:else}
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each profile.works as w, i}
            <a
              use:link
              use:reveal={i * 60}
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
                <div class="mt-0.5 text-xs text-scifi-muted">{w.status}</div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</main>

{#if contactOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={t(messages, "profile.contact")}
    onclick={(e) => {
      if (e.target === e.currentTarget) contactOpen = false;
    }}
  >
    <div class="modal space-y-3">
      <h3 class="modal-title">{t(messages, "profile.contact")}</h3>
      <label class="form-control w-full">
        <span class="label-kicker mb-1.5 block text-scifi-muted">subject</span>
        <input class="input input-bordered w-full" bind:value={subject} />
      </label>
      <textarea class="textarea textarea-bordered w-full" rows="4" bind:value={message}></textarea>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" onclick={() => (contactOpen = false)}>{t(messages, "common.cancel")}</button>
        <button class="btn btn-primary" type="button" onclick={sendContact}>{t(messages, "common.save")}</button>
      </div>
    </div>
  </div>
{/if}

{#if reportOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label={t(messages, "profile.report")}
    onclick={(e) => {
      if (e.target === e.currentTarget) reportOpen = false;
    }}
  >
    <div class="modal space-y-3">
      <h3 class="modal-title">{t(messages, "profile.report")}</h3>
      <textarea class="textarea textarea-bordered w-full" rows="3" bind:value={reason}></textarea>
      <div class="modal-actions">
        <button class="btn btn-ghost" type="button" onclick={() => (reportOpen = false)}>{t(messages, "common.cancel")}</button>
        <button class="btn btn-error" type="button" onclick={sendReport}>{t(messages, "profile.report")}</button>
      </div>
    </div>
  </div>
{/if}
