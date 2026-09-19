<script lang="ts">
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql, setCsrfToken } from "../lib/gql";
  import { refreshSession } from "../lib/stores";
  import { reveal } from "../lib/reveal";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  let mode = $state<"in" | "up">("in");
  let email = $state("");
  let password = $state("");
  let displayName = $state("");
  let handle = $state("");
  let error = $state("");

  async function submit(e: Event) {
    e.preventDefault();
    error = "";
    try {
      if (mode === "in") {
        const res = await gql<{ signIn: { csrfToken: string } }>(
          `mutation($input: SignInInput!) { signIn(input: $input) { csrfToken user { id } } }`,
          { input: { email, password } },
        );
        setCsrfToken(res.signIn.csrfToken);
      } else {
        const res = await gql<{ signUp: { csrfToken: string } }>(
          `mutation($input: SignUpInput!) { signUp(input: $input) { csrfToken user { id } } }`,
          {
            input: {
              email,
              password,
              displayName,
              handle: handle.toLowerCase(),
              locale,
              acceptTerms: true,
            },
          },
        );
        setCsrfToken(res.signUp.csrfToken);
      }
      await refreshSession();
      location.hash = localePath(locale, "explore");
    } catch (err) {
      error = err instanceof Error ? err.message : t(messages, "common.error");
    }
  }

  async function magic() {
    await gql(`mutation($email: String!) { requestMagicLink(email: $email) { ok } }`, { email });
    error = "Check your email for a magic link.";
  }
</script>

<main class="hub-page hub-page--narrow py-14">
  <div class="relative" use:reveal>
    <span class="ghost-word" aria-hidden="true">AUTH</span>
    <p class="label-kicker neon-flicker text-scifi-primary mb-2">// auth</p>
    <h1 class="mb-8 text-3xl font-extrabold tracking-tight">
      <span class="brand-mark"
        >{mode === "in" ? t(messages, "auth.signInTitle") : t(messages, "auth.signUpTitle")}</span
      >
    </h1>
    <div class="console-panel relative overflow-hidden">
      <div class="pane-scan"></div>
      <div class="pane-header">
        <span class="pane-title"><span class="pane-title-bar"></span> credentials</span>
        <div class="flex gap-1">
          <button class="btn btn-xs {mode === 'in' ? 'btn-primary' : 'btn-ghost'}" type="button" onclick={() => (mode = "in")}
            >In</button
          >
          <button class="btn btn-xs {mode === 'up' ? 'btn-primary' : 'btn-ghost'}" type="button" onclick={() => (mode = "up")}
            >Up</button
          >
        </div>
      </div>
      <form class="space-y-4 p-5 sm:p-6" onsubmit={submit}>
        {#if mode === "up"}
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.displayName")}</span>
            <input class="input input-bordered w-full" bind:value={displayName} required />
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.handle")}</span>
            <input class="input input-bordered w-full" bind:value={handle} required pattern="[a-z0-9_]{3,30}" />
          </label>
        {/if}
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
      <div class="border-t border-[var(--scifi-border)] px-5 py-3.5">
        <button class="btn btn-ghost btn-sm" type="button" onclick={magic}>{t(messages, "auth.magicLink")}</button>
        {#if error}<p class="mt-2 text-sm text-error">{error}</p>{/if}
      </div>
    </div>
  </div>
</main>
