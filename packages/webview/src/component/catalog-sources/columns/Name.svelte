<script lang="ts">
import { displayedName, type CatalogSourceUI } from '/@/component/catalog-sources/CatalogSourceUI';

const { object }: { object: CatalogSourceUI } = $props();

const name = $derived(displayedName(object));
</script>

<div class="text-(--pd-table-body-text-highlight) overflow-hidden text-ellipsis max-w-full" title={name}>
  {name}
</div>
