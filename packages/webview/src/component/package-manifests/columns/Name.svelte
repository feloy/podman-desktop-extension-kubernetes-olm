<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import { router } from 'tinro';
import { displayedName, type PackageManifestUI } from '/@/component/package-manifests/PackageManifestUI';
import { packageManifestDetailsUrl } from '/@/component/package-manifests/package-manifest-url';

const { object }: { object: PackageManifestUI } = $props();

const name = $derived(displayedName(object));

function openDetails(): void {
  router.goto(
    packageManifestDetailsUrl({
      catalogSourceNamespace: object.catalogNamespace,
      catalogSource: object.catalogName,
      name: object.name,
    }),
  );
}
</script>

<!-- the package name, used to install the operator, is displayed as tooltip when it differs from the display name -->
<div class="flex flex-col max-w-full">
  <Tooltip tip={name === object.name ? '' : object.name}>
    <button
      class="text-(--pd-table-body-text-highlight) hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
      onclick={openDetails}
      title="View details of {name}">
      {name}
    </button>
  </Tooltip>
  {#if object.shortDescription}
    <div class="text-sm text-(--pd-badge-gray) line-clamp-1" title={object.shortDescription}>
      {object.shortDescription}
    </div>
  {/if}
</div>
