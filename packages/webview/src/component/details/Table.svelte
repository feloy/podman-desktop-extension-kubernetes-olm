<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children?: Snippet;
}
let { children }: Props = $props();
</script>

<!-- the container of the table scrolls, the table can be followed by other content -->
<div class="flex px-5 py-4 flex-col items-start text-(--pd-table-body-text)">
  <table class="w-full">
    <tbody>
      {@render children?.()}
    </tbody>
  </table>
</div>
