<script lang="ts">
  import { onMount } from "svelte";
  import { getMessages, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let items = $state<any[]>([]);

  async function load() {
    const res = await gql<{ notifications: any[] }>(`
      query { notifications { id type title body readAt createdAt } }
    `);
    items = res.notifications;
  }

  onMount(load);

  async function markAll() {
    await gql(`mutation { markAllNotificationsRead }`);
    await load();
  }</script>

<main class="hub-page hub-page--narrow">
  <div class="mb-8 flex items-end justify-between gap-3">
    <div>
      <p class="label-kicker neon-flicker text-scifi-primary mb-1">// inbox</p>
      <h1 class="text-3xl font-extrabold tracking-tight"><span class="brand-mark">{t(messages, "nav.notifications")}</span></h1>
    </div>
    <button class="btn btn-sm btn-ghost" type="button" onclick={markAll}>Mark all read</button>
  </div>
  <ul class="m-0 list-none space-y-2 p-0">
    {#each items as n}
      <li class="pane pane-bracketed card-lift p-4 {n.readAt ? 'opacity-60' : ''}">
        <div class="flex items-start gap-3">
          {#if !n.readAt}<span class="status-chip mt-0.5"><span class="dot"></span></span>{/if}
          <div class="min-w-0">
            <div class="font-medium">{n.title}</div>
            <div class="mt-1 text-sm text-scifi-muted">{n.body}</div>
            <div class="mt-2 text-xs text-scifi-muted/70">{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</main>
