<script lang="ts">
import type { TinroRouteMeta } from 'tinro';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { setContext } from 'svelte';
import NavItem from '/@/navigation/NavItem.svelte';
import kubernetesIcon from '/@/kubernetes-icon.png';

interface Props {
  meta: TinroRouteMeta;
}

const { meta }: Props = $props();

const url = $derived(meta.url);

setContext('nav-url', () => url);

const STORAGE_KEY = 'nav-sections-expanded';

function loadExpanded(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveExpanded(key: string, value: boolean): void {
  try {
    const current = loadExpanded();
    current[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // the expanded state is a convenience only
  }
}

function isUnderSection(sectionUrls: string[]): boolean {
  return sectionUrls.some(u => url === u || url.startsWith(u + '/'));
}

const catalogsUrls = ['/catalogsources'];

let catalogsExpanded = $state(loadExpanded()['catalogs'] ?? true);

$effect(() => {
  if (isUnderSection(catalogsUrls)) catalogsExpanded = true;
});

$effect(() => {
  saveExpanded('catalogs', catalogsExpanded);
});
</script>

<nav
  class="z-1 w-leftsidebar min-w-leftsidebar shadow-xs flex-col justify-between flex transition-all duration-500 ease-in-out bg-(--pd-secondary-nav-bg) border-(--pd-global-nav-bg-border) border-r-[1px]"
  aria-label="OLM resources">
  <div class="flex items-center">
    <div class="pt-4 px-3 mb-5 flex items-center gap-3">
      <img src={kubernetesIcon} alt="Kubernetes OLM" class="w-7 h-7" />
      <p class="text-xl font-semibold text-(--pd-secondary-nav-header-text) pl-1">Operators</p>
    </div>
  </div>
  <div
    class="h-full overflow-hidden hover:overflow-y-auto [&_svg]:w-[1.25em] [&_div.pl-\[34px\]]:!pl-[36px]"
    style="margin-bottom:auto">
    <!-- Catalogs section -->
    <NavItem title="Catalogs" icon={faBook} section={true} bind:expanded={catalogsExpanded} href="" />
    {#if catalogsExpanded}
      <NavItem title="Catalog Sources" child={true} href="/catalogsources" />
    {/if}
  </div>
</nav>
