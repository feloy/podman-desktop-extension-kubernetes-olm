<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import { displayedName, type PackageManifestUI } from '/@/component/package-manifests/PackageManifestUI';

const { object }: { object: PackageManifestUI } = $props();

const name = $derived(displayedName(object));
</script>

<!-- the package name, used to install the operator, is displayed as tooltip when it differs from the display name -->
<Tooltip tip={name === object.name ? '' : object.name}>
  <span class="text-(--pd-table-body-text-highlight)">{name}</span>
</Tooltip>
