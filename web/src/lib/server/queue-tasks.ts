import type { QueueTaskRow, QueueTaskStatus } from '$lib/queue-tasks';
import { isQueueTaskStatus } from '$lib/queue-tasks';
import type { Queue, Tool, Website } from '$lib/types';
import { normalizeRecordId, toRouteId } from './record-id';
import type { Surreal } from 'surrealdb';

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

type TimestampedResult = {
	created_at?: unknown;
	device?: unknown;
};

const toOptionalIsoDate = (value: unknown): string | null => {
	if (!value) return null;
	return toIsoDate(value);
};

const latestResultCreatedAt = (results: TimestampedResult[]): string | null => {
	let latest: TimestampedResult | null = null;
	for (const result of results) {
		if (!result?.created_at) continue;
		if (!latest?.created_at || new Date(toIsoDate(result.created_at)).getTime() > new Date(toIsoDate(latest.created_at)).getTime()) {
			latest = result;
		}
	}
	return latest?.created_at ? toIsoDate(latest.created_at) : null;
};

const selectResultCreatedAt = (result: unknown, type: Tool | string, target: unknown): string | null => {
	if (!result) return null;
	if (Array.isArray(result)) {
		const results = result.filter((entry): entry is TimestampedResult => !!entry && typeof entry === 'object');
		if (type === 'wcag') {
			const normalizedTarget = String(target ?? '').trim().toLowerCase();
			const selected =
				results.find((entry) => String(entry.device ?? '').trim().toLowerCase() === normalizedTarget) ??
				results[0];
			return toOptionalIsoDate(selected?.created_at);
		}
		return latestResultCreatedAt(results);
	}
	if (typeof result === 'object') return toOptionalIsoDate((result as TimestampedResult).created_at);
	return null;
};

const selectRecord = async (db: Surreal, record: unknown): Promise<unknown> => {
	if (!record) return null;
	return (db as { select: (value: unknown) => Promise<unknown> }).select(record);
};

const selectJobResultValue = async (db: Surreal, row: Queue): Promise<unknown> => {
	const tool = typeof row.type === 'string' ? row.type : '';
	if (!tool) return null;

	const job = row.job;
	if (!job) return null;
	if (typeof job === 'object' && tool in job) return (job as unknown as Record<string, unknown>)[tool];

	const jobRecord = await selectRecord(db, job);
	if (!jobRecord || typeof jobRecord !== 'object') return null;
	return (jobRecord as Record<string, unknown>)[tool];
};

const resolveResultCreatedAt = async (db: Surreal, row: Queue): Promise<string | null> => {
	try {
		const resultValue = await selectJobResultValue(db, row);
		if (!resultValue) return null;
		const result = Array.isArray(resultValue)
			? await Promise.all(resultValue.map((id) => selectRecord(db, id)))
			: await selectRecord(db, resultValue);
		return selectResultCreatedAt(result, row.type, row.target);
	} catch {
		return null;
	}
};

export const mapQueueTaskRow = (
	row: Queue | Queue & { job: { website: Website } },
	options?: { resultCreatedAt?: string | null } | number
): QueueTaskRow => {
	const resultCreatedAt = typeof options === 'object' ? options.resultCreatedAt : null;
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
		created_at: toIsoDate(row.created_at),
		result_created_at: resultCreatedAt ?? null
	};
};

export const mapQueueTaskRowWithResult = async (
	db: Surreal,
	row: Queue | Queue & { job: { website: Website } }
): Promise<QueueTaskRow> => mapQueueTaskRow(row, { resultCreatedAt: await resolveResultCreatedAt(db, row) });
