import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guards';
import { jsonError, jsonOk } from '$lib/server/http';
import { queryOne, withAdminDb, withUserDb } from '$lib/server/db';
import { isAdmin } from '$lib/server/policy';
import { DateTime, RecordId } from 'surrealdb';
import type { Domain, Job, SSL } from '$lib/types';

/**
 * @swagger
 * /api/v1/results/jobs/{id}:
 *   get:
 *     tags: [Results]
 *     summary: Get aggregated results for a job
 *     security:
 *       - apiKeyAuth: []
 *         bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Aggregated results
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const GET: RequestHandler = async (event) => {
	const auth = await requireUser(event);
	if ('error' in auth) return auth.error;

	const jobId = new RecordId('jobs', event.params.id);

	const sql = 'SELECT * FROM jobs WHERE id = $id LIMIT 1 FETCH website, probe, seo, ssl, whois, wcag, domain, security, stress;';
	const job: Job | null = isAdmin(auth.user)
		? await withAdminDb((db) => queryOne(db, sql, { id: jobId }))
		: await withUserDb(auth.token, (db) => queryOne(db, sql, { id: jobId }));
	if (!job) return jsonError(event, 404, 'not_found', 'Job not found.');

	const now = new DateTime();

	if(job.ssl) {
		const ssl = job.ssl as unknown as SSL;
		// @ts-ignore
		job.ssl.expires_in = parseInt(ssl.valid_to.diff(now).days);
	}

	if(job.domain) {
		const domain = job.domain as unknown as Domain;
		// @ts-ignore
		job.domain.expires_in = parseInt(domain.expirationDate.diff(now).days);
	}

	return jsonOk(event, { job });
};
