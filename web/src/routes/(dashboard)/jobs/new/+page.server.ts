import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { callDashboardApi, DashboardApiError } from '$lib/server/dashboard-api';
import type { Tool } from '$lib/types';
import type { ApiWebsite } from '$lib/types/api';
import { mapWebsiteToView } from '$lib/server/dashboard-mappers';
import { getPlaywrightDevices } from '$lib/server/playwright-devices';

export const load: PageServerLoad = async (event) => {
	const rawPrefillWebsiteId = String(event.url.searchParams.get('website_id') ?? '').trim();
	const prefillWebsiteId = rawPrefillWebsiteId.includes(':')
		? rawPrefillWebsiteId.split(':').pop() ?? ''
		: rawPrefillWebsiteId;
	const devices = await getPlaywrightDevices();

	const websitesData = await callDashboardApi<{ websites: ApiWebsite[] }>(event, '/api/v1/websites');
	return {
		websites: (websitesData.websites ?? []).map(mapWebsiteToView),
		devices,
		prefillWebsiteId
	};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const website = String(formData.get('website') ?? '').trim();
		const selectedTools = formData.getAll('types').map((v) => String(v).trim()) as Tool[];
		const selectedDevices = formData.getAll('devices').map((v) => String(v).trim());

		if (!website) {
			return fail(400, { error: 'website is required.', values: { website, types: selectedTools, devices: selectedDevices } });
		}

		const options: any = {};
		options.wcag = {};
		options.wcag.devices = selectedDevices;

		try {
			await callDashboardApi(event, '/api/v1/jobs', {
				method: 'POST',
				body: {
					website,
					types: selectedTools,
					...(options ? { options } : {})
				}
			});
		} catch (error) {
			if (error instanceof DashboardApiError) {
				return fail(error.status, { error: error.message , values: { website, types: selectedTools, devices: selectedDevices } });
			}
			throw error;
		}

		throw redirect(303, '/jobs');
	}
};
