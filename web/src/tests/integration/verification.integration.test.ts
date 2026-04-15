import { beforeAll, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { ensureSchema, resetData, setWebsiteVerificationCode, markWebsiteVerified } from '../helpers/db';
import { ApiTestClient, randomEmail } from '../helpers/request';
import { normalizeRecordId, toRouteId } from '../helpers/ids';
import { generateWebsiteVerificationCode } from '$lib/server/website-verification';

setDefaultTimeout(30_000);

const registerUser = async (namePrefix: string) => {
	const email = randomEmail(namePrefix);
	const password = 'pass12345';
	const authClient = new ApiTestClient({ apiKey: null });

	const signup = await authClient.call({
		method: 'POST',
		path: '/api/v1/auth/signup',
		body: { name: `${namePrefix} User`, email, password }
	});
	if (signup.response.status !== 201) throw new Error('Signup failed in test setup');

	const signin = await authClient.call({
		method: 'POST',
		path: '/api/v1/auth/signin',
		body: { email, password }
	});
	if (signin.response.status !== 200) throw new Error('Signin failed in test setup');

	return { email, token: signin.json.data.token as string };
};

describe('API Website Verification Integration', () => {
	beforeAll(async () => {
		await ensureSchema();
	});

	beforeEach(async () => {
		await resetData();
	});

	test('job creation is blocked for unverified website and allowed once verified_at is fresh', async () => {
		const user = await registerUser('verify_gate');
		const client = new ApiTestClient({ bearerToken: user.token });

		const created = await client.call({
			method: 'POST',
			path: '/api/v1/websites',
			body: {
				url: 'https://example.test',
				description: 'Verification gate website'
			}
		});
		expect(created.response.status).toBe(201);
		expect(typeof created.json.data.website.verification_code).toBe('string');
		expect(created.json.data.website.verification_code.length).toBeGreaterThan(8);
		expect(created.json.data.website.verified_at ?? null).toBeNull();

		const websiteRecordId = normalizeRecordId(created.json.data.website.id);

		const blocked = await client.call({
			method: 'POST',
			path: '/api/v1/jobs',
			body: { website: websiteRecordId, types: ['seo'] }
		});
		expect(blocked.response.status).toBe(403);
		expect(blocked.json.error.code).toBe('website_not_verified');
		const code = generateWebsiteVerificationCode();
		const markVerified = await setWebsiteVerificationCode(websiteRecordId, code);
		expect(markVerified?.verified_at).toBeTruthy();

		const allowed = await client.call({
			method: 'POST',
			path: '/api/v1/jobs',
			body: { website: websiteRecordId, types: ['seo'] }
		});
		expect(allowed.response.status).toBe(201);
	});

test('manual verify endpoint returns already_verified when verified_at is set', async () => {
		const user = await registerUser('verify_endpoint');
		const client = new ApiTestClient({ bearerToken: user.token });

		const created = await client.call({
			method: 'POST',
			path: '/api/v1/websites',
			body: {
				url: 'https://www.example.com',
				description: 'Cached verification website'
			}
		});
		expect(created.response.status).toBe(201);

		const websiteRecordId = normalizeRecordId(created.json.data.website.id);
		const markVerified = await markWebsiteVerified(websiteRecordId);
		expect(markVerified?.verified_at).toBeTruthy();

		const res = await client.call({
			method: 'GET',
			path: `/api/v1/websites/${encodeURIComponent(toRouteId(websiteRecordId))}/verify`
		});
		expect(res.response.status).toBe(409);
		expect(res.json.error.code).toBe('already_verified');
		expect(res.json.data.verification.verified).toBeTrue();
		expect(res.json.data.verification.method).toBe('cache');
		expect(typeof res.json.data.verification.txt_host).toBe('string');
		expect(typeof res.json.data.verification.http_url).toBe('string');
	});
});
