import { DateTime, RecordId } from 'surrealdb';
import { normalizeRecordId } from './record-id';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (!value || typeof value !== 'object') return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

const toRecordIdString = (value: RecordId | { tb?: unknown; id?: unknown }): string => {
	const normalized = normalizeRecordId(value);
	if (!normalized || normalized === '[object Object]') return '';
	return normalized;
};

const isRecordIdLike = (value: unknown): value is RecordId | { tb?: unknown; id?: unknown } => {
	if (!value || typeof value !== 'object') return false;
	if (value instanceof RecordId) return true;
	return 'tb' in value && 'id' in value;
};

const toIso = (value: DateTime | Date): string => {
	if (value instanceof DateTime) return value.toDate().toISOString();
	return value.toISOString();
};

export const serializeApiData = (input: unknown): unknown => {
	if (
		input === null ||
		typeof input === 'undefined' ||
		typeof input === 'string' ||
		typeof input === 'number' ||
		typeof input === 'boolean'
	) {
		return input;
	}

	if (typeof input === 'bigint') return input.toString();
	if (input instanceof DateTime || input instanceof Date) return toIso(input);
	if (isRecordIdLike(input)) return toRecordIdString(input);
	if (Array.isArray(input)) return input.map((item) => serializeApiData(item));
	if (!isPlainObject(input)) return input;

	const entries = Object.entries(input).map(([key, value]) => [key, serializeApiData(value)]);
	return Object.fromEntries(entries);
};
