<script lang="ts">
/* global Promise */

import {
  Table,
  TableColumn,
  TableRow,
  TableSimpleColumn,
  NavPage,
  FilteredEmptyScreen,
} from '@podman-desktop/ui-svelte';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { getContext, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { States } from '/@/state/states';
import { displayedCatalogName, displayedName, type PackageManifestUI } from './PackageManifestUI';
import NameColumn from './columns/Name.svelte';
import CatalogColumn from './columns/Catalog.svelte';
import DefaultChannelColumn from './columns/DefaultChannel.svelte';

const states = getContext<States>(States);
const packageManifestsState = $derived(states.statePackageManifestsData.data);

let searchTerm = $state<string>('');

let subscribers: Unsubscriber[] = [];

// The package manifests cannot be watched: they are listed when this page subscribes to them,
// and listed again when the page is displayed again some time after being left
onMount(() => {
  subscribers.push(states.statePackageManifestsData.subscribe());
});

onDestroy(() => {
  for (const subscriber of subscribers) {
    subscriber();
  }
  subscribers = [];
});

const packageManifests: PackageManifestUI[] = $derived(
  (packageManifestsState?.packageManifests ?? [])
    .map(packageManifest => ({
      name: packageManifest.name,
      namespace: packageManifest.namespace,
      displayName: packageManifest.displayName ?? '',
      shortDescription: packageManifest.shortDescription ?? '',
      provider: packageManifest.provider ?? '',
      catalogName: packageManifest.catalogSource ?? '',
      catalogNamespace: packageManifest.catalogSourceNamespace ?? '',
      catalogDisplayName: packageManifest.catalogSourceDisplayName ?? '',
      defaultChannel: packageManifest.defaultChannel ?? '',
      version: packageManifest.version ?? '',
      channels: packageManifest.channels,
    }))
    .filter(packageManifest => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return [
        packageManifest.name,
        packageManifest.displayName,
        packageManifest.shortDescription,
        packageManifest.provider,
        displayedCatalogName(packageManifest),
      ].some(value => value.toLowerCase().includes(term));
    }),
);

const nameColumn = new TableColumn<PackageManifestUI>('Name', {
  width: '2fr',
  renderer: NameColumn,
  comparator: (a, b): number => displayedName(a).localeCompare(displayedName(b)),
});

const providerColumn = new TableColumn<PackageManifestUI, string>('Provider', {
  width: '1.2fr',
  renderMapping: (obj): string => obj.provider,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.provider.localeCompare(b.provider),
});

const catalogColumn = new TableColumn<PackageManifestUI>('Catalog', {
  width: '1.2fr',
  renderer: CatalogColumn,
  comparator: (a, b): number => displayedCatalogName(a).localeCompare(displayedCatalogName(b)),
});

const defaultChannelColumn = new TableColumn<PackageManifestUI>('Default channel', {
  width: '120px',
  renderer: DefaultChannelColumn,
  comparator: (a, b): number => a.defaultChannel.localeCompare(b.defaultChannel),
});

const versionColumn = new TableColumn<PackageManifestUI, string>('Version', {
  width: '100px',
  renderMapping: (obj): string => obj.version,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.version.localeCompare(b.version, undefined, { numeric: true }),
});

const columns = [nameColumn, providerColumn, catalogColumn, defaultChannelColumn, versionColumn];
// no `selectable`: the Table displays the checkboxes column as soon as it is defined
const row = new TableRow<PackageManifestUI>({});

// Match the Dashboard resource lists: informer updates briefly report no items while a
// context is changing, so wait before presenting an empty state to avoid a distracting flash.
function waitThrottleDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 500));
}
</script>

<NavPage bind:searchTerm={searchTerm} title="Package Manifests">
  {#snippet content()}
    <div class="flex min-w-full h-full">
      <Table
        kind="package manifest"
        data={packageManifests}
        columns={columns}
        row={row}
        defaultSortColumn="Name"
        key={(obj: PackageManifestUI): string => `${obj.catalogNamespace}/${obj.catalogName}/${obj.name}`}></Table>

      {#if packageManifests.length === 0}
        {#if searchTerm}
          <FilteredEmptyScreen
            icon={faBoxOpen}
            kind="package manifests"
            searchTerm={searchTerm}
            on:resetFilter={(): string => (searchTerm = '')} />
        {:else}
          {#await waitThrottleDelay() then _}
            <p class="px-5 py-4 text-sm text-(--pd-content-text)">No package manifests found.</p>
          {/await}
        {/if}
      {/if}
    </div>
  {/snippet}
</NavPage>
