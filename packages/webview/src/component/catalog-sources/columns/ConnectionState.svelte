<script lang="ts">
import { StatusIcon, Tooltip } from '@podman-desktop/ui-svelte';
import type { CatalogSourceUI } from '/@/component/catalog-sources/CatalogSourceUI';
import CatalogIcon from '/@/component/icons/CatalogIcon.svelte';
import { toStatusIconStatus } from './connection-state';

const { object }: { object: CatalogSourceUI } = $props();

const label = $derived(object.connectionState || 'Unknown');
</script>

<Tooltip tip={label} class="inline-flex">
  <!-- StatusIcon sets its own native title (the mapped status, e.g. RUNNING): it is made transparent
       to the pointer, so that only the tooltip with the state reported by OLM is displayed -->
  <div class="pointer-events-none" aria-label={label}>
    <StatusIcon icon={CatalogIcon} status={toStatusIconStatus(object.connectionState)} />
  </div>
</Tooltip>
