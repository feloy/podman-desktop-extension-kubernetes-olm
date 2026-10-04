<script lang="ts">
/* global Promise */

import {
  Table,
  TableColumn,
  TableDurationColumn,
  TableRow,
  TableSimpleColumn,
  NavPage,
  FilteredEmptyScreen,
} from '@podman-desktop/ui-svelte';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { getContext, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { States } from '/@/state/states';
import { displayedName, sourceTypeDisplay, updatesDisplay, type CatalogSourceUI } from './CatalogSourceUI';
import NameColumn from './columns/Name.svelte';
import ConnectionStateColumn from './columns/ConnectionState.svelte';
import UpdatesColumn from './columns/Updates.svelte';
import SourceTypeColumn from './columns/SourceType.svelte';

const states = getContext<States>(States);
const catalogSourcesState = $derived(states.stateCatalogSourcesData.data);

let searchTerm = $state<string>('');

let subscribers: Unsubscriber[] = [];

onMount(() => {
  subscribers.push(states.stateCatalogSourcesData.subscribe());
});

onDestroy(() => {
  for (const subscriber of subscribers) {
    subscriber();
  }
  subscribers = [];
});

const catalogSources: CatalogSourceUI[] = $derived(
  (catalogSourcesState?.catalogSources ?? [])
    .map(catalogSource => ({
      name: catalogSource.name,
      namespace: catalogSource.namespace,
      displayName: catalogSource.displayName ?? '',
      publisher: catalogSource.publisher ?? '',
      sourceType: catalogSource.sourceType ?? '',
      image: catalogSource.image ?? '',
      address: catalogSource.address ?? '',
      connectionState: catalogSource.connectionState ?? '',
      created: catalogSource.creationTimestamp ? new Date(catalogSource.creationTimestamp) : undefined,
      pollInterval: catalogSource.pollInterval ?? '',
      latestPoll: catalogSource.latestPoll ? new Date(catalogSource.latestPoll) : undefined,
    }))
    .filter(catalogSource => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return [catalogSource.name, catalogSource.namespace, catalogSource.displayName, catalogSource.publisher].some(
        value => value.toLowerCase().includes(term),
      );
    }),
);

const statusColumn = new TableColumn<CatalogSourceUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: ConnectionStateColumn,
  comparator: (a, b): number => a.connectionState.localeCompare(b.connectionState),
});

const nameColumn = new TableColumn<CatalogSourceUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => displayedName(a).localeCompare(displayedName(b)),
});

const publisherColumn = new TableColumn<CatalogSourceUI, string>('Publisher', {
  renderMapping: (obj): string => obj.publisher,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.publisher.localeCompare(b.publisher),
});

const sourceTypeColumn = new TableColumn<CatalogSourceUI>('Type', {
  width: '90px',
  renderer: SourceTypeColumn,
  comparator: (a, b): number => sourceTypeDisplay(a).label.localeCompare(sourceTypeDisplay(b).label),
});

const updatesColumn = new TableColumn<CatalogSourceUI>('Updates', {
  width: '110px',
  renderer: UpdatesColumn,
  comparator: (a, b): number => updatesDisplay(a).label.localeCompare(updatesDisplay(b).label),
});

const ageColumn = new TableColumn<CatalogSourceUI, Date | undefined>('Age', {
  width: '90px',
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => (b.created?.getTime() ?? 0) - (a.created?.getTime() ?? 0),
});

const columns = [statusColumn, nameColumn, publisherColumn, sourceTypeColumn, updatesColumn, ageColumn];
// no `selectable`: the Table displays the checkboxes column as soon as it is defined
const row = new TableRow<CatalogSourceUI>({});

// Match the Dashboard resource lists: informer updates briefly report no items while a
// context is changing, so wait before presenting an empty state to avoid a distracting flash.
function waitThrottleDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 500));
}
</script>

<NavPage bind:searchTerm={searchTerm} title="Catalog Sources">
  {#snippet content()}
    <div class="flex min-w-full h-full">
      <Table
        kind="catalog source"
        data={catalogSources}
        columns={columns}
        row={row}
        defaultSortColumn="Name"
        key={(obj: CatalogSourceUI): string => `${obj.namespace}/${obj.name}`}></Table>

      {#if catalogSources.length === 0}
        {#if searchTerm}
          <FilteredEmptyScreen
            icon={faBook}
            kind="catalog sources"
            searchTerm={searchTerm}
            on:resetFilter={(): string => (searchTerm = '')} />
        {:else}
          {#await waitThrottleDelay() then _}
            <p class="px-5 py-4 text-sm text-(--pd-content-text)">No catalog sources found.</p>
          {/await}
        {/if}
      {/if}
    </div>
  {/snippet}
</NavPage>
