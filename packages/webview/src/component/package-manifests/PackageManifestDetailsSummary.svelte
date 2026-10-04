<script lang="ts">
import Table from '/@/component/details/Table.svelte';
import Title from '/@/component/details/Title.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';
import Cell from '/@/component/details/Cell.svelte';
import ExternalLink from '/@/component/link/ExternalLink.svelte';
import { Table as ListTable, TableColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import type { PackageManifestChannelDetails, PackageManifestDetails } from '@kubernetes-olm/channels';

interface Props {
  details: PackageManifestDetails;
  // the channel whose operator information is displayed
  channel: PackageManifestChannelDetails;
}

const { details, channel }: Props = $props();

const packageFields: [string, string | undefined][] = $derived([
  ['Package name', details.name],
  ['Catalog', `${details.catalogSourceDisplayName ?? ''} (${details.catalogSourceNamespace}/${details.catalogSource})`],
  ['Provider', details.provider],
  ['Default channel', details.defaultChannel],
]);

const operatorFields: [string, string | undefined][] = $derived([
  ['Channel', channel.name],
  ['Version', channel.version],
  ['Capabilities', channel.capabilities],
  ['Maturity', channel.maturity],
  ['Categories', channel.categories],
  ['Keywords', channel.keywords.join(', ')],
  ['Install modes', channel.installModes.join(', ')],
  ['Suggested namespace', channel.suggestedNamespace],
  ['Kubernetes versions', kubernetesVersions(channel)],
  ['Certified', channel.certified === undefined ? undefined : channel.certified ? 'Yes' : 'No'],
  ['Features', channel.features.join(', ')],
  ['Required subscriptions', channel.validSubscriptions.join(', ')],
  [
    'Initialization resource',
    channel.initializationResource
      ? `${channel.initializationResource.kind} ${channel.initializationResource.name ?? ''} (${channel.initializationResource.apiVersion})`
      : undefined,
  ],
  ['Container image', channel.containerImage],
  ['Created', channel.createdAt ? new Date(channel.createdAt).toLocaleString() : undefined],
  ['Support', channel.support],
]);

const channelColumns = [
  new TableColumn<PackageManifestChannelDetails, string>('Channel', {
    renderMapping: (c): string => (c.name === details.defaultChannel ? `${c.name} (default)` : c.name),
    renderer: TableSimpleColumn,
    comparator: (a, b): number => a.name.localeCompare(b.name),
  }),
  new TableColumn<PackageManifestChannelDetails, string>('Version', {
    renderMapping: (c): string => c.version ?? '',
    renderer: TableSimpleColumn,
  }),
  new TableColumn<PackageManifestChannelDetails, string>('Versions', {
    width: '90px',
    renderMapping: (c): string => String(c.versions.length),
    renderer: TableSimpleColumn,
    comparator: (a, b): number => a.versions.length - b.versions.length,
  }),
  new TableColumn<PackageManifestChannelDetails, string>('Current CSV', {
    width: '2fr',
    renderMapping: (c): string => c.currentCSV ?? '',
    renderer: TableSimpleColumn,
  }),
];
const channelRow = new TableRow<PackageManifestChannelDetails>({});

// the range of Kubernetes versions supported by the operator, when known
function kubernetesVersions(c: PackageManifestChannelDetails): string | undefined {
  if (c.minKubeVersion && c.maxKubeVersion) {
    return `${c.minKubeVersion} to ${c.maxKubeVersion}`;
  }
  if (c.minKubeVersion) {
    return `${c.minKubeVersion} or later`;
  }
  if (c.maxKubeVersion) {
    return `up to ${c.maxKubeVersion}`;
  }
  return undefined;
}

// only the links using http(s) are displayed as links
function isWebUrl(url: string | undefined): boolean {
  return !!url && /^https?:\/\//i.test(url);
}
</script>

<!-- the content of the details page does not scroll: the tab scrolls its content -->
<div class="flex flex-col w-full h-full overflow-auto">
  <Table>
    <tr>
      <Title>Package</Title>
    </tr>
    {#each packageFields as [label, value] (label)}
      {#if value}
        <tr>
          <Subtitle>{label}</Subtitle>
          <Cell>{value}</Cell>
        </tr>
      {/if}
    {/each}

    <tr>
      <Title>Operator</Title>
    </tr>
    {#each operatorFields as [label, value] (label)}
      {#if value}
        <tr>
          <Subtitle>{label}</Subtitle>
          <Cell>{value}</Cell>
        </tr>
      {/if}
    {/each}
    {#if isWebUrl(channel.repository)}
      <tr>
        <Subtitle>Repository</Subtitle>
        <Cell><ExternalLink url={channel.repository ?? ''}>{channel.repository}</ExternalLink></Cell>
      </tr>
    {/if}

    {#if channel.links.some(link => isWebUrl(link.url))}
      <tr>
        <Title>Links</Title>
      </tr>
      {#each channel.links.filter(link => isWebUrl(link.url)) as link (link.url)}
        <tr>
          <Subtitle>{link.name || link.url}</Subtitle>
          <Cell><ExternalLink url={link.url}>{link.url}</ExternalLink></Cell>
        </tr>
      {/each}
    {/if}

    {#if channel.maintainers.length > 0}
      <tr>
        <Title>Maintainers</Title>
      </tr>
      {#each channel.maintainers as maintainer, index (index)}
        <tr>
          <Subtitle>{maintainer.name ?? ''}</Subtitle>
          <Cell>{maintainer.email ?? ''}</Cell>
        </tr>
      {/each}
    {/if}
  </Table>

  <div class="px-5 pb-4">
    <h2 class="pb-2 text-lg font-semibold text-(--pd-table-body-text-sub-secondary)">Channels</h2>
    <ListTable
      kind="channel"
      data={details.channelsDetails}
      columns={channelColumns}
      row={channelRow}
      defaultSortColumn="Channel"
      key={(c: PackageManifestChannelDetails): string => c.name} />
  </div>
</div>
