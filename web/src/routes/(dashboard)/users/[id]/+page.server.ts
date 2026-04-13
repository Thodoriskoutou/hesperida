import type { PageServerLoad } from './$types';
import { callDashboardApi } from '$lib/server/dashboard-api';
import { normalizeRecordId } from '$lib/server/record-id';
import { mapUserToView, mapWebsiteToView, toRouteIdString } from '$lib/server/dashboard-mappers';
import type { ApiUser, ApiWebsite } from '$lib/types/api';

export const load: PageServerLoad = async (event) => {
	const data = await callDashboardApi<{ user: ApiUser }>(
		event,
		`/api/v1/users/${event.params.id}`
	);
	const websitesData = await callDashboardApi<{ websites: ApiWebsite[] }>(event, '/api/v1/websites');

	const user = mapUserToView(data.user);
	const userRecordId = normalizeRecordId(data.user.id);
	const userRouteId = user.id;
	const websites = (websitesData.websites ?? []).map((website) => {
		const ownerId = website.owner ? normalizeRecordId(website.owner) : '';
		const memberIds = Array.isArray(website.users)
			? website.users.map((member) => normalizeRecordId(member))
			: [];
		const isOwner = ownerId === userRecordId;
		const isMember = memberIds.includes(userRecordId) && !isOwner;
		return {
			...mapWebsiteToView(website),
			id: toRouteIdString(website.id),
			isOwner,
			isMember
		};
	});

	return {
		user,
		websites,
		breadcrumbEntityLabel: user.name?.trim() || user.email?.trim() || `User ${userRouteId}`,
		breadcrumbEntityHref: `/users/${userRouteId}`
	};
};
