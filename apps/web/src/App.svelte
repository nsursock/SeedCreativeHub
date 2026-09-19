<script lang="ts">
  import Router, { push, location } from "svelte-spa-router";
  import { onMount } from "svelte";
  import AppShell from "./components/AppShell.svelte";
  import Landing from "./pages/Landing.svelte";
  import Explore from "./pages/Explore.svelte";
  import Creators from "./pages/Creators.svelte";
  import Works from "./pages/Works.svelte";
  import Profile from "./pages/Profile.svelte";
  import Auth from "./pages/Auth.svelte";
  import Claim from "./pages/Claim.svelte";
  import Collaborate from "./pages/Collaborate.svelte";
  import Events from "./pages/Events.svelte";
  import Search from "./pages/Search.svelte";
  import Admin from "./pages/Admin.svelte";
  import Work from "./pages/Work.svelte";
  import Create from "./pages/Create.svelte";
  import Notifications from "./pages/Notifications.svelte";
  import Magic from "./pages/Magic.svelte";
  import { applyDocumentLocale, detectLocale, getMessages, localePath, type Locale } from "./lib/i18n";
  import { locale as localeStore, me, perfLite, refreshSession, sessionReady } from "./lib/stores";
  import { rememberAuthNext, routeRest } from "./lib/authGate";
  import { initClientObservability } from "./lib/analytics";

  let locale = $state<Locale>(detectLocale());
  let messages = $derived(getMessages(locale));

  function syncLocaleFromHash() {
    const next = detectLocale(); // always English for now
    const m = (window.location.hash || "").match(/^#?\/([a-z]{2})(\/|$)/);
    if (!m || m[1] !== next) {
      const rest = (window.location.hash || "").replace(/^#?\/([a-z]{2})(?=\/|$)/, "") || "";
      locale = next;
      localeStore.set(next);
      applyDocumentLocale(next);
      localStorage.setItem("locale", next);
      push(`/${next}${rest}`);
      return;
    }
    locale = next;
    localeStore.set(next);
    applyDocumentLocale(next);
    localStorage.setItem("locale", next);
  }

  const routes = {
    "/:locale": Landing,
    "/:locale/explore": Explore,
    "/:locale/creators": Creators,
    "/:locale/works": Works,
    "/:locale/u/:handle": Profile,
    "/:locale/auth": Auth,
    "/:locale/auth/magic": Magic,
    "/:locale/claim/:token": Claim,
    "/:locale/collaborate": Collaborate,
    "/:locale/collaborate/:slug": Collaborate,
    "/:locale/events": Events,
    "/:locale/events/:slug": Events,
    "/:locale/search": Search,
    "/:locale/admin": Admin,
    "/:locale/works/:slug": Work,
    "/:locale/create": Create,
    "/:locale/notifications": Notifications,
  };

  /** Browse is public. Only account/admin surfaces require a session. */
  $effect(() => {
    if (!$sessionReady) return;
    const rest = routeRest($location || "/");
    const needsAccount = rest === "create" || rest === "notifications" || rest === "admin";
    if (!needsAccount) return;

    if (!$me) {
      rememberAuthNext(`/${locale}${rest ? `/${rest}` : ""}`);
      push(localePath(locale, "auth"));
      return;
    }
    if (rest === "admin" && $me.role !== "admin" && $me.role !== "editor") {
      push(localePath(locale, "explore"));
    }
  });

  onMount(() => {
    initClientObservability();
    syncLocaleFromHash();
    window.addEventListener("hashchange", syncLocaleFromHash);
    if (localStorage.getItem("perf-lite") === "1") perfLite.set(true);
    const unsub = perfLite.subscribe((v) => {
      document.documentElement.classList.toggle("perf-lite", v);
      localStorage.setItem("perf-lite", v ? "1" : "0");
    });
    refreshSession().catch(() => undefined);
    return () => {
      window.removeEventListener("hashchange", syncLocaleFromHash);
      unsub();
    };
  });
</script>

<div class="hub-root" class:perf-lite={$perfLite}>
  <div class="hub-atmosphere" aria-hidden="true">
    <div class="hub-atmosphere__grid"></div>
    <div class="hub-atmosphere__glow"></div>
    <div class="hub-atmosphere__glow hub-atmosphere__glow--cyan"></div>
    <div class="hub-atmosphere__glow hub-atmosphere__glow--violet"></div>
    <div class="hub-atmosphere__floor"></div>
    <div class="hub-atmosphere__scan"></div>
    <div class="hub-atmosphere__vignette"></div>
  </div>
  <div class="hub-content">
    <AppShell {locale} {messages} />
    {#if !$sessionReady}
      <div class="hub-page flex justify-center py-20">
        <div class="skeleton h-10 w-48"></div>
      </div>
    {:else}
      <Router {routes} />
    {/if}
  </div>
</div>
