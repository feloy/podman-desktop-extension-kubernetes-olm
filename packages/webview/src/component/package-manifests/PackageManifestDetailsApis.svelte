<script lang="ts">
import { Checkbox, EmptyScreen, Expandable } from '@podman-desktop/ui-svelte';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
import type { PackageManifestChannelDetails, ProvidedApiInfo } from '@kubernetes-olm/channels';
import Markdown from '/@/markdown/Markdown.svelte';

interface Props {
  channel: PackageManifestChannelDetails;
}

const { channel }: Props = $props();

// the internal APIs are not meant to be used directly: they are hidden unless requested
let showInternal = $state(false);

const internalCount = $derived(channel.providedApis.filter(api => api.internal).length);
const apis = $derived(
  channel.providedApis.filter(api => showInternal || !api.internal).sort((a, b) => a.kind.localeCompare(b.kind)),
);

// a kind provided in several versions is followed by the version, to distinguish its sections
function title(api: ProvidedApiInfo): string {
  return channel.providedApis.filter(other => other.kind === api.kind).length > 1
    ? `${api.kind} (${api.version})`
    : api.kind;
}
</script>

{#if channel.providedApis.length > 0}
  <div class="flex flex-col gap-4 px-5 py-4 h-full overflow-auto text-(--pd-table-body-text)">
    {#if internalCount > 0}
      <div class="flex justify-end">
        <Checkbox checked={showInternal} onclick={(checked: boolean): boolean => (showInternal = checked)}>
          Show internal APIs ({internalCount})
        </Checkbox>
      </div>
    {/if}
    {#each apis as api (`${api.type}/${api.name}/${api.version}`)}
      <section aria-label={title(api)}>
        <h2 class="text-lg font-semibold text-(--pd-table-body-text-sub-secondary)">
          {title(api)}
          {#if api.type === 'APIService'}
            <!-- served by an aggregated API server deployed by the operator, rather than defined by a CRD -->
            <span class="text-sm font-normal text-(--pd-badge-gray)">API service</span>
          {/if}
          {#if api.internal}
            <span class="text-sm font-normal text-(--pd-badge-gray)">internal</span>
          {/if}
        </h2>
        {#if api.description}
          <!-- some descriptions contain several lines and markdown (lists, code) -->
          <Markdown markdown={api.description} />
        {:else}
          <p class="text-(--pd-badge-gray)">No description provided.</p>
        {/if}
        {#each api.examples as example, index (index)}
          <div class="pt-2">
            <!-- collapsed by default: an example can be long -->
            <Expandable expanded={false}>
              {#snippet title()}<span class="font-semibold">Example{example.name ? `: ${example.name}` : ''}</span
                >{/snippet}
              {#if example.description}
                <p class="pb-1">{example.description}</p>
              {/if}
              <pre
                class="p-2 rounded-md overflow-auto text-sm font-mono bg-(--pd-content-card-bg) border border-(--pd-content-card-border)"
                aria-label="Example {example.name ?? ''}">{example.yaml}</pre>
            </Expandable>
          </div>
        {/each}
      </section>
    {/each}
  </div>
{:else}
  <EmptyScreen icon={faPlug} title="No provided APIs" message="This operator does not provide any API." />
{/if}
