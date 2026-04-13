export type DashboardNotificationKind = 'job' | 'task';
export type DashboardNotificationStatus = 'completed' | 'failed';

export interface DashboardNotificationEvent {
	event_id: string;
	kind: DashboardNotificationKind;
	status: DashboardNotificationStatus;
	job_id: string;
	task_id?: string;
	tool?: string;
	website_url?: string;
	href: string;
	message: string;
	created_at: string;
}

