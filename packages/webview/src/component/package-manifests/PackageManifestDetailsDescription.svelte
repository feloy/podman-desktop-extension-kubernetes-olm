<script lang="ts">
import type { PackageManifestChannelDetails } from '@kubernetes-olm/channels';
import { EmptyScreen } from '@podman-desktop/ui-svelte';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import Markdown from '/@/markdown/Markdown.svelte';

interface Props {
  channel: PackageManifestChannelDetails;
}

const { channel }: Props = $props();
</script>

{#if channel.description}
  <div class="px-5 py-4 h-full overflow-auto">
    <Markdown markdown={channel.description} />
  </div>
{:else}
  <EmptyScreen icon={faFileLines} title="No description" message="The operator does not provide a description." />
{/if}
