<script lang="ts">
  import { onMount } from "svelte";
  import PageHero from "../components/PageHero.svelte";
  import { getMessages, marketCities, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";
  import { reveal } from "../lib/reveal";
  import { cityLabel } from "../lib/directory";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));
  let defaultCity = $derived(marketCities()[0] ?? "other");

  let stats = $state<Record<string, number> | null>(null);
  let profiles = $state<any[]>([]);
  let reports = $state<any[]>([]);
  let waitlist = $state<any[]>([]);
  let claimUrl = $state("");
  let importText = $state("[]");
  let newHandle = $state("");
  let newName = $state("");
  let flash = $state("");
  let loading = $state(true);

  const STAT_LABELS: Record<string, string> = {
    users: "Users",
    profiles: "Profiles",
    claimed: "Claimed",
    unclaimed: "Unclaimed",
    works: "Works",
    opportunities: "Collabs",
    events: "Events",
    waitlist: "Waitlist",
    openReports: "Open reports",
  };

  async function load() {
    loading = true;
    const res = await gql<{
      adminStats: Record<string, number>;
      adminProfiles: any[];
      adminReports: any[];
      adminWaitlist: any[];
    }>(`
      query Admin {
        adminStats { users profiles claimed unclaimed works opportunities events waitlist openReports }
        adminProfiles(limit: 40) { id handle displayName claimStatus city }
        adminReports(status: open) { id entityType entityId reason status createdAt }
        adminWaitlist(limit: 40) { id email displayName disciplines locale createdAt }
      }
    `);
    stats = res.adminStats;
    profiles = res.adminProfiles;
    reports = res.adminReports;
    waitlist = res.adminWaitlist;
    loading = false;
  }

  onMount(load);

  function toast(msg: string) {
    flash = msg;
    setTimeout(() => {
      if (flash === msg) flash = "";
    }, 3200);
  }

  async function createShell() {
    if (!newHandle.trim() || !newName.trim()) return;
    await gql(
      `mutation($input: AdminCreateProfileInput!) {
        adminCreateProfile(input: $input) { id handle }
      }`,
      {
        input: {
          handle: newHandle.toLowerCase(),
          displayName: newName,
          city: defaultCity,
          disciplineSlugs: ["photography"],
          isFounding: true,
        },
      },
    );
    newHandle = "";
    newName = "";
    toast("Profile shell created");
    await load();
  }

  async function genClaim(id: string) {
    const res = await gql<{ adminGenerateClaimLink: { claimUrl: string } }>(
      `mutation($id: ID!) { adminGenerateClaimLink(profileId: $id) { claimUrl expiresAt } }`,
      { id },
    );
    claimUrl = res.adminGenerateClaimLink.claimUrl;
    toast("Claim link ready");
  }

  async function feature(id: string) {
    await gql(
      `mutation($entityType: String!, $entityId: ID!, $placement: String!) {
        adminFeature(entityType: $entityType, entityId: $entityId, placement: $placement) { id }
      }`,
      { entityType: "profile", entityId: id, placement: "explore_featured_creators" },
    );
    toast("Featured on Explore");
  }

  async function importJson() {
    const rows = JSON.parse(importText);
    await gql(
      `mutation($profiles: [AdminImportProfileInput!]!) {
        adminImportProfiles(profiles: $profiles) { id handle }
      }`,
      { profiles: rows },
    );
    toast("Import complete");
    await load();
  }

  async function resolveReport(id: string, status: "resolved" | "dismissed") {
    await gql(
      `mutation($id: ID!, $status: ReportStatus!) { adminResolveReport(id: $id, status: $status) { id } }`,
      { id, status },
    );
    toast(status === "resolved" ? "Report resolved" : "Report dismissed");
    await load();
  }
</script>

<main class="hub-page">
  <PageHero kicker="ops" title={t(messages, "admin.title")} sub="Seed shells, claim links, featured placements, and moderation." />

  {#if flash}
    <p class="mb-6 rounded-lg border border-[var(--scifi-border-accent)] bg-[rgba(var(--scifi-primary-rgb),0.08)] px-4 py-2 text-sm text-scifi-success">
      {flash}
    </p>
  {/if}

  {#if loading && !stats}
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {#each Array(5) as _}<div class="skeleton h-20"></div>{/each}
    </div>
  {:else if stats}
    <section class="mb-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" use:reveal>
      {#each Object.entries(stats) as [k, v]}
        <div class="metric-card p-3">
          <div class="card-label"><span class="label-bar"></span>{STAT_LABELS[k] ?? k}</div>
          <div class="card-value glow-text text-2xl">{v}</div>
        </div>
      {/each}
    </section>
  {/if}

  <section class="mb-10 console-panel overflow-hidden" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span>{t(messages, "admin.creators")}</span>
      <span class="status-chip"><span class="dot"></span> {profiles.length}</span>
    </div>
    <div class="space-y-4 p-4 sm:p-5">
      <div class="flex flex-wrap items-end gap-3">
        <label class="form-control min-w-[8rem] flex-1">
          <span class="label-kicker mb-1.5 block text-scifi-muted">handle</span>
          <input class="input input-bordered input-sm w-full" placeholder="maya_k" bind:value={newHandle} />
        </label>
        <label class="form-control min-w-[10rem] flex-1">
          <span class="label-kicker mb-1.5 block text-scifi-muted">display name</span>
          <input class="input input-bordered input-sm w-full" placeholder="Maya Khoury" bind:value={newName} />
        </label>
        <button class="btn-cta btn-sm px-4 py-2 text-xs" type="button" onclick={createShell}>Create shell</button>
      </div>

      <div class="hub-table-wrap">
        <table class="hub-table">
          <thead>
            <tr>
              <th>Handle</th>
              <th>Name</th>
              <th>City</th>
              <th>Status</th>
              <th class="hub-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each profiles as p}
              <tr>
                <td class="font-mono text-scifi-cyan">@{p.handle}</td>
                <td class="font-medium">{p.displayName}</td>
                <td class="text-scifi-muted">{cityLabel(p.city, locale)}</td>
                <td>
                  <span class="badge badge-sm {p.claimStatus === 'claimed' ? 'badge-success' : 'badge-warning'}">{p.claimStatus}</span>
                </td>
                <td class="hub-table__actions">
                  <button class="btn btn-ghost btn-xs" type="button" onclick={() => genClaim(p.id)}
                    >{t(messages, "admin.claimLink")}</button
                  >
                  <button class="btn btn-ghost btn-xs" type="button" onclick={() => feature(p.id)}
                    >{t(messages, "admin.feature")}</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if claimUrl}
        <p class="break-all rounded-lg border border-[var(--scifi-border)] bg-[rgba(var(--scifi-bg-deep-rgb),0.5)] px-3 py-2 text-xs">
          <span class="label-kicker me-2 text-scifi-muted">claim url</span>
          <a class="link link-hover text-scifi-primary" href={claimUrl}>{claimUrl}</a>
        </p>
      {/if}
    </div>
  </section>

  <div class="mb-10 grid gap-6 lg:grid-cols-2">
    <section class="console-panel overflow-hidden" use:reveal>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span>{t(messages, "admin.import")}</span>
        <span class="badge badge-outline badge-sm">JSON</span>
      </div>
      <div class="space-y-3 p-4 sm:p-5">
        <p class="m-0 text-xs text-scifi-muted">Paste an array of profile shells: handle, displayName, city, disciplineSlugs…</p>
        <textarea class="textarea textarea-bordered w-full font-mono text-xs" rows="8" bind:value={importText}></textarea>
        <button class="cta-secondary text-sm" type="button" onclick={importJson}>Import profiles</button>
      </div>
    </section>

    <section class="console-panel overflow-hidden" use:reveal={80}>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span>{t(messages, "admin.reports")}</span>
        <span class="status-chip"><span class="dot"></span> {reports.length} open</span>
      </div>
      <div class="p-4 sm:p-5">
        {#if reports.length === 0}
          <p class="m-0 text-sm text-scifi-muted">No open reports.</p>
        {:else}
          <ul class="m-0 list-none space-y-2 p-0">
            {#each reports as r}
              <li class="pane pane-bracketed flex flex-wrap items-center justify-between gap-2 p-3">
                <span class="min-w-0">
                  <span class="badge badge-outline badge-sm me-1.5">{r.entityType}</span>
                  <span class="text-sm">{r.reason}</span>
                </span>
                <span class="flex gap-1">
                  <button class="btn btn-xs btn-success" type="button" onclick={() => resolveReport(r.id, "resolved")}
                    >Resolve</button
                  >
                  <button class="btn btn-xs btn-ghost" type="button" onclick={() => resolveReport(r.id, "dismissed")}
                    >Dismiss</button
                  >
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
  </div>

  <section class="console-panel overflow-hidden" use:reveal>
    <div class="pane-header">
      <span class="pane-title"><span class="pane-title-bar"></span> waitlist</span>
      <span class="status-chip"><span class="dot"></span> {waitlist.length}</span>
    </div>
    <div class="p-0">
      {#if waitlist.length === 0}
        <p class="m-0 p-5 text-sm text-scifi-muted">Waitlist is empty.</p>
      {:else}
        <div class="hub-table-wrap" style="border: 0; border-radius: 0">
          <table class="hub-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Disciplines</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {#each waitlist as w}
                <tr>
                  <td class="font-mono">{w.email}</td>
                  <td>{w.displayName ?? "—"}</td>
                  <td class="hub-table__clip text-scifi-muted">{(w.disciplines ?? []).join(", ") || "—"}</td>
                  <td class="text-scifi-muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </section>
</main>
