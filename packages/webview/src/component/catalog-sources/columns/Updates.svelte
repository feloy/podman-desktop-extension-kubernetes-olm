<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import { updatesDisplay, type CatalogSourceUI } from '/@/component/catalog-sources/CatalogSourceUI';

const { object }: { object: CatalogSourceUI } = $props();

const display = $derived(updatesDisplay(object));
</script>

<Tooltip tip={display.tip}>
  <span class="text-(--pd-table-body-text)">{display.label}</span>
</Tooltip>
