import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { toRouteId } from '$lib/server/record-id';
import { parseAllowedFilter } from '$lib/server/filter';
import { queueTaskStatuses, type QueueTaskStatus } from '$lib/queue-tasks';
import type { Queue, Website } from '$lib/types';

type QueueTaskView = Omit<Queue, 'id'> & {
	id: string;
	job_id: string;
	website_url: string;
};

const toRecordIdString = (value: unknown): string => {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'tb' in value && 'id' in value) {
		const rec = value as { tb?: unknown; id?: unknown };
		if (typeof rec.tb === 'string' && typeof rec.id === 'string') return `${rec.tb}:${rec.id}`;
	}
	return '';
};

export const load: PageServerLoad = async (event) => {
	const rawFilter = event.url.searchParams.get('filter');

	try {
		const data = await callDashboardApi<{ tasks: Queue[] }>(event, '/api/v1/job-queue');

		const tasks: QueueTaskView[] = await Promise.all(
			(data.tasks ?? []).map(async (task) => {
				const jobRecordId = toRecordIdString(task.job);
				const jobRouteId = jobRecordId ? toRouteId(jobRecordId) : '';
				let websiteUrl = '-';

				if (jobRouteId) {
					try {
						const jobData = await callDashboardApi<{ job: Record<string, unknown> }>(
							event,
							`/api/v1/jobs/${jobRouteId}`
						);
						const websiteRecordId = toRecordIdString(jobData.job.website);
						const websiteRouteId = websiteRecordId ? toRouteId(websiteRecordId) : '';

						if (websiteRouteId) {
							const websiteData = await callDashboardApi<{ website: Website }>(
								event,
								`/api/v1/websites/${websiteRouteId}`
							);
							websiteUrl = websiteData.website?.url ?? '-';
						}
					} catch {
						websiteUrl = '-';
					}
				}

				return {
					...task,
					id: toRouteId(toRecordIdString(task.id)),
					job_id: jobRouteId,
					website_url: websiteUrl
				};
			})
		);

		const dynamicAllowed = ['all', ...Array.from(new Set(tasks.map((task) => task.status).filter((status): status is QueueTaskStatus => typeof status === 'string' && (queueTaskStatuses as readonly string[]).includes(status))))] as const;
		const initialFilter = parseAllowedFilter(rawFilter, dynamicAllowed, 'all');

		return {
			tasks,
			initialFilter,
			error: null
		};
	} catch (error) {
		if (error instanceof DashboardApiError) {
			return { tasks: [], initialFilter: 'all', error: error.message };
		}
		throw error;
	}
};

export const actions: Actions = {
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
