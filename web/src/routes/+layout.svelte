<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "svelte-sonner";
	let { children } = $props();
</script>

<ModeWatcher />
<Toaster richColors position="top-right" />
{@render children()}
