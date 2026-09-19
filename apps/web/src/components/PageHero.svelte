<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    kicker,
    title,
    sub = "",
    actions,
  }: {
    kicker: string;
    title: string;
    sub?: string;
    actions?: Snippet;
  } = $props();
</script>

<header class="page-hero">
  <p class="label-kicker neon-flicker text-scifi-primary mb-2">// {kicker}</p>
  <h1 class="page-hero__title"><span class="brand-mark">{title}</span></h1>
  {#if sub}<p class="page-hero__sub">{sub}</p>{/if}
  {#if actions}
    <div class="mt-5 flex flex-wrap items-center gap-2">{@render actions()}</div>
  {/if}
</header>
