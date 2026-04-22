import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { mapJobToView, toRouteIdString } from '$lib/server/dashboard-mappers';
import { formatDate } from '$lib/utils';
import type { Tool } from '$lib/types';
import type { ApiJob, ApiQueueTask, ApiWebsite, ApiWcagResult } from '$lib/types/api';

const scoreTools = new Set<Tool>(['seo', 'wcag', 'security', 'stress', 'mail']);

export const load: PageServerLoad = async (event) => {
	const data = await callDashboardApi<{ task: ApiQueueTask }>(
		event,
		`/api/v1/job-queue/${event.params.id}`
	);
	const job = await callDashboardApi<{ job: ApiJob }>(
		event,
		`/api/v1/jobs/${toRouteIdString(data.task.job)}`
	);
	const website = await callDashboardApi<{ website: ApiWebsite }>(
		event,
		`/api/v1/websites/${toRouteIdString(job.job.website)}`
	);

	const taskRouteId = toRouteIdString(data.task.id);
	const url = new URL(website.website.url as string);
	const taskLabel = `${String(data.task.type).toUpperCase()} on ${url.hostname} @ ${formatDate(String(data.task.created_at ?? ''), true)}`;
	const jobRouteId = toRouteIdString(job.job.id);
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
			const resultArray: ApiWcagResult[] = Array.isArray(resultData.result)
				? (resultData.result as ApiWcagResult[])
				: resultData.result
					? [resultData.result as ApiWcagResult]
					: [];
			const target = String(data.task.target ?? '').trim().toLowerCase();
			const selectedWcag =
				resultArray.find((entry) => String(entry.device ?? '').toLowerCase() === target) ??
				resultArray[0] ??
				null;

			toolResult = selectedWcag;
			if (selectedWcag?.id) {
				wcagScreenshotId = toRouteIdString(selectedWcag.id);
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
		task: { ...data.task, id: taskRouteId, job: toRouteIdString(data.task.job) },
		job: { ...mapJobToView(job.job), id: jobRouteId, website_url: website.website.url },
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
