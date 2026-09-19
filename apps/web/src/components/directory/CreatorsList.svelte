<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { viewMode } from "../../lib/viewMode";
  import { reveal, hueOf, initialsOf } from "../../lib/reveal";
  import { cityLabel, type CreatorRow } from "../../lib/directory";

  let {
    items,
    empty = "Nothing here yet.",
  }: {
    items: CreatorRow[];
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
          <th>Name</th>
          <th>Handle</th>
          <th>City</th>
          <th>Works</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each items as c}
          <tr>
            <td>
              <a
                use:link
                href={localePath(locale, `u/${c.handle}`)}
                class="work-thumb work-thumb--table"
                class:work-thumb--photo={!!c.avatarUrl}
                style="--h: {hueOf(c.handle)}"
                aria-hidden="true"
                tabindex="-1"
              >
                {#if c.avatarUrl}
                  <img src={c.avatarUrl} alt="" loading="lazy" />
                {:else}
                  <span class="work-thumb__initials">{initialsOf(c.displayName)}</span>
                {/if}
              </a>
            </td>
            <td class="font-medium">
              <a use:link class="hover:text-scifi-primary" href={localePath(locale, `u/${c.handle}`)}>{c.displayName}</a>
            </td>
            <td class="font-mono text-scifi-cyan">@{c.handle}</td>
            <td class="text-scifi-muted">{cityLabel(c.city, locale)}</td>
            <td>{c.worksCount ?? 0}</td>
            <td>
              {#if c.isFounding}<span class="badge badge-primary badge-sm me-1">founding</span>{/if}
              {#if c.claimStatus !== "claimed"}
                <span class="badge badge-warning badge-sm">{c.claimStatus}</span>
              {:else}
                <span class="badge badge-success badge-sm">claimed</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each items as c, i}
      <a
        use:link
        use:reveal={(i % 9) * 50}
        class="creator-card pane pane-bracketed card-lift"
        href={localePath(locale, `u/${c.handle}`)}
      >
        <div class="creator-card__cover" style="--h: {hueOf(c.handle)}">
          {#if c.coverUrl}
            <img src={c.coverUrl} alt="" loading="lazy" />
          {/if}
        </div>
        <div class="creator-card__body">
          <span class="creator-card__avatar" style="--h: {hueOf(c.handle)}">
            {#if c.avatarUrl}
              <img src={c.avatarUrl} alt="" loading="lazy" />
            {:else}
              <span class="creator-card__avatar-fallback">{initialsOf(c.displayName)}</span>
            {/if}
          </span>
          <span class="block truncate pe-14 text-base font-semibold">{c.displayName}</span>
          <span class="mt-0.5 block truncate pe-14 text-xs text-scifi-muted">@{c.handle} · {cityLabel(c.city, locale)}</span>
          <span class="mt-2.5 flex flex-wrap items-center gap-1.5">
            {#if typeof c.worksCount === "number"}
              <span class="badge badge-outline badge-sm">{c.worksCount} {c.worksCount === 1 ? "work" : "works"}</span>
            {/if}
            {#if c.isFounding}<span class="badge badge-primary badge-sm">founding</span>{/if}
            {#if c.claimStatus !== "claimed"}
              <span class="badge badge-warning badge-sm">{c.claimStatus}</span>
            {/if}
          </span>
        </div>
      </a>
    {/each}
  </div>
{/if}
