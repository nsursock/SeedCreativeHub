<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import { createDrawerOpen, locale as localeStore, me } from "../lib/stores";
  import { localePath } from "../lib/i18n";
  import { requireAccount } from "../lib/authGate";

  let locale = $derived($localeStore);

  onMount(() => {
    if (!$me) {
      requireAccount(locale);
      return;
    }
    createDrawerOpen.set(true);
    // Stay off the dedicated page — drawer lives in AppShell.
    push(localePath(locale, "explore"));
  });
</script>

<main class="hub-page hub-page--narrow" aria-busy="true"></main>
