import { afterEach, describe, expect, test } from 'bun:test';
import { GET, _evaluateHealth, _setHealthSchemaProbeForTests, type HealthSchemaProbe } from '../../routes/health/+server';

afterEach(() => {
	_setHealthSchemaProbeForTests(null);
});

describe('Health endpoint readiness', () => {
	test('dashboard mode skips database checks and returns ok', async () => {
		let called = false;
		const probe: HealthSchemaProbe = async () => {
			called = true;
			return {
				expectedVersion: '0.9.2',
				actualVersion: '0.9.2',
				isUpToDate: true
			};
		};

		const result = await _evaluateHealth('dashboard', probe);

		expect(result.statusCode).toBe(200);
		expect(result.body.status).toBe('ok');
		expect(result.body.database.status).toBe('skipped');
		expect(called).toBeFalse();
	});

	test('api mode returns ok when schema version matches', async () => {
		const result = await _evaluateHealth('api', async () => ({
			expectedVersion: '0.9.2',
			actualVersion: '0.9.2',
			isUpToDate: true
		}));

		expect(result.statusCode).toBe(200);
		expect(result.body.status).toBe('ok');
		if (result.body.status !== 'ok') throw new Error('Expected ok health payload');
		expect(result.body.database.status).toBe('ok');
		expect(result.body.database.expected_version).toBe('0.9.2');
		expect(result.body.database.actual_version).toBe('0.9.2');
	});

	test('api mode returns 503 db_unreachable when schema probe throws', async () => {
		const result = await _evaluateHealth('api', async () => {
			throw new Error('connect failed');
		});

		expect(result.statusCode).toBe(503);
		expect(result.body.status).toBe('error');
		if (result.body.status !== 'error') throw new Error('Expected error health payload');
		expect(result.body.database.status).toBe('unreachable');
		expect(result.body.error.code).toBe('db_unreachable');
		expect(result.body.error.message).toBe('Database connection could not be established.');
	});

	test('api mode returns 503 db_version_mismatch when schema version differs', async () => {
		const result = await _evaluateHealth('api', async () => ({
			expectedVersion: '0.9.2',
			actualVersion: '0.9.1',
			isUpToDate: false
		}));

		expect(result.statusCode).toBe(503);
		expect(result.body.status).toBe('error');
		if (result.body.status !== 'error') throw new Error('Expected error health payload');
		expect(result.body.database.status).toBe('version_mismatch');
		expect(result.body.error.code).toBe('db_version_mismatch');
		expect(result.body.error.expected_version).toBe('0.9.2');
		expect(result.body.error.actual_version).toBe('0.9.1');
	});

	test('GET handler returns health payload and status mapping from probe result', async () => {
		_setHealthSchemaProbeForTests(async () => ({
			expectedVersion: '0.9.2',
			actualVersion: '0.9.0',
			isUpToDate: false
		}));

		const response = await GET();
		const payload = await response.json();

		expect(response.status).toBe(503);
		expect(payload.status).toBe('error');
		expect(payload.timestamp).toBeString();
		expect(payload.error.code).toBe('db_version_mismatch');
		expect(payload.database.status).toBe('version_mismatch');
		expect(payload.database.expected_version).toBe('0.9.2');
		expect(payload.database.actual_version).toBe('0.9.0');
	});
});
