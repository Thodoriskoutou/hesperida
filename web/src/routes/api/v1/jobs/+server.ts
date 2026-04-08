import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guards';
import { jsonError, jsonOk, parseJson } from '$lib/server/http';
import { queryMany, queryOne, toRecordId, withAdminDb } from '$lib/server/db';
type Tool = 'probe' | 'seo' | 'ssl' | 'wcag' | 'whois' | 'domain' | 'security' | 'stress';
const ALLOWED_TOOLS: Tool[] = ['probe', 'seo', 'ssl', 'wcag', 'whois', 'domain', 'security', 'stress'];

/**
 * @swagger
 * /api/v1/jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List jobs for the current user
 *     security:
 *       - apiKeyAuth: []
 *         bearerAuth: []
 *     responses:
 *       200:
 *         description: Job list
 */
export const GET: RequestHandler = async (event) => {
	const auth = await requireUser(event);
	if ('error' in auth) return auth.error;

	const rows = await withAdminDb((db) =>
		queryMany(db, 'SELECT * FROM jobs WHERE website.user = $user ORDER BY created_at DESC;', {
			user: auth.user.id
		})
	);

	return jsonOk(event, { jobs: rows ?? [] });
};

/**
 * @swagger
 * /api/v1/jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new scan job
 *     security:
 *       - apiKeyAuth: []
 *         bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [website, types]
 *             properties:
 *               website: { type: string }
 *               types:
 *                 type: array
 *                 items: { type: string }
 *               options: { type: object }
 *     responses:
 *       201:
 *         description: Job created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const POST: RequestHandler = async (event) => {
	const auth = await requireUser(event);
	if ('error' in auth) return auth.error;

	let payload: Record<string, unknown>;
	try {
		payload = await parseJson(event.request);
	} catch (error) {
		return jsonError(event, 400, 'bad_request', (error as Error).message);
	}

	const website = typeof payload.website === 'string' ? toRecordId('websites', payload.website) : '';
	const types = Array.isArray(payload.types) ? payload.types.filter((item): item is Tool => typeof item === 'string' && ALLOWED_TOOLS.includes(item as Tool)) : [];
	const options = payload.options && typeof payload.options === 'object' && !Array.isArray(payload.options) ? payload.options : null;

	if (!website) return jsonError(event, 400, 'bad_request', 'website is required.');
	if (!types.length) return jsonError(event, 400, 'bad_request', 'types must include at least one valid tool.');

	const websiteRow = await withAdminDb((db) =>
		queryOne(db, 'SELECT id FROM websites WHERE id = type::record($id) AND user = $user LIMIT 1;', {
			id: website,
			user: auth.user.id
		})
	);
	if (!websiteRow) return jsonError(event, 404, 'not_found', 'Website not found.');

	try {
		const job = await withAdminDb((db) => {
			if (options) {
				return queryOne(
					db,
					'CREATE jobs CONTENT { website: type::record($website), types: $types, status: "pending", options: $options } RETURN AFTER;',
					{ website, types, options }
				);
			}

			return queryOne(
				db,
				'CREATE jobs CONTENT { website: type::record($website), types: $types, status: "pending" } RETURN AFTER;',
				{ website, types }
			);
		});

		return jsonOk(event, { job }, 201);
	} catch (error) {
		return jsonError(event, 400, 'create_failed', (error as Error).message);
	}
};
