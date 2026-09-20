<script lang="ts">
  import { link, push } from "svelte-spa-router";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";
  import { gql, setCsrfToken } from "../lib/gql";
  import { refreshSession } from "../lib/stores";
  import { track } from "../lib/analytics";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));

  /** false = sign up (left), true = sign in (slides to right) — mirrors Track Record credentials */
  let showLogin = $state(true);
  let loading = $state(false);
  let email = $state("");
  let password = $state("");
  let displayName = $state("");
  let handle = $state("");
  let error = $state("");
  let success = $state("");

  function toggleForm() {
    showLogin = !showLogin;
    error = "";
    success = "";
  }

  async function submit(e: Event) {
    e.preventDefault();
    error = "";
    success = "";
    loading = true;
    try {
      if (showLogin) {
        const res = await gql<{ signIn: { csrfToken: string } }>(
          `mutation($input: SignInInput!) { signIn(input: $input) { csrfToken user { id } } }`,
          { input: { email, password } },
        );
        setCsrfToken(res.signIn.csrfToken);
        track("sign_in", { method: "password" });
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
        track("signup", { method: "password", locale });
      }
      await refreshSession();
      push(localePath(locale, "explore"));
    } catch (err) {
      error = err instanceof Error ? err.message : t(messages, "common.error");
    } finally {
      loading = false;
    }
  }

  async function magic() {
    error = "";
    success = "";
    if (!email.trim()) {
      error = "Enter your email first.";
      return;
    }
    loading = true;
    try {
      await gql(`mutation($email: String!) { requestMagicLink(email: $email) { ok } }`, { email });
      track("magic_link_request");
      success = "Check your email for a magic link.";
    } catch (err) {
      error = err instanceof Error ? err.message : t(messages, "common.error");
    } finally {
      loading = false;
    }
  }
</script>

<main class="hub-auth">
  <div class="hub-auth__grid">
    <!-- Forms column — slides right on sign-in -->
    <div class="hub-auth__forms" class:hub-auth__forms--login={showLogin}>
      <!-- Sign up -->
      <div class="hub-auth__pane" class:hub-auth__pane--active={!showLogin} aria-hidden={showLogin}>
        <div class="hub-auth__card">
          <div class="text-center">
            <p class="label-kicker neon-flicker text-scifi-primary mb-2">// join</p>
            <h1 class="hub-auth__title">
              <span class="brand-mark">{t(messages, "auth.signUpTitle")}</span>
            </h1>
            <p class="hub-auth__sub">{t(messages, "auth.signUpSub")}</p>
          </div>

          {#if error && !showLogin}
            <div class="hub-auth__flash hub-auth__flash--error">{error}</div>
          {/if}
          {#if success && !showLogin}
            <div class="hub-auth__flash hub-auth__flash--ok">{success}</div>
          {/if}

          <form class="hub-auth__form" onsubmit={submit}>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.displayName")}</span>
              <input class="input input-bordered w-full" bind:value={displayName} required={!showLogin} disabled={showLogin} />
            </label>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.handle")}</span>
              <input
                class="input input-bordered w-full"
                bind:value={handle}
                required={!showLogin}
                disabled={showLogin}
                pattern="[a-z0-9_]{3,30}"
                placeholder="maya_k"
              />
            </label>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.email")}</span>
              <input class="input input-bordered w-full" type="email" bind:value={email} required disabled={showLogin} />
            </label>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.password")}</span>
              <input
                class="input input-bordered w-full"
                type="password"
                bind:value={password}
                required={!showLogin}
                disabled={showLogin}
                minlength="8"
              />
            </label>
            <button class="btn-cta w-full" type="submit" disabled={loading || showLogin}>
              {loading && !showLogin ? "Creating…" : t(messages, "auth.submit")}
            </button>
            <p class="hub-auth__switch">
              Already have an account?
              <button type="button" class="hub-auth__switch-btn" onclick={toggleForm}>Log in</button>
            </p>
          </form>
        </div>
      </div>

      <!-- Sign in -->
      <div class="hub-auth__pane" class:hub-auth__pane--active={showLogin} aria-hidden={!showLogin}>
        <div class="hub-auth__card">
          <div class="text-center">
            <p class="label-kicker neon-flicker text-scifi-primary mb-2">// welcome back</p>
            <h1 class="hub-auth__title">
              <span class="brand-mark">{t(messages, "auth.signInTitle")}</span>
            </h1>
            <p class="hub-auth__sub">{t(messages, "auth.signInSub")}</p>
          </div>

          {#if error && showLogin}
            <div class="hub-auth__flash hub-auth__flash--error">{error}</div>
          {/if}
          {#if success && showLogin}
            <div class="hub-auth__flash hub-auth__flash--ok">{success}</div>
          {/if}

          <form class="hub-auth__form" onsubmit={submit}>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.email")}</span>
              <input class="input input-bordered w-full" type="email" bind:value={email} required disabled={!showLogin} />
            </label>
            <label class="form-control w-full">
              <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "auth.password")}</span>
              <input
                class="input input-bordered w-full"
                type="password"
                bind:value={password}
                required={showLogin}
                disabled={!showLogin}
                minlength="8"
              />
            </label>
            <button class="btn-cta w-full" type="submit" disabled={loading || !showLogin}>
              {loading && showLogin ? "Signing in…" : t(messages, "auth.submit")}
            </button>
            <button class="btn btn-ghost btn-sm w-full" type="button" onclick={magic} disabled={loading || !showLogin}>
              {t(messages, "auth.magicLink")}
            </button>
            <p class="hub-auth__switch">
              Don’t have an account?
              <button type="button" class="hub-auth__switch-btn" onclick={toggleForm}>Sign up</button>
            </p>
          </form>
        </div>
      </div>
    </div>

    <!-- Overlay column — slides left on sign-in -->
    <div class="hub-auth__overlay" class:hub-auth__overlay--login={showLogin} aria-hidden="true">
      <div class="hub-auth__overlay-pane" class:hub-auth__overlay-pane--active={!showLogin}>
        <div class="hub-auth__overlay-inner">
          <h2 class="hub-auth__overlay-title">{t(messages, "auth.overlayJoinTitle")}</h2>
          <p class="hub-auth__overlay-body">
            {t(messages, "auth.overlayJoinBody")}
          </p>
          <div class="hub-auth__stats">
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">4</span>
              <span class="hub-auth__stat-label">Disciplines</span>
              <span class="hub-auth__stat-hint">Music · Photo · Film · Writing</span>
            </div>
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">IRL</span>
              <span class="hub-auth__stat-label">Hub Nights</span>
              <span class="hub-auth__stat-hint">Meet the scene offline</span>
            </div>
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">Open</span>
              <span class="hub-auth__stat-label">Collabs</span>
              <span class="hub-auth__stat-hint">Paid & unpaid calls</span>
            </div>
          </div>
          <p class="hub-auth__overlay-quote">{t(messages, "auth.overlayJoinQuote")}</p>
        </div>
      </div>

      <div class="hub-auth__overlay-pane" class:hub-auth__overlay-pane--active={showLogin}>
        <div class="hub-auth__overlay-inner">
          <h2 class="hub-auth__overlay-title">{t(messages, "auth.overlayContinueTitle")}</h2>
          <p class="hub-auth__overlay-body">
            {t(messages, "auth.overlayContinueBody")}
          </p>
          <div class="hub-auth__stats">
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">Explore</span>
              <span class="hub-auth__stat-label">Five lenses</span>
              <span class="hub-auth__stat-hint">Editorial · Story · Pulse · Lens · Match</span>
            </div>
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">Create</span>
              <span class="hub-auth__stat-label">Publish</span>
              <span class="hub-auth__stat-hint">Text · Image · Audio · Video</span>
            </div>
            <div class="hub-auth__stat">
              <span class="hub-auth__stat-num">Connect</span>
              <span class="hub-auth__stat-label">Contact</span>
              <span class="hub-auth__stat-hint">Follow · message · interest</span>
            </div>
          </div>
          <p class="hub-auth__overlay-quote">
            <a use:link class="text-scifi-cyan hover:text-scifi-primary" href={localePath(locale, "")}>← Back to landing</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</main>
