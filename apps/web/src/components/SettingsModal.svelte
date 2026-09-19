<script lang="ts">
  import { onMount } from "svelte";
  import IconX from "@tabler/icons-svelte/icons/x";
  import IconCheck from "@tabler/icons-svelte/icons/check";
  import IconWaveSine from "@tabler/icons-svelte/icons/wave-sine";
  import IconDeviceDesktop from "@tabler/icons-svelte/icons/device-desktop";
  import IconConfetti from "@tabler/icons-svelte/icons/confetti";
  import IconSunset2 from "@tabler/icons-svelte/icons/sunset-2";
  import IconMoonStars from "@tabler/icons-svelte/icons/moon-stars";
  import IconLeaf from "@tabler/icons-svelte/icons/leaf";
  import IconSunrise from "@tabler/icons-svelte/icons/sunrise";
  import IconCloud from "@tabler/icons-svelte/icons/cloud";
  import IconContrast from "@tabler/icons-svelte/icons/contrast";
  import IconBolt from "@tabler/icons-svelte/icons/bolt";
  import IconLayoutGrid from "@tabler/icons-svelte/icons/layout-grid";
  import IconTable from "@tabler/icons-svelte/icons/table";
  import {
    THEME_IDS,
    THEME_META,
    DEFAULT_THEME,
    applyTheme,
    readStoredTheme,
    type ThemeId,
  } from "../lib/themes";
  import { perfLite } from "../lib/stores";
  import { viewMode, type ViewMode } from "../lib/viewMode";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const THEME_ICONS: Record<ThemeId, any> = {
    retrowave: IconWaveSine,
    synthwave84: IconDeviceDesktop,
    fiesta: IconConfetti,
    goldenTwilight: IconSunset2,
    solarizedDark: IconMoonStars,
    ghibli: IconLeaf,
    dawn: IconSunrise,
    cottonCandy: IconCloud,
    brightContrasts: IconContrast,
  };

  let theme = $state<ThemeId>(DEFAULT_THEME);
  let mounted = $state(false);
  let leaving = $state(false);

  /** Mount overlay on document.body so page layout never shifts. */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function prefersInstant() {
    return (
      document.documentElement.classList.contains("perf-lite") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function finishClose() {
    mounted = false;
    leaving = false;
    open = false;
  }

  function requestClose() {
    if (!mounted || leaving) return;
    if (prefersInstant()) {
      finishClose();
      return;
    }
    leaving = true;
    // Fallback if animationend is skipped (e.g. mid-flight CSS override).
    window.setTimeout(() => {
      if (leaving) finishClose();
    }, 280);
  }

  function onBackdropAnimEnd(e: AnimationEvent) {
    if (e.target !== e.currentTarget) return;
    if (!leaving) return;
    if (!e.animationName.includes("scifi-modal-backdrop-out")) return;
    finishClose();
  }

  onMount(() => {
    theme = readStoredTheme();
    applyTheme(theme);
  });

  $effect(() => {
    if (!open) return;
    mounted = true;
    leaving = false;
    theme = readStoredTheme();
  });

  $effect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  });

  function pickTheme(id: ThemeId) {
    theme = id;
    applyTheme(id);
  }

  function setView(next: ViewMode) {
    viewMode.set(next);
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) requestClose();
  }
</script>

{#if mounted}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    use:portal
    class="modal-backdrop"
    class:is-leaving={leaving}
    role="dialog"
    aria-modal="true"
    aria-label="Settings"
    tabindex="-1"
    onclick={onBackdropClick}
    onanimationend={onBackdropAnimEnd}
  >
    <div class="modal hub-settings">
      <div class="flex items-start justify-between gap-3">
        <h3 class="modal-title mb-0">Settings</h3>
        <button type="button" class="icon-btn shrink-0" aria-label="Close" onclick={requestClose}>
          <IconX size={16} stroke={1.75} />
        </button>
      </div>

      <div class="hub-settings__body space-y-5">
        <section class="space-y-2">
          <p class="label-kicker m-0 text-scifi-muted">Theme</p>
          <div class="hub-settings__themes" role="listbox" aria-label="Theme">
            {#each THEME_IDS as id}
              {@const Icon = THEME_ICONS[id]}
              <button
                type="button"
                class="hub-settings__theme"
                class:hub-settings__theme--active={theme === id}
                role="option"
                aria-selected={theme === id}
                onclick={() => pickTheme(id)}
              >
                <Icon size={16} stroke={1.75} />
                <span class="truncate">{THEME_META[id].label}</span>
                {#if theme === id}
                  <IconCheck size={14} class="ms-auto shrink-0 text-scifi-primary" />
                {/if}
              </button>
            {/each}
          </div>
        </section>

        <section class="space-y-2">
          <p class="label-kicker m-0 text-scifi-muted">Browse layout</p>
          <div class="view-toggle">
            <button
              type="button"
              class="view-toggle__btn"
              class:view-toggle__btn--active={$viewMode === "grid"}
              aria-pressed={$viewMode === "grid"}
              onclick={() => setView("grid")}
            >
              <IconLayoutGrid size={15} stroke={1.75} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              class="view-toggle__btn"
              class:view-toggle__btn--active={$viewMode === "table"}
              aria-pressed={$viewMode === "table"}
              onclick={() => setView("table")}
            >
              <IconTable size={15} stroke={1.75} />
              <span>Table</span>
            </button>
          </div>
        </section>

        <section class="space-y-2">
          <p class="label-kicker m-0 text-scifi-muted">Performance</p>
          <label class="hub-settings__row">
            <span class="flex items-center gap-2">
              <IconBolt size={16} stroke={1.75} class="text-scifi-muted" />
              <span>
                <span class="block text-sm font-medium" style="color: var(--scifi-text)">Lite mode</span>
                <span class="block text-xs text-scifi-muted">Reduce motion and atmosphere effects</span>
              </span>
            </span>
            <input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={$perfLite} />
          </label>
        </section>
      </div>

      <div class="modal-actions mt-4">
        <button type="button" class="btn btn-primary" onclick={requestClose}>Done</button>
      </div>
    </div>
  </div>
{/if}
