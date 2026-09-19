<script lang="ts">
  import { onMount } from "svelte";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore, refreshSession } from "../lib/stores";
  import { gql, setCsrfToken } from "../lib/gql";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let status = $state("…");

  onMount(async () => {
    const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
    const token = params.get("token");
    if (!token) {
      status = "Missing token";
      return;
    }
    try {
      const res = await gql<{ consumeMagicLink: { csrfToken: string } }>(
        `mutation($token: String!) { consumeMagicLink(token: $token) { csrfToken } }`,
        { token },
      );
      setCsrfToken(res.consumeMagicLink.csrfToken);
      await refreshSession();
      location.hash = localePath(locale, "explore");
    } catch (e) {
      status = e instanceof Error ? e.message : t(messages, "common.error");
    }
  });</script>

<main class="hub-page hub-page--narrow py-16 text-center">
  <p class="label-kicker neon-flicker text-scifi-primary mb-4">// magic link</p>
  <div class="console-panel inline-block px-8 py-6">
    <p class="m-0 text-scifi-muted">{status}</p>
  </div>
</main>
