<script lang="ts">
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore, refreshSession } from "../lib/stores";
  import { gql, setCsrfToken } from "../lib/gql";
  import { track } from "../lib/analytics";

  let { params }: { params?: { token?: string } } = $props();
  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let token = $derived(params?.token ?? "");
  let email = $state("");
  let password = $state("");
  let error = $state("");

  async function submit(e: Event) {
    e.preventDefault();
    error = "";
    try {
      const res = await gql<{ claimProfile: { csrfToken: string } }>(
        `mutation($input: ClaimProfileInput!) {
          claimProfile(input: $input) { csrfToken user { id } }
        }`,
        { input: { token, email, password, acceptTerms: true } },
      );
      setCsrfToken(res.claimProfile.csrfToken);
      track("profile_claim");
      await refreshSession();
      location.hash = localePath(locale, "explore");
    } catch (err) {
      error = err instanceof Error ? err.message : t(messages, "common.error");
    }
  }
</script>

<main class="hub-page hub-page--narrow py-16">
  <p class="label-kicker neon-flicker text-scifi-primary mb-2">// claim</p>
  <h1 class="mb-2 text-2xl font-extrabold"><span class="brand-mark">{t(messages, "auth.claimTitle")}</span></h1>
  <p class="mb-6 text-scifi-muted">{t(messages, "auth.claimBody")}</p>
  <form class="console-panel space-y-3 p-5" onsubmit={submit}>
    <label class="form-control w-full">
      <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.email")}</span>
      <input class="input input-bordered w-full" type="email" bind:value={email} required />
    </label>
    <label class="form-control w-full">
      <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.password")}</span>
      <input class="input input-bordered w-full" type="password" bind:value={password} required minlength="8" />
    </label>
    <button class="btn-cta w-full" type="submit">{t(messages, "auth.submit")}</button>
  </form>
  {#if error}<p class="mt-3 text-error">{error}</p>{/if}
</main>
