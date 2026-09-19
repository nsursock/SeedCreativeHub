<script lang="ts">
  import { type DisciplineSlug, type WorkType } from "@creative-hub/shared";
  import IconX from "@tabler/icons-svelte/icons/x";
  import IconPhoto from "@tabler/icons-svelte/icons/photo";
  import IconMusic from "@tabler/icons-svelte/icons/music";
  import IconMovie from "@tabler/icons-svelte/icons/movie";
  import IconWriting from "@tabler/icons-svelte/icons/writing";
  import { getMessages, localePath, t } from "../lib/i18n";
  import { createDrawerOpen, locale as localeStore } from "../lib/stores";
  import { gql } from "../lib/gql";

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));
  let open = $derived($createDrawerOpen);

  let title = $state("");
  let discipline = $state<DisciplineSlug>("photography");
  let type = $state<WorkType>("image");
  let description = $state("");
  let externalUrl = $state("");
  let embedUrl = $state("");
  let aiGenerated = $state(false);
  let error = $state("");
  let saving = $state(false);
  let mounted = $state(false);
  let leaving = $state(false);

  const MEDIA_OPTIONS = [
    { discipline: "photography" as const, type: "image" as const, Icon: IconPhoto },
    { discipline: "music" as const, type: "audio" as const, Icon: IconMusic },
    { discipline: "film" as const, type: "video" as const, Icon: IconMovie },
    { discipline: "writing" as const, type: "text" as const, Icon: IconWriting },
  ];

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

  function resetForm() {
    title = "";
    discipline = "photography";
    type = "image";
    description = "";
    externalUrl = "";
    embedUrl = "";
    aiGenerated = false;
    error = "";
    saving = false;
  }

  function finishClose() {
    mounted = false;
    leaving = false;
    createDrawerOpen.set(false);
  }

  function requestClose() {
    if (!mounted || leaving) return;
    if (prefersInstant()) {
      finishClose();
      return;
    }
    leaving = true;
    window.setTimeout(() => {
      if (leaving) finishClose();
    }, 280);
  }

  function onBackdropAnimEnd(e: AnimationEvent) {
    if (e.target !== e.currentTarget) return;
    if (!leaving) return;
    if (!e.animationName.includes("hub-drawer-backdrop-out")) return;
    finishClose();
  }

  function pickMedia(next: (typeof MEDIA_OPTIONS)[number]) {
    discipline = next.discipline;
    type = next.type;
  }

  $effect(() => {
    if (!open) return;
    mounted = true;
    leaving = false;
    resetForm();
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

  async function submit(e: Event) {
    e.preventDefault();
    error = "";
    saving = true;
    try {
      const res = await gql<{ createWork: { slug: string } }>(
        `mutation($input: CreateWorkInput!) {
          createWork(input: $input) { slug }
        }`,
        {
          input: {
            title,
            type,
            description: description || undefined,
            externalUrl: externalUrl || undefined,
            embedUrl: embedUrl || undefined,
            primaryDiscipline: discipline,
            status: "published",
            aiGenerated,
          },
        },
      );
      finishClose();
      location.hash = localePath(locale, `works/${res.createWork.slug}`);
    } catch (err) {
      error = err instanceof Error ? err.message : t(messages, "common.error");
    } finally {
      saving = false;
    }
  }
</script>

{#if mounted}
  <div
    use:portal
    class="hub-create-drawer"
    class:is-leaving={leaving}
    onanimationend={onBackdropAnimEnd}
  >
    <button
      type="button"
      class="hub-create-drawer__dismiss"
      aria-label={t(messages, "common.cancel")}
      onclick={requestClose}
    ></button>
    <div
      class="hub-create-drawer__panel drawer-panel"
      role="dialog"
      aria-modal="true"
      aria-label={t(messages, "nav.create")}
      tabindex="-1"
    >
      <header class="hub-create-drawer__head">
        <div>
          <p class="label-kicker neon-flicker m-0 text-scifi-primary">// publish</p>
          <h2 class="hub-create-drawer__title brand-mark">{t(messages, "nav.create")}</h2>
        </div>
        <button type="button" class="icon-btn shrink-0" aria-label={t(messages, "common.cancel")} onclick={requestClose}>
          <IconX size={16} stroke={1.75} />
        </button>
      </header>

      <form class="hub-create-drawer__form" onsubmit={submit}>
        <fieldset class="hub-create-drawer__media">
          <legend class="label-kicker mb-2 block text-scifi-muted">{t(messages, "create.media")}</legend>
          <div class="hub-create-drawer__media-grid" role="radiogroup" aria-label={t(messages, "create.media")}>
            {#each MEDIA_OPTIONS as opt}
              {@const Icon = opt.Icon}
              <button
                type="button"
                class="hub-create-drawer__media-btn"
                class:hub-create-drawer__media-btn--active={discipline === opt.discipline}
                role="radio"
                aria-checked={discipline === opt.discipline}
                onclick={() => pickMedia(opt)}
              >
                <Icon size={18} stroke={1.75} />
                <span>{t(messages, `create.${opt.discipline}`)}</span>
              </button>
            {/each}
          </div>
        </fieldset>

        <label class="form-control w-full">
          <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.title")}</span>
          <input class="input input-bordered w-full" bind:value={title} required maxlength="200" />
        </label>

        {#if type === "text"}
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.body")}</span>
            <textarea
              class="textarea textarea-bordered w-full"
              rows="8"
              bind:value={description}
              required
              maxlength="5000"
              placeholder={t(messages, "create.bodyHint")}
            ></textarea>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.externalOptional")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={externalUrl}
              placeholder="https://"
            />
          </label>
        {:else if type === "image"}
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.caption")}</span>
            <textarea
              class="textarea textarea-bordered w-full"
              rows="3"
              bind:value={description}
              maxlength="5000"
              placeholder={t(messages, "create.captionHint")}
            ></textarea>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.imageUrl")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={externalUrl}
              placeholder="https://"
            />
            <span class="mt-1 block text-xs text-scifi-muted">{t(messages, "create.imageUrlHint")}</span>
          </label>
        {:else if type === "audio"}
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.notes")}</span>
            <textarea
              class="textarea textarea-bordered w-full"
              rows="3"
              bind:value={description}
              maxlength="5000"
            ></textarea>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.embed")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={embedUrl}
              placeholder="https://soundcloud.com/…"
            />
            <span class="mt-1 block text-xs text-scifi-muted">{t(messages, "create.embedAudioHint")}</span>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.externalOptional")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={externalUrl}
              placeholder="https://"
            />
          </label>
        {:else}
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.notes")}</span>
            <textarea
              class="textarea textarea-bordered w-full"
              rows="3"
              bind:value={description}
              maxlength="5000"
            ></textarea>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.embed")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={embedUrl}
              placeholder="https://youtube.com/…"
            />
            <span class="mt-1 block text-xs text-scifi-muted">{t(messages, "create.embedVideoHint")}</span>
          </label>
          <label class="form-control w-full">
            <span class="label-kicker mb-1.5 block text-scifi-muted">{t(messages, "create.externalOptional")}</span>
            <input
              class="input input-bordered w-full"
              type="url"
              bind:value={externalUrl}
              placeholder="https://"
            />
          </label>
        {/if}

        <label class="hub-create-drawer__ai flex cursor-pointer items-start gap-2.5">
          <input class="checkbox checkbox-sm mt-0.5" type="checkbox" bind:checked={aiGenerated} />
          <span>
            <span class="label-kicker block text-scifi-muted">{t(messages, "create.aiGenerated")}</span>
            <span class="mt-0.5 block text-xs text-scifi-muted">{t(messages, "create.aiGeneratedHint")}</span>
          </span>
        </label>

        {#if error}<p class="m-0 text-sm text-error">{error}</p>{/if}

        <div class="hub-create-drawer__actions">
          <button class="btn btn-ghost" type="button" onclick={requestClose}>{t(messages, "common.cancel")}</button>
          <button class="btn-cta flex-1" type="submit" disabled={saving}>
            {saving ? t(messages, "common.loading") : t(messages, "create.publish")}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
