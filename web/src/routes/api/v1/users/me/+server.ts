import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guards';
import { jsonError, jsonOk, parseJson } from '$lib/server/http';
import { queryOne, withAdminDb } from '$lib/server/db';

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - apiKeyAuth: []
 *         bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 */
export const GET: RequestHandler = async (event) => {
	const auth = await requireUser(event);
	if ('error' in auth) return auth.error;

	return jsonOk(event, { user: auth.user });
};

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - apiKeyAuth: []
 *         bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
export const PATCH: RequestHandler = async (event) => {
	const auth = await requireUser(event);
	if ('error' in auth) return auth.error;

	let payload: Record<string, unknown>;
	try {
		payload = await parseJson(event.request);
	} catch (error) {
		return jsonError(event, 400, 'bad_request', (error as Error).message);
	}

	const patch: Record<string, unknown> = {};
	if (typeof payload.name === 'string') patch.name = payload.name.trim();
	if (typeof payload.email === 'string') patch.email = payload.email.trim();

	if (!Object.keys(patch).length) {
		return jsonError(event, 400, 'bad_request', 'At least one updatable field is required (name, email).');
	}

	try {
		const user = await withAdminDb((db) =>
			queryOne<{ id: string; email: string; name: string; created_at?: string }>(
				db,
				'UPDATE $id MERGE $patch RETURN AFTER;',
				{ id: auth.user.id, patch }
			)
		);
		if (!user) return jsonError(event, 404, 'not_found', 'User not found.');

		return jsonOk(event, { user });
	} catch (error) {
		return jsonError(event, 400, 'update_failed', (error as Error).message);
	}
};
