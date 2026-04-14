import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { mapQueueTaskToView, toRouteIdString } from '$lib/server/dashboard-mappers';
import { parseAllowedFilter } from '$lib/server/filter';
import { queueTaskStatuses, type QueueTaskStatus } from '$lib/queue-tasks';
import type { ApiJob, ApiQueueTask, ApiWebsite } from '$lib/types/api';

type QueueTaskView = ReturnType<typeof mapQueueTaskToView>;

export const load: PageServerLoad = async (event) => {
	const rawFilter = event.url.searchParams.get('filter');
	const currentUserRole = event.locals.user?.role ?? null;

	try {
		const data = await callDashboardApi<{ tasks: ApiQueueTask[] }>(event, '/api/v1/job-queue');

		const tasks: QueueTaskView[] = await Promise.all(
			(data.tasks ?? []).map(async (task) => {
				const jobRouteId = toRouteIdString(task.job);
				let websiteUrl = '-';

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

				return mapQueueTaskToView(task, websiteUrl);
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
