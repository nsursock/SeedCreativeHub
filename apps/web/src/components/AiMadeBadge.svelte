<script lang="ts">
  import { getMessages, t } from "../lib/i18n";
  import { locale as localeStore } from "../lib/stores";

  let {
    compact = false,
  }: {
    compact?: boolean;
  } = $props();

  let locale = $derived($localeStore);
  let messages = $derived(getMessages(locale));
</script>

<span
  class="ai-made-badge"
  class:ai-made-badge--compact={compact}
  title={t(messages, "work.aiMadeHint")}
>
  {compact ? t(messages, "work.aiMadeShort") : t(messages, "work.aiMade")}
</span>
