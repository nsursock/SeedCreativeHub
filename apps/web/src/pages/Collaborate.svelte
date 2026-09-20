<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import CollabsList from "../components/directory/CollabsList.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore, me } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import { labelOf, type CollabRow } from "../lib/directory";
  import { requireAccount } from "../lib/authGate";
  import { track } from "../lib/analytics";

  let { params }: { params?: { slug?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let list = $state<CollabRow[]>([]);
  let detail = $state<any>(null);
  let interestMsg = $state("");
  let loading = $state(true);
  let paidOnly = $state(false);

  let visible = $derived(
    paidOnly ? list.filter((o) => o.compensationStatus === "paid") : list,
  );

  async function load() {
    loading = true;
    if (params?.slug) {
      const res = await gql<{ opportunity: any }>(
        `query($slug: String!) {
          opportunity(slug: $slug) {
            id title slug description roles discipline location remoteMode compensationStatus deadline status interestCount imageUrl
          }
        }`,
        { slug: params.slug },
      );
      detail = res.opportunity;
    } else {
      const res = await gql<{ opportunities: CollabRow[] }>(
        `query {
          opportunities(limit: 40) {
            id slug title location discipline remoteMode compensationStatus deadline interestCount imageUrl
          }
        }`,
      );
      list = res.opportunities;
    }
    loading = false;
  }

  onMount(load);

  async function express() {
    if (!detail) return;
    if (!$me) {
      requireAccount(locale);
      return;
    }
    await gql(`mutation($id: ID!, $message: String) { expressInterest(opportunityId: $id, message: $message) { id } }`, {
      id: detail.id,
      message: interestMsg,
    });
    track("collab_interest", {
      paid: detail.compensationStatus === "paid",
    });
    interestMsg = "";
    await load();
  }
</script>

<main class="hub-page">
  <PageHero kicker="open calls" title={t(messages, "collab.title")} sub="Find paid and unpaid collaboration posts." />

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
          <input type="checkbox" class="checkbox checkbox-xs checkbox-primary" bind:checked={paidOnly} />
          paid only
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
        <span class="pane-title"><span class="pane-title-bar"></span> opportunity</span>
        <span class="badge badge-primary">{labelOf(detail.compensationStatus)}</span>
      </div>
      <div class="relative space-y-4 p-6 sm:p-8">
        {#if detail.imageUrl}
          <div class="work-thumb work-thumb--photo h-40 sm:h-52" style="--h: 200">
            <img src={detail.imageUrl} alt="" loading="lazy" />
            <span class="work-thumb__type">collab</span>
          </div>
        {/if}
        <h2 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{detail.title}</h2>
        <div class="flex flex-wrap gap-1.5">
          <span class="feature-pill">{labelOf(detail.discipline)}</span>
          <span class="feature-pill">{detail.location}</span>
          <span class="feature-pill">{detail.interestCount} interested</span>
        </div>
        <p class="m-0 leading-relaxed text-scifi-muted">{detail.description}</p>
        <p class="m-0 text-sm text-scifi-muted">{detail.roles}</p>
        {#if $me}
          <div class="space-y-3 border-t border-[var(--scifi-border)] pt-4">
            <span class="label-kicker block text-scifi-muted">message</span>
            <textarea class="textarea textarea-bordered w-full" bind:value={interestMsg} rows="3"></textarea>
            <button class="btn-cta" type="button" onclick={express}>{t(messages, "collab.expressInterest")}</button>
          </div>
        {:else}
          <button class="btn-cta w-fit" type="button" onclick={() => requireAccount(locale)}
            >{t(messages, "nav.signIn")} to express interest</button
          >
        {/if}
      </div>
    </article>
  {:else}
    <CollabsList items={visible} empty={t(messages, "collab.empty")} />
  {/if}
</main>
