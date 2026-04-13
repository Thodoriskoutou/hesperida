<script lang="ts">
	import { source } from "sveltekit-sse";
	import { onDestroy, onMount } from "svelte";
	import { goto } from '$app/navigation';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { QueueTaskRow, QueueTaskStreamEvent } from '$lib/queue-tasks';
	import { setFilterParam } from '$lib/filter';
  import { formatDate } from '$lib/utils.js';

	let { data, form } = $props();
	type QueueStatus = 'all' | 'pending' | 'waiting' | 'processing' | 'completed' | 'failed' | 'canceled';
	let statusFilter = $derived<QueueStatus>((data.initialFilter ?? 'all') as QueueStatus);
	let tasks = $state<QueueTaskRow[]>([]);
	let seededFromLoad = $state(false);

	$effect(() => {
		if (seededFromLoad) return;
		tasks = (data.tasks ?? []).map((task): QueueTaskRow => ({
			id: String(task.id ?? ''),
			job_id: String(task.job_id ?? ''),
			type: String(task.type ?? ''),
			website_url: String(task.website_url ?? '-'),
			target: String(task.target ?? '-'),
			status: task.status,
			created_at: String(task.created_at ?? '')
		}));
		seededFromLoad = true;
	});

	const sortByCreatedAt = (rows: QueueTaskRow[]): QueueTaskRow[] =>
		[...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	const upsertTask = (rows: QueueTaskRow[], task: QueueTaskRow): QueueTaskRow[] => {
		const idx = rows.findIndex((item) => item.id === task.id);
		if (idx === -1) return sortByCreatedAt([...rows, task]);
		const copy = [...rows];
		copy[idx] = task;
		return sortByCreatedAt(copy);
	};

	const removeTask = (rows: QueueTaskRow[], id: string): QueueTaskRow[] =>
		rows.filter((task) => task.id !== id);

	let connection: ReturnType<typeof source> | null = null;
	let unsubscribe: (() => void) | null = null;

	onMount(() => {
		connection = source("/streams/job-queue");
		const stream = connection.select("job_queue").json<QueueTaskStreamEvent>();
		unsubscribe = stream.subscribe((event) => {
			if (!event) return;
			if (event.type === "snapshot") {
				tasks = sortByCreatedAt(event.tasks);
				return;
			}
			if (event.type === "upsert") {
				tasks = upsertTask(tasks, event.task);
				return;
			}
			if (event.type === "remove") {
				tasks = removeTask(tasks, event.id);
			}
		});
	});

	onDestroy(() => {
		unsubscribe?.();
		connection?.close();
	});

	const filteredTasks = $derived.by(() => {
		if (statusFilter === 'all') return tasks;
		return tasks.filter((task: { status?: string }) => task.status === statusFilter);
	});

	const statusBadgeVariant = (status?: string) => {
		switch (status) {
			case 'completed':
				return 'secondary';
			case 'failed':
			case 'canceled':
				return 'destructive';
			case 'processing':
			case 'waiting':
				return 'default';
			case 'pending':
			default:
				return 'outline';
		}
	};

	const selectFilter = async (filter: QueueStatus) => {
		statusFilter = filter;
		const next = setFilterParam(new URL(window.location.href), filter, 'all');
		await goto(next, { replaceState: true, noScroll: true, keepFocus: true });
	};
</script>

<div class="p-4 lg:p-6 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold">Job Queue</h2>
	</div>

	{#if data.error}
		<p class="text-destructive text-sm">{data.error}</p>
	{/if}
	{#if form?.cancel_error}
		<p class="text-destructive text-sm">{form.cancel_error}</p>
	{/if}

	<Tabs.Root value={statusFilter}>
		<Tabs.List>
			<Tabs.Trigger value="all" onclick={() => void selectFilter('all')}>All</Tabs.Trigger>
			<Tabs.Trigger value="pending" onclick={() => void selectFilter('pending')}>Pending</Tabs.Trigger>
			<Tabs.Trigger value="waiting" onclick={() => void selectFilter('waiting')}>Waiting</Tabs.Trigger>
			<Tabs.Trigger value="processing" onclick={() => void selectFilter('processing')}>Processing</Tabs.Trigger>
			<Tabs.Trigger value="completed" onclick={() => void selectFilter('completed')}>Completed</Tabs.Trigger>
			<Tabs.Trigger value="failed" onclick={() => void selectFilter('failed')}>Failed</Tabs.Trigger>
			<Tabs.Trigger value="canceled" onclick={() => void selectFilter('canceled')}>Canceled</Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>

	<div class="overflow-auto rounded-md border">
		<table class="w-full text-sm">
			<thead class="bg-muted/50">
				<tr>
					<th class="text-left p-3">Website URL</th>
					<th class="text-left p-3">Type</th>
					<th class="text-left p-3">Target</th>
					<th class="text-left p-3">Status</th>
					<th class="text-left p-3">Created</th>
					<th class="text-left p-3">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if filteredTasks.length === 0}
					<tr><td colspan="6" class="p-3 text-muted-foreground">No queue tasks found.</td></tr>
				{:else}
					{#each filteredTasks as task (task.id)}
						<tr class="border-t">
							<td class="p-3">{task.website_url ?? '-'}</td>
							<td class="p-3">
								<Badge variant="outline">{task.type ?? '-'}</Badge>
							</td>
							<td class="p-3">{task.target ?? '-'}</td>
							<td class="p-3">
								<Badge variant={statusBadgeVariant(task.status)}>{task.status ?? '-'}</Badge>
							</td>
							<td class="p-3">{formatDate(task.created_at, true)}</td>
							<td class="p-3">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" {...props}>
												<EllipsisVerticalIcon class="size-4" />
												<span class="sr-only">Actions</span>
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-36">
										<DropdownMenu.Item>
											{#snippet child({ props })}
												<a href={`/job-queue/${task.id}`} {...props}>View</a>
											{/snippet}
										</DropdownMenu.Item>
										{#if task.job_id}
											<DropdownMenu.Item>
												{#snippet child({ props })}
													<a href={`/jobs/${task.job_id}`} {...props}>View Job</a>
												{/snippet}
											</DropdownMenu.Item>
										{/if}
										{#if task.status === 'waiting'}
											<DropdownMenu.Separator />
											<DropdownMenu.Item variant="destructive">
												<form method="POST" action="?/cancel" class="w-full">
													<input type="hidden" name="id" value={task.id} />
													<button type="submit" class="w-full text-left">Cancel</button>
												</form>
											</DropdownMenu.Item>
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
