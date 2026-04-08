import type { RequestHandler } from './$types';
import { config } from '$lib/server/config';
import { jsonOk } from '$lib/server/http';

/**
 * @swagger
 * /api/v1/auth/signout:
 *   post:
 *     tags: [Auth]
 *     summary: Sign out and clear session cookie
 *     responses:
 *       200:
 *         description: Signed out
 */
export const POST: RequestHandler = async (event) => {
	event.cookies.delete(config.sessionCookieName, { path: '/' });
	return jsonOk(event, { success: true });
};
