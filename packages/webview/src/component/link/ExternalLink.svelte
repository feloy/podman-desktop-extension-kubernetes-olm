<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';
import { getContext, type Snippet } from 'svelte';
import { API_SYSTEM } from '@kubernetes-olm/channels';
import { Remote } from '/@/remote/remote';

// a link opening a web page in the external browser
interface Props {
  url: string;
  children: Snippet;
}

const { url, children }: Props = $props();

const systemApi = getContext<Remote>(Remote).getProxy(API_SYSTEM);

function open(): void {
  systemApi.openExternal(url).catch(console.error);
}
</script>

<Link aria-label={url} onclick={open}>{@render children()}</Link>
