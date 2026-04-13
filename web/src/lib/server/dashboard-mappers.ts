import { toRouteId } from './record-id';
import type {
	ApiDateTime,
	ApiJob,
	ApiQueueTask,
	ApiUser,
	ApiWebsite
} from '$lib/types/api';
import type { JobView, QueueTaskView, UserView, WebsiteView } from '$lib/types/view';

const toIso = (value: unknown): string => {
	if (!value) return '';
	if (typeof value === 'string') return value;
	if (value instanceof Date) return value.toISOString();
	return String(value);
};

export const toRouteIdString = (value: unknown): string => {
	if (!value) return '';
	return toRouteId(String(value));
};

export const toIsoDateString = (value: unknown): ApiDateTime => toIso(value);

export const mapWebsiteToView = (website: ApiWebsite): WebsiteView => ({
	...website,
	id: toRouteIdString(website.id),
	owner_id: toRouteIdString(website.owner),
	user_ids: (website.users ?? []).map((userId) => toRouteIdString(userId))
});

export const mapUserToView = (user: ApiUser): UserView => ({
	...user,
	id: toRouteIdString(user.id)
});

export const mapJobToView = (job: ApiJob): JobView => ({
	...job,
	id: toRouteIdString(job.id),
	website_id: toRouteIdString(job.website)
});

export const mapQueueTaskToView = (
	task: ApiQueueTask,
	websiteUrl?: string
): QueueTaskView => ({
	...task,
	id: toRouteIdString(task.id),
	job_id: toRouteIdString(task.job),
	website_url: websiteUrl ?? ''
});

