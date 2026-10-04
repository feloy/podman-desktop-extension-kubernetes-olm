<script lang="ts">
import { createRouteObject } from 'tinro/dist/tinro_lib';
import type { TinroRouteMeta } from 'tinro';
import type { RouterState } from '/@/models/router-state';
import type { WebviewApi } from '@podman-desktop/webview-api';
import { getContext, onMount } from 'svelte';

export let path = '/*';
export let fallback = false;
export let redirect: string | boolean = false;
export let firstmatch = false;

/** Once the app is mounted, the current URL is saved so the webview reopens on the same page. */
export let isAppMounted: boolean = false;

let showContent = false;
let params: Record<string, string> = {};
let meta: TinroRouteMeta = {} as TinroRouteMeta;

const webviewApi = getContext<WebviewApi>('WebviewApi');

const route = createRouteObject({
  fallback,
  onShow() {
    showContent = true;
  },
  onHide() {
    showContent = false;
  },
  onMeta(newMeta: Record<string, unknown>) {
    meta = newMeta as unknown as TinroRouteMeta;
    params = meta.params;

    if (isAppMounted) {
      saveRouterState({ url: meta.url }).catch(console.error);
    }
  },
});

$: route.update({ path, redirect, firstmatch });

onMount(() => route.destroy);

async function saveRouterState(state: RouterState): Promise<void> {
  await webviewApi.setState(state);
}
</script>

{#if showContent}
  <slot params={params} meta={meta} />
{/if}
