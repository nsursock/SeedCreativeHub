<script lang="ts">
  import { link, location } from "svelte-spa-router";
  import IconCompass from "@tabler/icons-svelte/icons/compass";
  import IconUsers from "@tabler/icons-svelte/icons/users";
  import IconHandshake from "@tabler/icons-svelte/icons/heart-handshake";
  import IconCalendar from "@tabler/icons-svelte/icons/calendar-event";
  import IconSearch from "@tabler/icons-svelte/icons/search";
  import IconPlus from "@tabler/icons-svelte/icons/plus";
  import IconBell from "@tabler/icons-svelte/icons/bell";
  import IconSparkles from "@tabler/icons-svelte/icons/sparkles";
  import IconMenu2 from "@tabler/icons-svelte/icons/menu-2";
  import IconX from "@tabler/icons-svelte/icons/x";
  import IconSettings from "@tabler/icons-svelte/icons/settings";
  import IconShield from "@tabler/icons-svelte/icons/shield";
  import IconLogout from "@tabler/icons-svelte/icons/logout";
  import type { Messages, Locale } from "../lib/i18n";
  import { localePath, t } from "../lib/i18n";
  import { me, createDrawerOpen } from "../lib/stores";
  import { gql } from "../lib/gql";
  import SettingsModal from "./SettingsModal.svelte";
  import CreateDrawer from "./CreateDrawer.svelte";

  let {
    locale,
    messages,
  }: {
    locale: Locale;
    messages: Messages;
  } = $props();

  let menuOpen = $state(false);
  let settingsOpen = $state(false);

  function openCreate() {
    if (!$me) {
      window.location.hash = pathOf("auth");
      return;
    }
    createDrawerOpen.set(true);
    menuOpen = false;
  }

  async function signOut() {
    await gql(`mutation { signOut }`);
    me.set(null);
    location.hash = localePath(locale, "");
    menuOpen = false;
  }

  function pathOf(segment = "") {
    return localePath(locale, segment);
  }

  /** Active when current route starts with the segment ("" = landing only). */
  function isActive(segment: string) {
    const path = ($location || "/").replace(/^\//, "");
    const rest = path.replace(/^[a-z]{2}\/?/, "");
    if (!segment) return rest === "";
    return rest === segment || rest.startsWith(segment + "/");
  }

  let isStaff = $derived($me?.role === "admin" || $me?.role === "editor");
</script>

<header class="app-bar hub-app-bar sticky top-0 z-40" data-enter>
  <div class="flex min-w-0 flex-1 items-center gap-3">
    <a use:link href={pathOf()} class="hub-app-bar__brand" onclick={() => (menuOpen = false)}>
      <span class="hub-app-bar__orb" aria-hidden="true"><IconSparkles size={16} stroke={1.75} /></span>
      <span class="brand-mark text-base">{t(messages, "brand")}</span>
    </a>
    <nav class="hub-app-bar__nav hidden items-center gap-0.5 md:flex" aria-label="Primary">
      <a use:link class="btn btn-ghost btn-sm gap-1 hub-nav-link" href={pathOf("explore")} aria-current={isActive("explore") ? "page" : undefined}
        ><IconCompass size={15} stroke={1.75} />{t(messages, "nav.explore")}</a
      >
      <a use:link class="btn btn-ghost btn-sm gap-1 hub-nav-link" href={pathOf("creators")} aria-current={isActive("creators") ? "page" : undefined}
        ><IconUsers size={15} stroke={1.75} />{t(messages, "nav.creators")}</a
      >
      <a use:link class="btn btn-ghost btn-sm gap-1 hub-nav-link" href={pathOf("collaborate")} aria-current={isActive("collaborate") ? "page" : undefined}
        ><IconHandshake size={15} stroke={1.75} />{t(messages, "nav.collaborate")}</a
      >
      <a use:link class="btn btn-ghost btn-sm gap-1 hub-nav-link" href={pathOf("events")} aria-current={isActive("events") ? "page" : undefined}
        ><IconCalendar size={15} stroke={1.75} />{t(messages, "nav.events")}</a
      >
      <a use:link class="btn btn-ghost btn-sm gap-1 hub-nav-link" href={pathOf("search")} aria-current={isActive("search") ? "page" : undefined}
        ><IconSearch size={15} stroke={1.75} />{t(messages, "nav.search")}</a
      >
    </nav>
  </div>

  <div class="flex shrink-0 items-center gap-1.5">
    <button
      type="button"
      class="icon-btn"
      aria-label="Settings"
      title="Settings"
      onclick={() => {
        settingsOpen = true;
        menuOpen = false;
      }}
    >
      <IconSettings size={16} stroke={1.75} />
    </button>
    {#if $me}
      <a
        use:link
        class="icon-btn hidden sm:inline-flex"
        href={pathOf("notifications")}
        aria-label={t(messages, "nav.notifications")}
      >
        <IconBell size={16} stroke={1.75} />
      </a>
      {#if isStaff}
        <a use:link class="btn btn-ghost btn-sm gap-1 hidden md:inline-flex" href={pathOf("admin")}
          ><IconShield size={15} stroke={1.75} />{t(messages, "nav.admin")}</a
        >
      {/if}
      <button class="btn btn-primary btn-sm gap-1 hidden sm:inline-flex" type="button" onclick={openCreate}
        ><IconPlus size={15} stroke={1.75} />{t(messages, "nav.create")}</button
      >
      <button class="btn btn-ghost btn-sm gap-1 hidden md:inline-flex" type="button" onclick={signOut}
        ><IconLogout size={15} stroke={1.75} />{t(messages, "nav.signOut")}</button
      >
    {:else}
      <a use:link class="btn btn-primary btn-sm hidden sm:inline-flex" href={pathOf("auth")}
        >{t(messages, "nav.signIn")}</a
      >
    {/if}
    <button
      type="button"
      class="icon-btn md:hidden"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      onclick={() => (menuOpen = !menuOpen)}
    >
      {#if menuOpen}<IconX size={16} stroke={1.75} />{:else}<IconMenu2 size={16} stroke={1.75} />{/if}
    </button>
  </div>
</header>

{#if menuOpen}
  <div class="fixed inset-0 z-30 bg-[rgba(var(--scifi-bg-deep-rgb),0.72)] backdrop-blur-sm md:hidden" role="presentation">
    <button class="absolute inset-0 cursor-default" type="button" aria-label="Close" onclick={() => (menuOpen = false)}
    ></button>
    <div class="console-panel absolute inset-x-3 top-[4.25rem] p-3" role="dialog" aria-modal="true" aria-label="Menu">
      <nav class="flex flex-col gap-1">
        <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("explore")} onclick={() => (menuOpen = false)}
          ><IconCompass size={16} />{t(messages, "nav.explore")}</a
        >
        <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("creators")} onclick={() => (menuOpen = false)}
          ><IconUsers size={16} />{t(messages, "nav.creators")}</a
        >
        <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("collaborate")} onclick={() => (menuOpen = false)}
          ><IconHandshake size={16} />{t(messages, "nav.collaborate")}</a
        >
        <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("events")} onclick={() => (menuOpen = false)}
          ><IconCalendar size={16} />{t(messages, "nav.events")}</a
        >
        <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("search")} onclick={() => (menuOpen = false)}
          ><IconSearch size={16} />{t(messages, "nav.search")}</a
        >
        <button
          class="btn btn-ghost justify-start gap-2"
          type="button"
          onclick={() => {
            menuOpen = false;
            settingsOpen = true;
          }}
          ><IconSettings size={16} />Settings</button
        >
        {#if $me}
          {#if isStaff}
            <a use:link class="btn btn-ghost justify-start gap-2" href={pathOf("admin")} onclick={() => (menuOpen = false)}
              ><IconShield size={16} />{t(messages, "nav.admin")}</a
            >
          {/if}
          <button class="btn btn-primary justify-start gap-2" type="button" onclick={openCreate}
            ><IconPlus size={16} />{t(messages, "nav.create")}</button
          >
          <button class="btn btn-ghost justify-start gap-2" type="button" onclick={signOut}
            ><IconLogout size={16} />{t(messages, "nav.signOut")}</button
          >
        {:else}
          <a use:link class="btn btn-primary justify-start" href={pathOf("auth")} onclick={() => (menuOpen = false)}
            >{t(messages, "nav.signIn")}</a
          >
        {/if}
      </nav>
    </div>
  </div>
{/if}

<nav class="hub-bottom-nav md:hidden" aria-label="Mobile">
  <a use:link href={pathOf("explore")} aria-current={isActive("explore") ? "page" : undefined}>
    <IconCompass size={18} stroke={1.75} />
    <span>{t(messages, "nav.explore")}</span>
  </a>
  <a use:link href={pathOf("collaborate")} aria-current={isActive("collaborate") ? "page" : undefined}>
    <IconHandshake size={18} stroke={1.75} />
    <span>{t(messages, "nav.collaborate")}</span>
  </a>
  {#if $me}
    <button type="button" aria-current={$createDrawerOpen ? "page" : undefined} onclick={openCreate}>
      <IconPlus size={18} stroke={1.75} />
      <span>{t(messages, "nav.create")}</span>
    </button>
  {:else}
    <a use:link href={pathOf("auth")}>
      <IconPlus size={18} stroke={1.75} />
      <span>{t(messages, "nav.create")}</span>
    </a>
  {/if}
  <a use:link href={pathOf("events")} aria-current={isActive("events") ? "page" : undefined}>
    <IconCalendar size={18} stroke={1.75} />
    <span>{t(messages, "nav.events")}</span>
  </a>
  <a
    use:link
    href={$me ? pathOf("notifications") : pathOf("auth")}
    aria-current={isActive("notifications") || isActive("auth") ? "page" : undefined}
  >
    {#if $me}<IconBell size={18} stroke={1.75} />{:else}<IconUsers size={18} stroke={1.75} />{/if}
    <span>{$me ? t(messages, "nav.notifications") : t(messages, "nav.signIn")}</span>
  </a>
</nav>

<SettingsModal bind:open={settingsOpen} />
<CreateDrawer />
