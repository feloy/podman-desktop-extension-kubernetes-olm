<script lang="ts">
import { DetailsPage, Dropdown, Spinner, Tab } from '@podman-desktop/ui-svelte';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { Fa } from 'svelte-fa';
import { getContext, onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/store';
import { router } from 'tinro';
import { isSamePackageManifest, type PackageManifestKey } from '@kubernetes-olm/channels';
import { States } from '/@/state/states';
import Route from '/@/Route.svelte';
import { PACKAGE_MANIFESTS_URL, packageManifestDetailsUrl, type PackageManifestTab } from './package-manifest-url';
import PackageManifestDetailsSummary from './PackageManifestDetailsSummary.svelte';
import PackageManifestDetailsDescription from './PackageManifestDetailsDescription.svelte';
import PackageManifestDetailsApis from './PackageManifestDetailsApis.svelte';
import PackageManifestDetailsVersions from './PackageManifestDetailsVersions.svelte';

interface Props {
  catalogSourceNamespace: string;
  catalogSource: string;
  name: string;
}

const { catalogSourceNamespace, catalogSource, name }: Props = $props();

const key: PackageManifestKey = $derived({ catalogSourceNamespace, catalogSource, name });

const states = getContext<States>(States);
const details = $derived(
  states.statePackageManifestDetailsData.data?.details.find(details =>
    isSamePackageManifest(key, {
      catalogSourceNamespace: details.catalogSourceNamespace ?? '',
      catalogSource: details.catalogSource ?? '',
      name: details.name,
    }),
  ),
);

// the channel whose information is displayed, the default channel when none has been selected
let selectedChannelName = $state<string | undefined>(undefined);
const channel = $derived(
  details?.channelsDetails.find(channel => channel.name === (selectedChannelName ?? details?.defaultChannel)) ??
    details?.channelsDetails[0],
);
const channelOptions = $derived(
  (details?.channelsDetails ?? []).map(channel => ({
    value: channel.name,
    label: channel.name === details?.defaultChannel ? `${channel.name} (default)` : channel.name,
  })),
);

// the options take the width of the dropdown, which takes the width of its container:
// the container is sized for the longest channel name, plus the check and caret icons and the padding
const channelSelectorWidth = $derived(
  `calc(${Math.max(...channelOptions.map(option => option.label.length), 0)}ch + 3rem)`,
);

let subscribers: Unsubscriber[] = [];

onMount(() => {
  subscribers.push(states.statePackageManifestDetailsData.subscribe(key));
});

onDestroy(() => {
  for (const subscriber of subscribers) {
    subscriber();
  }
  subscribers = [];
});

const tabs: { tab: PackageManifestTab; title: string }[] = [
  { tab: 'description', title: 'Description' },
  { tab: 'apis', title: 'Provided APIs' },
  { tab: 'versions', title: 'Versions' },
  { tab: 'summary', title: 'Summary' },
];

function navigateToList(): void {
  router.goto(PACKAGE_MANIFESTS_URL);
}
</script>

<DetailsPage
  title={channel?.displayName ?? details?.displayName ?? name}
  titleDetail={channel?.version}
  subtitle={channel?.shortDescription ??
    (details ? `${details.catalogSourceDisplayName ?? catalogSource} · ${details.provider ?? ''}` : '')}
  breadcrumbLeftPart="Package Manifests"
  breadcrumbRightPart="Details"
  onbreadcrumbClick={navigateToList}
  onclose={navigateToList}>
  {#snippet iconSnippet()}
    <div class="text-(--pd-content-header-icon)"><Fa icon={faBoxOpen} size="2x" /></div>
  {/snippet}
  {#snippet actionsSnippet()}
    {#if channel && channelOptions.length > 1}
      <div class="flex items-center gap-2 text-(--pd-content-text)">
        <span>Channel</span>
        <div style:width={channelSelectorWidth}>
          <Dropdown
            ariaLabel="Channel"
            value={channel.name}
            options={channelOptions}
            onChange={(value: string): string => (selectedChannelName = value)} />
        </div>
      </div>
    {/if}
  {/snippet}
  {#snippet tabsSnippet()}
    {#each tabs as { tab, title } (tab)}
      <Tab
        title={title}
        selected={$router.path === packageManifestDetailsUrl(key, tab)}
        url={packageManifestDetailsUrl(key, tab)} />
    {/each}
  {/snippet}
  {#snippet contentSnippet()}
    {#if details && channel}
      <Route path="/summary">
        <PackageManifestDetailsSummary details={details} channel={channel} />
      </Route>
      <Route path="/versions">
        <PackageManifestDetailsVersions channel={channel} />
      </Route>
      <Route path="/description">
        <PackageManifestDetailsDescription channel={channel} />
      </Route>
      <Route path="/apis">
        <PackageManifestDetailsApis channel={channel} />
      </Route>
    {:else}
      <div class="flex w-full h-full justify-center items-center text-(--pd-content-text)">
        <Spinner label="Loading the details of the package" />
      </div>
    {/if}
  {/snippet}
</DetailsPage>
