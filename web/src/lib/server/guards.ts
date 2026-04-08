import type { RequestEvent } from '@sveltejs/kit';
import { getCurrentUser, type AuthUser } from '$lib/server/auth';
import { jsonError } from '$lib/server/http';

type RequireUserResult = { error: Response } | { token: string; user: AuthUser };

export const requireUser = async (event: RequestEvent): Promise<RequireUserResult> => {
	const token = event.locals.authToken;
	if (!token) {
		return { error: jsonError(event, 401, 'unauthorized', 'Authentication required.') };
	}

	const user = await getCurrentUser(token);
	if (!user) {
		return { error: jsonError(event, 401, 'unauthorized', 'Invalid or expired session.') };
	}

	return { token, user };
};
