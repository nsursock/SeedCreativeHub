<script lang="ts">
  import { link } from "svelte-spa-router";
  import { getMessages, localePath, t } from "../../lib/i18n";
  import { locale as localeStore } from "../../lib/stores";
  import { viewMode } from "../../lib/viewMode";
  import { reveal, hueOf } from "../../lib/reveal";
  import { dayOf, monthOf, shortDate, timeOf, labelOf, cityLabel, type EventRow } from "../../lib/directory";

  let {
    items,
    empty = "Nothing here yet.",
  }: {
    items: EventRow[];
    empty?: string;
  } = $props();

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));
</script>

{#if items.length === 0}
  <p class="text-sm text-scifi-muted">{empty}</p>
{:else if $viewMode === "table"}
  <div class="hub-table-wrap" use:reveal>
    <table class="hub-table">
      <thead>
        <tr>
          <th></th>
          <th>When</th>
          <th>Name</th>
          <th>Venue</th>
          <th>City</th>
          <th>Category</th>
          <th>Capacity</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {#each items as e}
          <tr>
            <td>
              <a
                use:link
                href={localePath(locale, `events/${e.slug}`)}
                class="work-thumb work-thumb--table"
                class:work-thumb--photo={!!e.imageUrl}
                style="--h: {hueOf(e.slug)}"
                aria-hidden="true"
                tabindex="-1"
              >
                {#if e.imageUrl}
                  <img src={e.imageUrl} alt="" loading="lazy" />
                {/if}
              </a>
            </td>
            <td>
              <span class="flex items-center gap-2.5">
                <span class="date-block date-block--table">
                  <span class="date-block__day">{dayOf(e.startsAt)}</span>
                  <span class="date-block__month">{monthOf(e.startsAt, locale)}</span>
                </span>
                <span class="min-w-0">
                  <span class="block whitespace-nowrap font-medium tabular-nums">{timeOf(e.startsAt, locale)}</span>
                  <span class="block text-xs text-scifi-muted">{shortDate(e.startsAt, locale)}</span>
                </span>
              </span>
            </td>
            <td class="font-medium">
              <a use:link class="hover:text-scifi-primary" href={localePath(locale, `events/${e.slug}`)}>{e.name}</a>
            </td>
            <td class="hub-table__clip text-scifi-muted">{e.venue ?? "—"}</td>
            <td class="text-scifi-muted">{cityLabel(e.city, locale)}</td>
            <td>
              {#if e.category}
                <span class="badge badge-outline badge-sm">{labelOf(e.category)}</span>
              {:else}
                <span class="text-scifi-muted">—</span>
              {/if}
            </td>
            <td class="tabular-nums text-scifi-muted">{e.capacity ?? "—"}</td>
            <td>
              {#if e.isHubNight}
                <span class="badge badge-primary badge-sm">{t(messages, "events.hubNight")}</span>
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
    {#each items as e, i}
      <li use:reveal={(i % 6) * 50}>
        <a
          use:link
          class="pane pane-bracketed card-lift flex h-full flex-col overflow-hidden p-0"
          href={localePath(locale, `events/${e.slug}`)}
        >
          <div class="feature-thumb">
            {#if e.imageUrl}
              <img src={e.imageUrl} alt="" loading="lazy" />
            {/if}
          </div>
          <span class="flex flex-1 items-center gap-4 p-4 sm:p-5">
            <span class="date-block">
              <span class="date-block__day">{dayOf(e.startsAt)}</span>
              <span class="date-block__month">{monthOf(e.startsAt, locale)}</span>
            </span>
            <span class="min-w-0">
              <span class="block truncate text-base font-semibold">{e.name}</span>
              <span class="mt-0.5 block truncate text-sm text-scifi-muted">{e.venue} · {cityLabel(e.city, locale)}</span>
              {#if e.isHubNight}
                <span class="badge badge-primary badge-sm mt-1.5">{t(messages, "events.hubNight")}</span>
              {/if}
              {#if e.status === "past" || (e.startsAt && new Date(e.startsAt).getTime() < Date.now())}
                <span class="badge badge-outline badge-sm mt-1.5">past</span>
              {/if}
            </span>
          </span>
        </a>
      </li>
    {/each}
  </ul>
{/if}
