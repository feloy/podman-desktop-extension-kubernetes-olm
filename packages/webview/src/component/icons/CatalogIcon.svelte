<script lang="ts">
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { Fa } from 'svelte-fa';

// A component icon accepting a numeric size, as StatusIcon passes one:
// the Icon component of ui-svelte does not display FontAwesome icons with a numeric size
interface Props {
  size?: number | string;
  class?: string;
}

const { size = 20, class: className = '' }: Props = $props();

const fontSize = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<span class="inline-flex items-center justify-center {className}" style:font-size={fontSize}>
  <Fa icon={faBook} />
</span>
