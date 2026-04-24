import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { mapQueueTaskToView, toRouteIdString } from '$lib/server/dashboard-mappers';
import { parseAllowedFilter } from '$lib/server/filter';
import { queueTaskStatuses, type QueueTaskStatus } from '$lib/queue-tasks';
import type { ApiJob, ApiQueueTask, ApiWebsite } from '$lib/types/api';
import type { Tool } from '$lib/types';

type QueueTaskView = ReturnType<typeof mapQueueTaskToView>;
type TimestampedResult = {
	created_at?: string | null;
	device?: string | null;
};

const latestResultCreatedAt = (results: TimestampedResult[]): string | null => {
	let latest: TimestampedResult | null = null;
	for (const result of results) {
		if (!result?.created_at) continue;
		if (!latest?.created_at || new Date(result.created_at).getTime() > new Date(latest.created_at).getTime()) {
			latest = result;
		}
	}
	return latest?.created_at ?? null;
};

const selectResultCreatedAt = (result: unknown, type: Tool, target: unknown): string | null => {
	if (!result) return null;
	if (Array.isArray(result)) {
		const results = result.filter((entry): entry is TimestampedResult => !!entry && typeof entry === 'object');
		if (type === 'wcag') {
			const normalizedTarget = String(target ?? '').trim().toLowerCase();
			const selected =
				results.find((entry) => String(entry.device ?? '').trim().toLowerCase() === normalizedTarget) ??
				results[0];
			return selected?.created_at ?? null;
		}
		return latestResultCreatedAt(results);
	}
	if (typeof result === 'object') return (result as TimestampedResult).created_at ?? null;
	return null;
};

const resolveTaskResultCreatedAt = async (
	event: Parameters<PageServerLoad>[0],
	task: ApiQueueTask,
	jobRouteId: string
): Promise<string | null> => {
	if (!jobRouteId || !task.type) return null;
	try {
		const resultData = await callDashboardApi<{ tool: Tool; result: unknown }>(
			event,
			`/api/v1/results/jobs/${jobRouteId}/${task.type}`
		);
		return selectResultCreatedAt(resultData.result, task.type, task.target);
	} catch {
		return null;
	}
};

export const load: PageServerLoad = async (event) => {
	const rawFilter = event.url.searchParams.get('filter');
	const currentUserRole = event.locals.user?.role ?? null;

	try {
		const data = await callDashboardApi<{ tasks: ApiQueueTask[] }>(event, '/api/v1/job-queue');

		const tasks: QueueTaskView[] = await Promise.all(
			(data.tasks ?? []).map(async (task) => {
				const jobRouteId = toRouteIdString(task.job);
				let websiteUrl = '-';
				const resultCreatedAt = await resolveTaskResultCreatedAt(event, task, jobRouteId);

				if (jobRouteId) {
					try {
						const jobData = await callDashboardApi<{ job: ApiJob }>(
							event,
							`/api/v1/jobs/${jobRouteId}`
						);
						const websiteRouteId = toRouteIdString(jobData.job.website);

						if (websiteRouteId) {
							const websiteData = await callDashboardApi<{ website: ApiWebsite }>(
								event,
								`/api/v1/websites/${websiteRouteId}`
							);
							websiteUrl = websiteData.website?.url ?? '-';
						}
					} catch {
						websiteUrl = '-';
					}
				}

				return { ...mapQueueTaskToView(task, websiteUrl), result_created_at: resultCreatedAt };
			})
		);

		const dynamicAllowed = ['all', ...Array.from(new Set(tasks.map((task) => task.status).filter((status): status is QueueTaskStatus => typeof status === 'string' && (queueTaskStatuses as readonly string[]).includes(status))))] as const;
		const initialFilter = parseAllowedFilter(rawFilter, dynamicAllowed, 'all');

		return {
			tasks,
			initialFilter,
			currentUserRole,
			error: null
		};
	} catch (error) {
		if (error instanceof DashboardApiError) {
			return { tasks: [], initialFilter: 'all', currentUserRole, error: error.message };
		}
		throw error;
	}
};

export const actions: Actions = {
	unstuck: async (event) => {
		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '').trim();
		if (!id) return fail(400, { unstuck_error: 'Task id is required.' });

		try {
			await callDashboardApi(event, `/api/v1/job-queue/${id}/unstuck`, {
				method: 'POST'
			});
			return { unstuck_success: true };
		} catch (error) {
			if (error instanceof DashboardApiError) {
				return fail(error.status, { unstuck_error: error.message });
			}
			throw error;
		}
	},
	cancel: async (event) => {
		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '').trim();
		if (!id) return fail(400, { cancel_error: 'Task id is required.' });

		try {
			await callDashboardApi(event, `/api/v1/job-queue/${id}/cancel`, {
				method: 'POST'
			});
			return { cancel_success: true };
		} catch (error) {
			if (error instanceof DashboardApiError) {
				return fail(error.status, { cancel_error: error.message });
			}
			throw error;
		}
	}
};
