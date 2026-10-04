<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import { displayedCatalogName, type PackageManifestUI } from '/@/component/package-manifests/PackageManifestUI';

const { object }: { object: PackageManifestUI } = $props();

const tip = $derived(object.catalogName ? `${object.catalogNamespace}/${object.catalogName}` : '');
</script>

<Tooltip tip={tip}>
  <span class="text-(--pd-table-body-text)">{displayedCatalogName(object)}</span>
</Tooltip>
