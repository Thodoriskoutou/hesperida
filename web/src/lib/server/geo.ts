import type { ApiProbeGeo } from '$lib/types/api';

export type GeoLookup = {
	lat: number;
	lon: number;
	countryName: string;
	countryCode: string;
	zip: string;
	city: string;
};

export type GeoSummary = {
	lat: number | null;
	lon: number | null;
	countryName: string | null;
	countryCode: string | null;
	zip: string | null;
	city: string | null;
};

const asObject = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

const toFiniteNumber = (value: unknown): number | null => {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return null;
};

const toStringOrNull = (value: unknown): string | null => {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return trimmed.length ? trimmed : null;
	}
	return null;
};

const toProbeGeo = (value: unknown): Partial<ApiProbeGeo> => {
	const geo = asObject(value);
	return {
		lat: toFiniteNumber(geo.lat) ?? undefined,
		lon: toFiniteNumber(geo.lon) ?? undefined,
		country_name: toStringOrNull(geo.country_name) ?? undefined,
		country_code: toStringOrNull(geo.country_code) ?? undefined,
		city: toStringOrNull(geo.city) ?? undefined,
		zip: toStringOrNull(geo.zip) ?? undefined
	};
};

export const mapProbeGeoToLookup = (value: unknown): GeoLookup => {
	const geo = toProbeGeo(value);
	return {
		lat: geo.lat ?? 0,
		lon: geo.lon ?? 0,
		countryName: geo.country_name ?? '',
		countryCode: geo.country_code ?? '',
		zip: geo.zip ?? '',
		city: geo.city ?? ''
	};
};

export const mapProbeGeoToSummary = (value: unknown): GeoSummary => {
	const geo = toProbeGeo(value);
	return {
		lat: geo.lat ?? null,
		lon: geo.lon ?? null,
		countryName: geo.country_name ?? null,
		countryCode: geo.country_code ?? null,
		zip: geo.zip ?? null,
		city: geo.city ?? null
	};
};
