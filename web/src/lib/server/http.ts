import type { RequestEvent } from '@sveltejs/kit';
import { serializeApiData } from './api-serializer';

export const jsonOk = (event: RequestEvent, data: unknown, status = 200): Response => {
	return Response.json(
		{ ok: true, request_id: event.locals.requestId, data: serializeApiData(data) },
		{ status }
	);
};

export const jsonError = (
	event: Pick<RequestEvent, 'locals'>,
	status: number,
	code: string,
	message: string,
	details?: unknown
): Response => {
	return Response.json(
		{
			ok: false,
			request_id: event.locals.requestId,
			error: {
				code,
				message,
				...(typeof details === 'undefined' ? {} : { details })
			}
		},
		{ status }
	);
};

export const parseJson = async (request: Request): Promise<Record<string, unknown>> => {
	const payload = await request.json();
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		throw new Error('Expected JSON object payload.');
	}
	return payload as Record<string, unknown>;
};
