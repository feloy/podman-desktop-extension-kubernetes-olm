<script lang="ts">
import { getContext, onMount } from 'svelte';
import { router } from 'tinro';
import type { WebviewApi } from '@podman-desktop/webview-api';
import Route from '/@/Route.svelte';
import Navigation from '/@/Navigation.svelte';
import type { RouterState } from '/@/models/router-state';
import CatalogSourcesList from '/@/component/catalog-sources/CatalogSourcesList.svelte';
import PackageManifestsList from '/@/component/package-manifests/PackageManifestsList.svelte';
import PackageManifestDetails from '/@/component/package-manifests/PackageManifestDetails.svelte';

const DEFAULT_URL = '/catalogsources';

const webviewApi = getContext<WebviewApi>('WebviewApi');

let isMounted = $state(false);

function getRouterState(): RouterState {
  const state = webviewApi.getState() as RouterState | undefined;
  if (state?.url && state.url !== '/') {
    return state;
  }
  return { url: DEFAULT_URL };
}

onMount(() => {
  router.goto(getRouterState().url);
  isMounted = true;
});
</script>

<Route path="/*" isAppMounted={isMounted} let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-(--pd-content-bg) text-base">
    <div class="flex flex-row w-full h-full overflow-hidden">
      <Navigation meta={meta} />

      <div class="flex flex-col w-full h-full overflow-hidden">
        <Route path="/" redirect={DEFAULT_URL} />

        <Route path="/catalogsources">
          <CatalogSourcesList />
        </Route>

        <Route path="/packagemanifests">
          <PackageManifestsList />
        </Route>

        <Route path="/packagemanifests/:catalogSourceNamespace/:catalogSource/:name/*" let:meta>
          <PackageManifestDetails
            catalogSourceNamespace={decodeURIComponent(meta.params.catalogSourceNamespace)}
            catalogSource={decodeURIComponent(meta.params.catalogSource)}
            name={decodeURIComponent(meta.params.name)} />
        </Route>
      </div>
    </div>
  </main>
</Route>
