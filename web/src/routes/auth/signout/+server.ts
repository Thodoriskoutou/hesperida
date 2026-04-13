import { clearSessionCookies } from '$lib/server/auth';
import { redirect, type RequestHandler } from '@sveltejs/kit';

const runSignout = async (event: Parameters<RequestHandler>[0]) => {
	await event.fetch('/api/v1/auth/signout', { method: 'POST' });
	clearSessionCookies(event);
	throw redirect(303, '/auth/signin');
};

export const GET: RequestHandler = async (event) => runSignout(event);
export const POST: RequestHandler = async (event) => runSignout(event);
