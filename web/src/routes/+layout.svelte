<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from "mode-watcher";
	import { Toaster } from "svelte-sonner";
	let { children } = $props();

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
		destroy() {
			if (node.parentNode) {
			node.parentNode.removeChild(node);
			}
		}
		};
	}
</script>

<ModeWatcher />

<div use:portal>
  <Toaster richColors position="top-right" />
</div>

{@render children()}
