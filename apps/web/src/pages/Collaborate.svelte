<script lang="ts">
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";
  import PageHero from "../components/PageHero.svelte";
  import ViewModeToggle from "../components/ViewModeToggle.svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore, me } from "../lib/stores";
  import { viewMode } from "../lib/viewMode";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";

  let { params }: { params?: { slug?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let list = $state<any[]>([]);
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
            id title slug description roles discipline location compensationStatus status interestCount imageUrl
          }
        }`,
        { slug: params.slug },
      );
      detail = res.opportunity;
    } else {
      const res = await gql<{ opportunities: any[] }>(
        `query { opportunities(limit: 40) { id slug title location discipline compensationStatus imageUrl } }`,
      );
      list = res.opportunities;
    }
    loading = false;
  }

  onMount(load);

  async function express() {
    if (!detail || !$me) return;
    await gql(`mutation($id: ID!, $message: String) { expressInterest(opportunityId: $id, message: $message) { id } }`, {
      id: detail.id,
      message: interestMsg,
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
        <span class="badge badge-primary">{detail.compensationStatus}</span>
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
          <span class="feature-pill">{detail.discipline?.replaceAll("_", " ")}</span>
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
          <a use:link class="cta-secondary w-fit" href={localePath(locale, "auth")}>{t(messages, "nav.signIn")} →</a>
        {/if}
      </div>
    </article>
  {:else if visible.length === 0}
    <p class="text-scifi-muted">{t(messages, "collab.empty")}</p>
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
          {#each visible as o}
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
      {#each visible as o, i}
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
                <span class="badge badge-outline badge-sm">{o.compensationStatus}</span>
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>
