<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let { form } = $props();
</script>

<div class="p-4 lg:p-6 max-w-xl space-y-4">
	<h2 class="text-xl font-semibold">Create Website</h2>
	<p class="text-sm text-muted-foreground">Don't forget to verify it afterwards.</p>

	{#if form?.error}
		<p class="text-sm text-destructive">{form.error}</p>
	{/if}

	<form method="POST" class="space-y-3">
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="url" class="text-lg">URL</Label>
			<Input id="url" name="url" type="url" placeholder="https://my.website.com" value={form?.values?.url ?? ''} class="h-10" />
		</div>
		<div class="flex w-full max-w-sm flex-col gap-1.5">
			<Label for="description" class="text-lg">Description</Label>
			<Input id="description" name="description" placeholder="My favorite website" value={form?.values?.description ?? ''} class="h-10" />
		</div>
		<div class="flex items-center gap-3">
			<Button type="submit" size="lg">Create</Button>
			<Button href="/websites" size="lg" variant="outline">Cancel</Button>
		</div>
	</form>
</div>
