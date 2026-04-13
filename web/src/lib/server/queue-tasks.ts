import type { QueueTaskRow, QueueTaskStatus } from '$lib/queue-tasks';
import { isQueueTaskStatus } from '$lib/queue-tasks';
import type { Queue, Website } from '$lib/types';
import { normalizeRecordId, toRouteId } from './record-id';

const toIsoDate = (value: unknown): string => {
	if (!value) return new Date(0).toISOString();
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && 'toString' in value) {
		const output = String((value as { toString: () => string }).toString());
		if (output && output !== '[object Object]') return output;
	}
	return new Date(0).toISOString();
};

const toStatus = (value: unknown): QueueTaskStatus =>
	isQueueTaskStatus(value) ? value : 'pending';

const extractJobId = (row: Queue): string => {
	if (row.job) {
		return toRouteId(normalizeRecordId(row.job.id));
	}
	return '';
};

export const mapQueueTaskRow = (row: Queue | Queue & { job: { website: Website } }): QueueTaskRow => {
	const id = toRouteId(normalizeRecordId(row.id));
	const websiteUrl =
		row.job &&
		typeof row.job === 'object' &&
		'website' in row.job &&
		row.job.website &&
		typeof row.job.website === 'object' &&
		'url' in row.job.website
			? String((row.job.website as Website).url ?? '')
			: '';
	return {
		id,
		job_id: extractJobId(row),
		type: typeof row.type === 'string' ? row.type : '',
		website_url: websiteUrl,
		target: typeof row.target === 'string' ? row.target : '',
		status: toStatus(row.status),
		created_at: toIsoDate(row.created_at)
	};
};
