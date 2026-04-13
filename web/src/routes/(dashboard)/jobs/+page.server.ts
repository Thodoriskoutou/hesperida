import type { PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import { toRouteId } from '$lib/server/record-id';
import { parseAllowedFilter } from '$lib/server/filter';
import type { Job, Website } from '$lib/types';

type JobListRow = Job & {
	website_url?: string;
};

export const load: PageServerLoad = async (event) => {
	const allowedFilters = ['all', 'pending', 'processing', 'completed', 'failed'] as const;
	const initialFilter = parseAllowedFilter(event.url.searchParams.get('filter'), allowedFilters, 'all');

	try {
		const data = await callDashboardApi<{ jobs: JobListRow[] }>(event, '/api/v1/jobs');
		const jobs = data.jobs ?? [];

		const websiteIds = [...new Set(jobs.map((job) => toRouteId(job.website)).filter((id) => id.length > 0))];
		const websites = await Promise.all(
			websiteIds.map(async (id) => {
				try {
					const website = await callDashboardApi<{ website: Website }>(event, `/api/v1/websites/${id}`);
					return [id, website.website.url] as const;
				} catch {
					return [id, ''] as const;
				}
			})
		);
		const websiteById = new Map<string, string>(websites);

		return {
			jobs: jobs.map((job) => ({
				...job,
				id: toRouteId(job.id),
				website_url: websiteById.get(toRouteId(job.website)) ?? ''
			})),
			initialFilter,
			error: null
		};
	} catch (error) {
		if (error instanceof DashboardApiError) {
			return { jobs: [], initialFilter, error: error.message };
		}
		throw error;
	}
};
