<script lang="ts">
import { EmptyScreen, Table, TableColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import type { PackageManifestChannelDetails, PackageManifestVersionInfo } from '@kubernetes-olm/channels';

interface Props {
  channel: PackageManifestChannelDetails;
}

const { channel }: Props = $props();

const columns = [
  new TableColumn<PackageManifestVersionInfo, string>('Version', {
    renderMapping: (version): string =>
      version.name === channel.currentCSV ? `${version.version ?? ''} (current)` : (version.version ?? ''),
    renderer: TableSimpleColumn,
    comparator: (a, b): number => (a.version ?? '').localeCompare(b.version ?? '', undefined, { numeric: true }),
    initialOrder: 'descending',
  }),
  new TableColumn<PackageManifestVersionInfo, string>('CSV', {
    width: '2fr',
    renderMapping: (version): string => version.name,
    renderer: TableSimpleColumn,
  }),
];
const row = new TableRow<PackageManifestVersionInfo>({});
</script>

{#if channel.versions.length > 0}
  <!-- the content of the details page does not scroll: the tab scrolls its content -->
  <div class="flex flex-col w-full h-full overflow-auto">
    {#if channel.skipRange}
      <p class="px-5 pt-4 text-sm text-(--pd-content-text)">
        The current version can be upgraded to directly from the versions <code>{channel.skipRange}</code>.
      </p>
    {/if}
    <div class="flex min-w-full">
      <Table
        kind="version"
        data={channel.versions}
        columns={columns}
        row={row}
        defaultSortColumn="Version"
        key={(version: PackageManifestVersionInfo): string => version.name} />
    </div>
  </div>
{:else}
  <EmptyScreen
    icon={faCodeBranch}
    title="No versions"
    message="The channel {channel.name} does not list any version." />
{/if}
