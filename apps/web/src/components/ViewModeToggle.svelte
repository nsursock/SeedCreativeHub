<script lang="ts">
  import IconLayoutGrid from "@tabler/icons-svelte/icons/layout-grid";
  import IconTable from "@tabler/icons-svelte/icons/table";
  import { viewMode } from "../lib/viewMode";

  function set(next: "grid" | "table") {
    viewMode.set(next);
  }
</script>

<div class="view-toggle" role="group" aria-label="View mode">
  <button
    type="button"
    class="view-toggle__btn"
    class:view-toggle__btn--active={$viewMode === "grid"}
    aria-pressed={$viewMode === "grid"}
    title="Grid"
    onclick={() => set("grid")}
  >
    <IconLayoutGrid size={15} stroke={1.75} />
    <span>Grid</span>
  </button>
  <button
    type="button"
    class="view-toggle__btn"
    class:view-toggle__btn--active={$viewMode === "table"}
    aria-pressed={$viewMode === "table"}
    title="Table"
    onclick={() => set("table")}
  >
    <IconTable size={15} stroke={1.75} />
    <span>Table</span>
  </button>
</div>
