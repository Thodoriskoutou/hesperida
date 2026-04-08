import { beforeAll, beforeEach, describe, expect, setDefaultTimeout, test } from 'bun:test';
import { createJob, createQueueTask, createUser, createWebsite, ensureSchema, resetData } from '../helpers/db';
import { ApiTestClient, randomEmail } from '../helpers/request';
setDefaultTimeout(30_000);

const normalizeRecordId = (value: unknown): string => {
	const normalizeString = (input: string): string => {
		const trimmed = input.trim();
		const unquoted = trimmed.replace(/^['"]+|['"]+$/g, '');
		const recordIdWrapped = unquoted.match(/^RecordId\((.+)\)$/);
		const wrappedRaw = recordIdWrapped ? recordIdWrapped[1] : unquoted;
		const raw = wrappedRaw.replace(/^['"]+|['"]+$/g, '');
		return raw.replace(/^([a-z_]+):\1:/i, '$1:');
	};

	if (typeof value === 'string') return normalizeString(value);
	if (typeof value === 'number' || typeof value === 'bigint') return String(value);
	if (value && typeof value === 'object') {
		const maybe = value as { tb?: unknown; id?: unknown };
		if (typeof maybe.tb === 'string' && typeof maybe.id !== 'undefined') {
			const idValue = normalizeString(String(maybe.id));
			return idValue.includes(':') ? idValue : `${maybe.tb}:${idValue}`;
		}
		if ('toString' in value && typeof (value as { toString: () => string }).toString === 'function') {
			const text = (value as { toString: () => string }).toString();
			if (text && text !== '[object Object]') return normalizeString(text);
		}
	}
	throw new Error(`Unexpected record id shape: ${JSON.stringify(value)} (${String(value)})`);
};

const createSignedInUser = async (name: string) => {
	const email = randomEmail(name.toLowerCase());
	const password = 'pass12345';
	const created = await createUser({ name, email, password });
	if (!created) throw new Error('Failed to create test user');

	const authClient = new ApiTestClient({ apiKey: null });
	const signin = await authClient.call({
		method: 'POST',
		path: '/api/v1/auth/signin',
		body: { email, password }
	});
	if (signin.response.status !== 200) {
		throw new Error(`Failed to signin test user: ${signin.response.status}`);
	}

	return { userId: normalizeRecordId(created.id), token: signin.json.data.token as string };
};

describe('API Job Queue Integration', () => {
	beforeAll(async () => {
		await ensureSchema();
	});

	beforeEach(async () => {
		await resetData();
	});

	test('list returns only owned queue tasks', async () => {
		const owner = await createSignedInUser('Queue Owner A');
		const other = await createSignedInUser('Queue Owner B');

		const ownerWebsite = await createWebsite({
			user: owner.userId,
			url: `https://${Math.random().toString(36).slice(2, 8)}.example.test`,
			description: 'Owner website'
		});
		const otherWebsite = await createWebsite({
			user: other.userId,
			url: `https://${Math.random().toString(36).slice(2, 8)}.example.test`,
			description: 'Other website'
		});
		if (!ownerWebsite || !otherWebsite) throw new Error('Failed to create websites');

		const ownerJob = await createJob({ website: normalizeRecordId(ownerWebsite.id), types: ['security'], status: 'processing' });
		const otherJob = await createJob({ website: normalizeRecordId(otherWebsite.id), types: ['security'], status: 'processing' });
		if (!ownerJob || !otherJob) throw new Error('Failed to create jobs');

		await createQueueTask({ job: normalizeRecordId(ownerJob.id), type: 'security', status: 'waiting' });
		await createQueueTask({ job: normalizeRecordId(otherJob.id), type: 'security', status: 'waiting' });

		const client = new ApiTestClient({ bearerToken: owner.token });
		const res = await client.call({ method: 'GET', path: '/api/v1/job-queue' });

		expect(res.response.status).toBe(200);
		expect(res.json.ok).toBeTrue();
		expect(Array.isArray(res.json.data.tasks)).toBeTrue();
		expect(res.json.data.tasks.length).toBe(1);
	});
});
