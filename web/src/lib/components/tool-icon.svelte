<script lang="ts">
	import AccessibilityIcon from '@lucide/svelte/icons/accessibility';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import GaugeIcon from '@lucide/svelte/icons/gauge';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import type { Tool } from '$lib/types';

	let { tool, className = 'size-4' }: { tool: Tool; className?: string } = $props();
</script>

{#if tool === 'probe' || tool === 'domain'}
	<GlobeIcon class={className} />
{:else if tool === 'seo' || tool === 'whois'}
	<SearchIcon class={className} />
{:else if tool === 'wcag'}
	<AccessibilityIcon class={className} />
{:else if tool === 'security' || tool === 'ssl'}
	<ShieldIcon class={className} />
{:else if tool === 'stress'}
	<GaugeIcon class={className} />
{:else}
	<FileTextIcon class={className} />
{/if}
