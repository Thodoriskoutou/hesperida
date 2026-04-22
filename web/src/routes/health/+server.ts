import { json } from '@sveltejs/kit';
import type { AppMode } from '$lib/server/config';
import { config } from '$lib/server/config';
import { probeSchemaVersion, type SchemaVersionProbe } from '$lib/server/db-init';

type HealthPayload =
	| {
			status: 'ok';
			timestamp: string;
			database: {
				status: 'ok' | 'skipped';
				expected_version?: string | undefined;
				actual_version?: unknown;
			};
	  }
	| {
			status: 'error';
			timestamp: string;
			database: {
				status: 'unreachable' | 'version_mismatch';
				expected_version?: string | undefined;
				actual_version?: unknown;
			};
			error: {
				code: 'db_unreachable' | 'db_version_mismatch';
				message: string;
				expected_version?: string | undefined;
				actual_version?: unknown;
			};
	  };

export type HealthSchemaProbe = () => Promise<SchemaVersionProbe>;

let healthSchemaProbe: HealthSchemaProbe = probeSchemaVersion;

export const _setHealthSchemaProbeForTests = (probe: HealthSchemaProbe | null): void => {
	healthSchemaProbe = probe ?? probeSchemaVersion;
};

export const _evaluateHealth = async (
	appMode: AppMode,
	schemaProbe: HealthSchemaProbe = healthSchemaProbe
): Promise<{ statusCode: number; body: HealthPayload }> => {
	const timestamp = new Date().toISOString();

	if (appMode === 'dashboard') {
		return {
			statusCode: 200,
			body: {
				status: 'ok',
				timestamp,
				database: {
					status: 'skipped'
				}
			}
		};
	}

	let probe: SchemaVersionProbe;
	try {
		probe = await schemaProbe();
	} catch {
		return {
			statusCode: 503,
			body: {
				status: 'error',
				timestamp,
				database: {
					status: 'unreachable'
				},
				error: {
					code: 'db_unreachable',
					message: 'Database connection could not be established.'
				}
			}
		};
	}

	if (!probe.isUpToDate) {
		return {
			statusCode: 503,
			body: {
				status: 'error',
				timestamp,
				database: {
					status: 'version_mismatch',
					expected_version: probe.expectedVersion,
					actual_version: probe.actualVersion
				},
				error: {
					code: 'db_version_mismatch',
					message: 'Database schema version does not match the running application.',
					expected_version: probe.expectedVersion,
					actual_version: probe.actualVersion
				}
			}
		};
	}

	return {
		statusCode: 200,
		body: {
			status: 'ok',
			timestamp,
			database: {
				status: 'ok',
				expected_version: probe.expectedVersion,
				actual_version: probe.actualVersion
			}
		}
	};
};

export async function GET() {
	const result = await _evaluateHealth(config.appMode);
	return json(result.body, { status: result.statusCode });
}
