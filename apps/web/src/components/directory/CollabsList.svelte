<script lang="ts">
  import { link } from "svelte-spa-router";
  import { localePath } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { viewMode } from "../../lib/viewMode";
  import { reveal, hueOf } from "../../lib/reveal";
  import { shortDate, labelOf, payBadgeClass, type CollabRow } from "../../lib/directory";

  let {
    items,
    empty = "Nothing here yet.",
  }: {
    items: CollabRow[];
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
          <th>Location</th>
          <th>Discipline</th>
          <th>Remote</th>
          <th>Deadline</th>
          <th>Interest</th>
          <th>Pay</th>
        </tr>
      </thead>
      <tbody>
        {#each items as o}
          <tr>
            <td>
              <a
                use:link
                href={localePath(locale, `collaborate/${o.slug}`)}
                class="work-thumb work-thumb--table"
                class:work-thumb--photo={!!o.imageUrl}
                style="--h: {hueOf(o.slug)}"
                aria-hidden="true"
                tabindex="-1"
              >
                {#if o.imageUrl}
                  <img src={o.imageUrl} alt="" loading="lazy" />
                {/if}
              </a>
            </td>
            <td class="font-medium">
              <a use:link class="hover:text-scifi-primary" href={localePath(locale, `collaborate/${o.slug}`)}>{o.title}</a>
            </td>
            <td class="hub-table__clip text-scifi-muted">{o.location ?? "—"}</td>
            <td>
              {#if o.discipline}
                <span class="badge badge-outline badge-sm">{labelOf(o.discipline)}</span>
              {:else}
                <span class="text-scifi-muted">—</span>
              {/if}
            </td>
            <td class="text-scifi-muted">{labelOf(o.remoteMode)}</td>
            <td class="whitespace-nowrap text-scifi-muted">{shortDate(o.deadline, locale)}</td>
            <td class="tabular-nums text-scifi-muted">{o.interestCount ?? 0}</td>
            <td>
              {#if o.compensationStatus}
                <span class="badge badge-sm {payBadgeClass(o.compensationStatus)}">{labelOf(o.compensationStatus)}</span>
              {:else}
                <span class="text-scifi-muted">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
    {#each items as o, i}
      <li use:reveal={(i % 6) * 50}>
        <a
          use:link
          class="pane pane-bracketed card-lift flex h-full flex-col overflow-hidden p-0"
          href={localePath(locale, `collaborate/${o.slug}`)}
        >
          <div class="feature-thumb">
            {#if o.imageUrl}
              <img src={o.imageUrl} alt="" loading="lazy" />
            {/if}
          </div>
          <span class="block flex-1 p-4 sm:p-5">
            <span class="block truncate text-base font-semibold">{o.title}</span>
            <span class="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-scifi-muted">
              {o.location} · {labelOf(o.discipline)}
              {#if o.compensationStatus}
                <span class="badge badge-sm {payBadgeClass(o.compensationStatus)}">{labelOf(o.compensationStatus)}</span>
              {/if}
            </span>
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
