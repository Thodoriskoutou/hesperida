import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { toRouteId } from '$lib/server/record-id';
import { formatDate } from '$lib/utils';
import type { Tool } from '$lib/types';

const scoreTools = new Set<Tool>(['seo', 'wcag', 'security', 'stress']);

export const load: PageServerLoad = async (event) => {
	const data = await callDashboardApi<{ task: Record<string, unknown> }>(event, `/api/v1/job-queue/${event.params.id}`);
	const job = await callDashboardApi<{ job: Record<string, unknown> }>(event, `/api/v1/jobs/${toRouteId(data.task.job)}`);
	const website = await callDashboardApi<{ website: Record<string, unknown> }>(event, `/api/v1/websites/${toRouteId(job.job.website)}`);

	const taskRouteId = toRouteId(data.task.id);
	const url = new URL(website.website.url as string);
	const taskLabel = `${(data.task.type as string).toUpperCase()} on ${url.hostname} @ ${formatDate(data.task.created_at as string, true)}`;
	const jobRouteId = toRouteId(job.job.id);
	const taskType = String(data.task.type ?? '').toLowerCase() as Tool;

	let toolResult: unknown = null;
	let resultError: string | null = null;
	let wcagScreenshotId: string | null = null;

	try {
		const resultData = await callDashboardApi<{ tool: Tool; result: unknown }>(
			event,
			`/api/v1/results/jobs/${jobRouteId}/${taskType}`
		);
		toolResult = resultData.result;

		if (taskType === 'wcag') {
			const resultArray = Array.isArray(resultData.result)
				? resultData.result
				: resultData.result
					? [resultData.result]
					: [];
			const target = String(data.task.target ?? '').trim().toLowerCase();
			const selectedWcag =
				resultArray.find((entry) => String((entry as { device?: unknown }).device ?? '').toLowerCase() === target) ??
				resultArray[0] ??
				null;

			toolResult = selectedWcag;
			if (selectedWcag && typeof selectedWcag === 'object' && 'id' in selectedWcag) {
				wcagScreenshotId = toRouteId((selectedWcag as { id: unknown }).id);
			}
		}
	} catch (error) {
		if (error instanceof DashboardApiError) {
			resultError = error.message;
		} else {
			throw error;
		}
	}

	return {
		task: { ...data.task, id: taskRouteId },
		job: { ...job.job, id: jobRouteId, website_url: website.website.url },
		taskType,
		toolResult,
		resultError,
		wcagScreenshotId,
		isScoreTool: scoreTools.has(taskType),
		breadcrumbEntityLabel: taskLabel,
		breadcrumbEntityHref: `/job-queue/${taskRouteId}`
	};
};

export const actions: Actions = {
	cancel: async (event) => {
		try {
			await callDashboardApi(event, `/api/v1/job-queue/${event.params.id}/cancel`, {
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
