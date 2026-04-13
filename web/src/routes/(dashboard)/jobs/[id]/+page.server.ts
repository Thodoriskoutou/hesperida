import type { PageServerLoad } from './$types';
import { callDashboardApi } from '$lib/server/dashboard-api';
import type { ApiJobResults, ApiProbeResult } from '$lib/types/api';
import { toRouteIdString } from '$lib/server/dashboard-mappers';
import { DateTime } from 'surrealdb';
import { formatDate } from '$lib/utils';
import { techSearch, type Technology } from '$lib/server/wappalyzer';
import { mapProbeGeoToLookup } from '$lib/server/geo';

type ProbeWithResolvedTech = Omit<ApiProbeResult, 'tech' | 'wp_plugins' | 'wp_themes'> & {
	tech?: Technology[];
	wp_plugins?: Technology[];
	wp_themes?: Technology[];
};

const resolveTechEntries = async (entries?: string[]): Promise<Technology[]> => {
	if (!Array.isArray(entries) || entries.length === 0) return [];
	const found = await Promise.all(entries.map(async (entry) => techSearch(entry)));
	return found.filter((item): item is Technology => item !== null);
};

export const load: PageServerLoad = async (event) => {
	const data = await callDashboardApi<{ job: ApiJobResults }>(
		event,
		`/api/v1/results/jobs/${event.params.id}`
	);
	const jobRouteId = toRouteIdString(data.job.id);
	const websiteUrl =
		typeof data.job.website === 'string'
			? ''
			: (data.job.website?.url ?? '').trim();
	const date = new DateTime(String(data.job.created_at ?? new Date().toISOString()));

	const probeRaw = data.job.probe ?? null;
	const probe: ProbeWithResolvedTech = probeRaw
		? {
				...probeRaw,
				tech: await resolveTechEntries(probeRaw.tech),
				wp_plugins: await resolveTechEntries(probeRaw.wp_plugins),
				wp_themes: await resolveTechEntries(probeRaw.wp_themes)
			}
		: {
				cdn: null,
				favicon: null,
				ipv4: [],
				ipv6: [],
				response_time: '0',
				secure: false,
				server: '',
				title: '',
				tech: [],
				wp_plugins: [],
				wp_themes: []
			};

	const geo = mapProbeGeoToLookup(probe?.geo);

	return {
		job: {
			...data.job,
			probe,
			id: jobRouteId,
			geo
		},
		breadcrumbEntityLabel: `${websiteUrl} @ ${formatDate(date, true)}`,
		breadcrumbEntityHref: `/jobs/${jobRouteId}`
	};
};
