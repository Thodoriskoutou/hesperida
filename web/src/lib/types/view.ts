import type {
	ApiJob,
	ApiQueueTask,
	ApiUser,
	ApiWebsite
} from '$lib/types/api';

export interface WebsiteView extends Omit<ApiWebsite, 'id' | 'owner' | 'users'> {
	id: string;
	owner_id: string;
	user_ids: string[];
}

export interface UserView extends Omit<ApiUser, 'id'> {
	id: string;
}

export interface JobView extends Omit<ApiJob, 'id' | 'website'> {
	id: string;
	website_id: string;
	website_url?: string;
}

export interface QueueTaskView extends Omit<ApiQueueTask, 'id' | 'job'> {
	id: string;
	job_id: string;
	website_url?: string;
}

