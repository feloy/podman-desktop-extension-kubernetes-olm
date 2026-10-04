<script lang="ts">
import { micromark } from 'micromark';
import { getContext } from 'svelte';
import { API_SYSTEM } from '@kubernetes-olm/channels';
import { Remote } from '/@/remote/remote';

interface Props {
  markdown: string;
}

const { markdown }: Props = $props();

// micromark does not render raw HTML and does not keep dangerous protocols (e.g. javascript:) in links,
// so that the markdown provided by the catalogs can be displayed safely
const html = $derived(micromark(markdown));

const systemApi = getContext<Remote>(Remote).getProxy(API_SYSTEM);

// a link would navigate the webview itself: the web pages are opened in the external browser instead
function onclick(event: MouseEvent): void {
  const link = (event.target as HTMLElement | null)?.closest('a');
  if (!link) {
    return;
  }
  event.preventDefault();
  const href = link.getAttribute('href');
  if (href) {
    systemApi.openExternal(href).catch(console.error);
  }
}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<section class="prose max-w-none" aria-label="markdown-content" onclick={onclick}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</section>
