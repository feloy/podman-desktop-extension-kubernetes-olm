<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import type { PackageManifestUI } from '/@/component/package-manifests/PackageManifestUI';

const { object }: { object: PackageManifestUI } = $props();

// the number of channels available in addition to the default one
const others = $derived(object.channels.filter(channel => channel !== object.defaultChannel).length);

const tip = $derived(object.channels.length > 1 ? `Channels: ${object.channels.join(', ')}` : '');
</script>

<Tooltip tip={tip}>
  <span class="text-(--pd-table-body-text)">{object.defaultChannel}</span>
  {#if others > 0}
    <span class="text-(--pd-badge-gray)" aria-label="{others} more">+{others}</span>
  {/if}
</Tooltip>
