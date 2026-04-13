import type { PageServerLoad } from './$types';
import { callDashboardApi } from '$lib/server/dashboard-api';
import { toRouteId } from '$lib/server/record-id';
import type { Website } from '$lib/types';
import { DateTime } from 'surrealdb';
import { formatDate } from '$lib/utils';
import { techSearch, type Technology } from '$lib/server/wappalyzer'

export const load: PageServerLoad = async (event) => {
	const data = await callDashboardApi<{ job: Record<string, unknown> }>(
		event,
		`/api/v1/results/jobs/${event.params.id}`
	);
	const jobRouteId = toRouteId(data.job.id);
	const websiteUrl = ((data.job.website as Website)?.url ?? '').trim();
	const date = new DateTime(data.job.created_at as string);

	if((data as any).job.probe.tech) {
		const techs: Technology[] = await Promise.all((data as any).job.probe.tech.map(async t => await techSearch(t)));
		(data as any).job.probe.tech = techs;
	}

	if((data as any).job.probe.wp_plugins) {
		const wp_plugins: Technology[] = await Promise.all((data as any).job.probe.wp_plugins.map(async t => await techSearch(t)));
		(data as any).job.probe.wp_plugins = wp_plugins;
	}

	if((data as any).job.probe.wp_themes) {
		const wp_themes: Technology[] = await Promise.all((data as any).job.probe.wp_themes.map(async t => await techSearch(t)));
		(data as any).job.probe.wp_themes = wp_themes;
	}

	const ipAddress = (data as any).job.probe.ipv4[0] ?? (data as any).job.probe.ipv6[0];

	const geoRes = await event.fetch(`https://free.freeipapi.com/api/json/${ipAddress}`);
	const getData = await geoRes.json();

	return {
		job: {
			...data.job,
			id: jobRouteId,
			geo: {
				lat: getData.latitude,
				lon: getData.longitude,
				countryName: getData.countryName,
				countryCode: getData.countryCode,
				zip: getData.zipCode,
				city: getData.cityName
			}
		},
		breadcrumbEntityLabel: `${websiteUrl} @ ${formatDate(date, true)}`,
		breadcrumbEntityHref: `/jobs/${jobRouteId}`
	};
};
