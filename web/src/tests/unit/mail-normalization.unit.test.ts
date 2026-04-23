import { describe, expect, test } from 'bun:test';
import { normalizeToolRows } from '../../lib/server/report-normalization';

describe('mail normalization', () => {
	test('maps warnings/errors/syntaxErrors to warn/fail rows', () => {
		const rows = normalizeToolRows('mail', {
			spf: {
				record: 'v=spf1 include:_spf.example.net -all',
				warnings: ['SPF uses ~all'],
				syntaxErrors: ['Invalid SPF mechanism']
			},
			domainAge: {
				errors: ['No RDAP server found for .gr']
			}
		});

		expect(rows.filter((row) => row.status === 'warn').length).toBe(1);
		expect(rows.filter((row) => row.status === 'fail').length).toBe(2);
		expect(rows.some((row) => row.status === 'info')).toBeTrue();
		expect(rows.some((row) => row.group === 'spf' && row.summary === 'SPF uses ~all')).toBeTrue();
		expect(
			rows.some((row) => row.group === 'domainAge' && row.summary === 'No RDAP server found for .gr')
		).toBeTrue();
	});

	test('fills group/check/summary consistently for nested issue arrays and adds contextual value', () => {
		const rows = normalizeToolRows('mail', {
			dkim: {
				selectors: [
					{
						selector: 'mail',
						keyBits: 1024,
						warnings: ['RSA key should be 2048+ bits']
					}
				]
			}
		});

		const warningRow = rows.find((row) => row.status === 'warn');
		expect(warningRow?.group).toBe('dkim');
		expect(warningRow?.check).toContain('selectors');
		expect(warningRow?.check).toContain('warnings');
		expect(warningRow?.summary).toBe('RSA key should be 2048+ bits');
		expect(warningRow?.value).toBe('mail (1024 bits)');
	});

	test('does not produce rows from score.deductions', () => {
		const rows = normalizeToolRows('mail', {
			score: {
				deductions: [
					{
						check: 'dkim',
						points: 2,
						reason: 'DKIM key should be 2048+ bits (1024)'
					}
				]
			},
			dkim: {
				warnings: ['DKIM warning from check output']
			}
		});

		expect(rows.length).toBe(1);
		expect(rows[0]?.summary).toBe('DKIM warning from check output');
		expect(rows.some((row) => row.summary.includes('2048+ bits (1024)'))).toBeFalse();
	});

	test('emits curated evidence as info rows', () => {
		const rows = normalizeToolRows('mail', {
			spf: {
				record: 'v=spf1 include:_spf.example.net -all'
			},
			dkim: {
				selectors: [{ selector: 'mail', keyBits: 1024, valid: true }]
			},
			mx: {
				records: [{ exchange: 'mail.example.org', priority: 10, resolves: true }]
			},
			mxTls: {
				servers: [{ server: 'mail.example.org', supportsStarttls: true, tlsVersions: ['TLSv1.3'] }]
			},
			blacklist: {
				domainChecks: { listed: [] },
				ipChecks: {
					listed: [{ blacklist: 'Composite BL', target: '152.53.16.74', zone: 'example.net' }]
				}
			}
		});

		const infoRows = rows.filter((row) => row.status === 'info');
		expect(infoRows.length).toBeGreaterThan(0);
		expect(infoRows.some((row) => row.group === 'dkim' && row.check === 'selectors')).toBeTrue();
		expect(infoRows.some((row) => row.group === 'mx' && row.check === 'mx records')).toBeTrue();
		expect(infoRows.some((row) => row.group === 'mxTls' && row.check === 'tls servers')).toBeTrue();
		expect(infoRows.some((row) => row.group === 'blacklist' && row.check === 'ip listed')).toBeTrue();
	});

	test('mail row details do not include raw path', () => {
		const rows = normalizeToolRows('mail', {
			spf: {
				record: 'v=spf1 include:_spf.example.net -all',
				warnings: ['SPF warning']
			}
		});

		for (const row of rows) {
			if (!row.details) continue;
			expect('path' in row.details).toBeFalse();
		}
	});
});
