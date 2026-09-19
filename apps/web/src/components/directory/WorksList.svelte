<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { viewMode } from "../../lib/viewMode";
  import { reveal, hueOf, workCoverUrl } from "../../lib/reveal";
  import { shortDate, type WorkRow } from "../../lib/directory";
  import AiMadeBadge from "../AiMadeBadge.svelte";

  let {
    items,
    empty = "Nothing here yet.",
  }: {
    items: WorkRow[];
    empty?: string;
  } = $props();

  let locale = $derived($localeStore);
</script>

{#if items.length === 0}
  <p class="text-sm text-scifi-muted">{empty}</p>
{:else if $viewMode === "table"}
  <div class="hub-table-wrap" use:reveal>
    <table class="hub-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Type</th>
          <th>Discipline</th>
          <th>Creator</th>
          <th>Published</th>
          <th>Views</th>
        </tr>
      </thead>
      <tbody>
        {#each items as w}
          <tr>
            <td>
              <a
                use:link
                href={localePath(locale, `works/${w.slug}`)}
                class="work-thumb work-thumb--table"
                class:work-thumb--photo={!!workCoverUrl(w)}
                style="--h: {hueOf(w.slug)}"
                aria-hidden="true"
                tabindex="-1"
              >
                {#if workCoverUrl(w)}
                  <img src={workCoverUrl(w)} alt="" loading="lazy" />
                {/if}
              </a>
            </td>
            <td class="font-medium">
              <a use:link class="hover:text-scifi-primary" href={localePath(locale, `works/${w.slug}`)}>{w.title}</a>
            </td>
            <td>
              <span class="badge badge-outline badge-sm">{w.type}</span>
              {#if w.aiGenerated}
                <AiMadeBadge compact />
              {/if}
            </td>
            <td class="text-scifi-muted">{w.primaryDiscipline?.nameEn ?? "—"}</td>
            <td>
              <a use:link class="hover:text-scifi-primary" href={localePath(locale, `u/${w.profile.handle}`)}>
                <span class="block truncate font-medium">{w.profile.displayName}</span>
                <span class="font-mono text-xs text-scifi-cyan">@{w.profile.handle}</span>
              </a>
            </td>
            <td class="whitespace-nowrap text-scifi-muted">{shortDate(w.publishedAt, locale)}</td>
            <td class="tabular-nums text-scifi-muted">{w.viewCount ?? 0}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {#each items as w, i}
      <a
        use:link
        use:reveal={i * 50}
        class="pane card-lift overflow-hidden p-0"
        href={localePath(locale, `works/${w.slug}`)}
      >
        <div class="work-thumb" class:work-thumb--photo={!!workCoverUrl(w)} style="--h: {hueOf(w.slug)}">
          {#if workCoverUrl(w)}
            <img src={workCoverUrl(w)} alt="" loading="lazy" />
          {/if}
          <span class="work-thumb__type">{w.type}</span>
          {#if w.aiGenerated}
            <span class="work-thumb__ai"><AiMadeBadge compact /></span>
          {/if}
        </div>
        <div class="p-3.5">
          <div class="truncate font-semibold">{w.title}</div>
          <div class="mt-0.5 truncate text-xs text-scifi-muted">
            {w.profile.displayName} · @{w.profile.handle}
          </div>
          {#if w.primaryDiscipline}
            <div class="mt-1.5">
              <span class="badge badge-outline badge-sm">{w.primaryDiscipline.nameEn}</span>
            </div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
{/if}
