export type MailIssueStatus = 'warn' | 'fail' | 'info';

export type MailIssueRow = {
	id: string;
	group: string;
	check: string;
	status: MailIssueStatus;
	value?: string;
	summary: string;
	details?: Record<string, unknown>;
};

const ISSUE_KEYS = new Set(['warnings', 'errors', 'syntaxErrors']);
const METADATA_ROOT_KEYS = new Set(['domain', 'checkedAt', 'duration', 'options', 'score']);

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown, fallback = ''): string => {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return fallback;
};

const cleanText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const isIndexToken = (value: string): boolean => /^\d+$/.test(value);

const humanizeToken = (value: string): string =>
	value
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase();

const summarizeIssue = (value: unknown): string => {
	if (typeof value === 'string') return cleanText(value) || 'Issue reported';
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);

	try {
		const serialized = JSON.stringify(value);
		if (!serialized) return 'Issue reported';
		return serialized.length > 240 ? `${serialized.slice(0, 240)}...` : serialized;
	} catch {
		return 'Issue reported';
	}
};

const truncate = (value: string, max = 180): string =>
	value.length > max ? `${value.slice(0, max)}...` : value;

const formatArrayValue = (items: unknown[], max = 3): string => {
	const normalized = items
		.map((item) => asString(item).trim())
		.filter((item) => item.length > 0);
	if (!normalized.length) return '';
	if (normalized.length <= max) return normalized.join(', ');
	return `${normalized.slice(0, max).join(', ')} (+${normalized.length - max})`;
};

const formatValue = (value: unknown): string => {
	if (value === null || value === undefined) return '';
	if (typeof value === 'string') return truncate(cleanText(value));
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) return truncate(formatArrayValue(value));

	try {
		const serialized = JSON.stringify(value);
		return serialized ? truncate(serialized) : '';
	} catch {
		return '';
	}
};

const pickContextValue = (context: Record<string, unknown>): string => {
	for (const key of ['record', 'selector', 'server', 'exchange', 'ip', 'target', 'policy', 'source']) {
		const formatted = formatValue(context[key]);
		if (formatted.length > 0) return formatted;
	}
	for (const key of ['records', 'tlsVersions', 'ipv4Addresses', 'ipv6Addresses']) {
		const formatted = formatValue(context[key]);
		if (formatted.length > 0) return formatted;
	}
	return '';
};

const buildIssueValue = (group: string, context: Record<string, unknown>): string => {
	if (group === 'dkim') {
		const selector = asString(context.selector).trim();
		const bits = context.keyBits;
		if (selector.length > 0 && typeof bits === 'number' && Number.isFinite(bits)) {
			return `${selector} (${bits} bits)`;
		}
		if (selector.length > 0) return selector;
	}

	if (group === 'reverseDns') {
		const ip = asString(context.ip).trim();
		const ptr = asString(context.ptrHostname).trim();
		if (ip && ptr) return `${ip} -> ${ptr}`;
		if (ip) return ip;
	}

	if (group === 'blacklist') {
		const blacklist = asString(context.blacklist).trim();
		const target = asString(context.target).trim();
		if (blacklist && target) return `${blacklist} (${target})`;
		if (blacklist) return blacklist;
	}

	return pickContextValue(context);
};

const buildIssueDetails = (
	issueType: string,
	context: Record<string, unknown>
): Record<string, unknown> | undefined => {
	const details: Record<string, unknown> = { issue_type: issueType };

	for (const key of [
		'selector',
		'server',
		'exchange',
		'ip',
		'target',
		'blacklist',
		'policy',
		'keyBits',
		'keyType',
		'priority',
		'source',
		'valid',
		'connected',
		'resolves'
	]) {
		const value = context[key];
		if (value === null || value === undefined) continue;
		if (typeof value === 'string' && value.trim().length === 0) continue;
		details[key] = value;
	}

	return Object.keys(details).length > 0 ? details : undefined;
};

const resolveGroup = (path: string[]): string => {
	const root = path.find((token) => !isIndexToken(token));
	if (!root || METADATA_ROOT_KEYS.has(root)) return 'mail';
	return root;
};

const resolveCheck = (path: string[], fallbackKey: string): string => {
	const group = resolveGroup(path);
	const relevantPath =
		group === 'mail'
			? path.filter((token) => !isIndexToken(token))
			: path.slice(1).filter((token) => !isIndexToken(token));

	if (relevantPath.length === 0) return humanizeToken(fallbackKey);
	return relevantPath.map((token) => humanizeToken(token)).join(' / ');
};

const pushInfoRow = (
	rows: MailIssueRow[],
	sequenceRef: { current: number },
	params: Omit<MailIssueRow, 'id' | 'status'> & { status?: MailIssueStatus }
): void => {
	const status = params.status ?? 'info';
	rows.push({
		id: `mail:${params.group}:${params.check}:${status}:${sequenceRef.current++}`,
		...params,
		status
	});
};

const extractCuratedInfoRows = (
	raw: Record<string, unknown>,
	rows: MailIssueRow[],
	sequenceRef: { current: number }
): void => {
	const spf = asRecord(raw.spf);
	const spfRecord = formatValue(spf.record);
	if (spfRecord.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'spf',
			check: 'record',
			value: spfRecord,
			summary: 'SPF record detected for the domain.'
		});
	}
	const spfRecords = formatValue(spf.records);
	if (spfRecords.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'spf',
			check: 'records',
			value: spfRecords,
			summary: 'SPF records discovered during DNS resolution.'
		});
	}

	const dkim = asRecord(raw.dkim);
	asArray(dkim.selectors).forEach((selectorValue) => {
		const selector = asRecord(selectorValue);
		const selectorName = asString(selector.selector, 'selector').trim();
		const keyBits =
			typeof selector.keyBits === 'number' && Number.isFinite(selector.keyBits)
				? `${selector.keyBits} bits`
				: '';
		pushInfoRow(rows, sequenceRef, {
			group: 'dkim',
			check: 'selectors',
			value: keyBits.length > 0 ? `${selectorName} (${keyBits})` : selectorName,
			summary: `DKIM selector ${selectorName} was discovered and inspected.`,
			details: {
				valid: selector.valid,
				key_type: selector.keyType,
				key_bits: selector.keyBits,
				hash_algorithms: selector.hashAlgorithms,
				service_types: selector.serviceTypes
			}
		});
	});

	const mx = asRecord(raw.mx);
	asArray(mx.records).forEach((recordValue) => {
		const record = asRecord(recordValue);
		const exchange = asString(record.exchange).trim();
		if (!exchange.length) return;
		pushInfoRow(rows, sequenceRef, {
			group: 'mx',
			check: 'mx records',
			value: exchange,
			summary: 'MX host advertised for inbound mail handling.',
			details: {
				priority: record.priority,
				resolves: record.resolves,
				ipv4: record.ipv4Addresses,
				ipv6: record.ipv6Addresses
			}
		});
	});

	const mxTls = asRecord(raw.mxTls);
	asArray(mxTls.servers).forEach((serverValue) => {
		const server = asRecord(serverValue);
		const serverName = asString(server.server).trim();
		if (!serverName.length) return;
		pushInfoRow(rows, sequenceRef, {
			group: 'mxTls',
			check: 'tls servers',
			value: serverName,
			summary: 'TLS capability discovered on MX endpoint.',
			details: {
				supports_starttls: server.supportsStarttls,
				preferred_tls_version: server.preferredTlsVersion,
				tls_versions: server.tlsVersions
			}
		});
	});

	const reverseDns = asRecord(raw.reverseDns);
	asArray(reverseDns.results).forEach((resultValue) => {
		const result = asRecord(resultValue);
		const ip = asString(result.ip).trim();
		if (!ip.length) return;
		const ptr = asString(result.ptrHostname).trim();
		pushInfoRow(rows, sequenceRef, {
			group: 'reverseDns',
			check: 'ptr results',
			value: ptr.length > 0 ? `${ip} -> ${ptr}` : ip,
			summary: 'Reverse DNS observation for MX IP address.',
			details: {
				forward_confirms: result.forwardConfirms,
				matches_domain: result.matchesDomain
			}
		});
	});

	const ipv6 = asRecord(raw.ipv6);
	asArray(ipv6.mxIpv6Addresses).forEach((entryValue) => {
		const entry = asRecord(entryValue);
		const mxHost = asString(entry.mx).trim();
		if (!mxHost.length) return;
		pushInfoRow(rows, sequenceRef, {
			group: 'ipv6',
			check: 'mx ipv6 addresses',
			value: mxHost,
			summary: 'IPv6-capable MX host discovered.',
			details: {
				addresses: entry.addresses
			}
		});
	});

	const blacklist = asRecord(raw.blacklist);
	const domainChecks = asRecord(blacklist.domainChecks);
	asArray(domainChecks.listed).forEach((listingValue) => {
		const listing = asRecord(listingValue);
		const blacklistName = asString(listing.blacklist).trim();
		const target = asString(listing.target).trim();
		pushInfoRow(rows, sequenceRef, {
			group: 'blacklist',
			check: 'domain listed',
			value: blacklistName && target ? `${blacklistName} (${target})` : blacklistName || target,
			summary: 'Domain listing detected during blacklist checks.',
			details: {
				zone: listing.zone,
				priority: listing.priority,
				return_code: listing.returnCode
			}
		});
	});

	const ipChecks = asRecord(blacklist.ipChecks);
	asArray(ipChecks.listed).forEach((listingValue) => {
		const listing = asRecord(listingValue);
		const blacklistName = asString(listing.blacklist).trim();
		const target = asString(listing.target).trim();
		pushInfoRow(rows, sequenceRef, {
			group: 'blacklist',
			check: 'ip listed',
			value: blacklistName && target ? `${blacklistName} (${target})` : blacklistName || target,
			summary: 'IP listing detected during blacklist checks.',
			details: {
				zone: listing.zone,
				priority: listing.priority,
				return_code: listing.returnCode
			}
		});
	});

	const mtaSts = asRecord(raw.mtaSts);
	const mtaPolicy = asRecord(mtaSts.policy);
	const mtaMode = asString(mtaPolicy.mode).trim();
	if (mtaMode.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'mtaSts',
			check: 'policy',
			value: mtaMode,
			summary: 'MTA-STS policy mode discovered.',
			details: {
				max_age: mtaPolicy.maxAge,
				mx_patterns: mtaPolicy.mxPatterns
			}
		});
	}
	const policyUrl = asString(mtaSts.policyUrl).trim();
	if (policyUrl.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'mtaSts',
			check: 'policy url',
			value: policyUrl,
			summary: 'MTA-STS policy endpoint published.'
		});
	}

	const tlsRpt = asRecord(raw.tlsRpt);
	const tlsRptRecord = asString(tlsRpt.record).trim();
	if (tlsRptRecord.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'tlsRpt',
			check: 'record',
			value: tlsRptRecord,
			summary: 'TLS-RPT DNS record discovered.'
		});
	}
	const reportingUris = formatValue(tlsRpt.reportingUris);
	if (reportingUris.length > 0) {
		pushInfoRow(rows, sequenceRef, {
			group: 'tlsRpt',
			check: 'reporting uris',
			value: reportingUris,
			summary: 'TLS-RPT reporting destinations configured.'
		});
	}

	const caa = asRecord(raw.caa);
	asArray(caa.records).forEach((recordValue) => {
		const record = asRecord(recordValue);
		const tag = asString(record.tag).trim();
		const value = asString(record.value).trim();
		if (!tag.length && !value.length) return;
		pushInfoRow(rows, sequenceRef, {
			group: 'caa',
			check: 'records',
			value: tag && value ? `${tag}=${value}` : tag || value,
			summary: 'CAA record restricting certificate issuance.'
		});
	});

	const dnssec = asRecord(raw.dnssec);
	asArray(dnssec.chainOfTrust).forEach((entryValue) => {
		const entry = asRecord(entryValue);
		const domain = asString(entry.domain).trim();
		if (!domain.length) return;
		pushInfoRow(rows, sequenceRef, {
			group: 'dnssec',
			check: 'chain of trust',
			value: domain,
			summary: 'DNSSEC chain-of-trust node evaluated.',
			details: {
				has_ds: entry.hasDs,
				has_dnskey: entry.hasDnskey,
				has_rrsig: entry.hasRrsig,
				valid: entry.valid
			}
		});
	});
};

export const collectMailIssues = (raw: unknown): MailIssueRow[] => {
	const rows: MailIssueRow[] = [];
	const sequenceRef = { current: 0 };

	const visit = (node: unknown, path: string[]): void => {
		if (Array.isArray(node)) {
			node.forEach((item, index) => visit(item, [...path, String(index)]));
			return;
		}

		const record = asRecord(node);
		for (const [key, value] of Object.entries(record)) {
			const nextPath = [...path, key];

			if (ISSUE_KEYS.has(key) && Array.isArray(value)) {
				const status: MailIssueStatus = key === 'warnings' ? 'warn' : 'fail';
				const group = resolveGroup(nextPath);
				const check = resolveCheck(nextPath, key);

				asArray(value).forEach((entry, index) => {
					rows.push({
						id: `mail:${group}:${check}:${status}:${index}:${sequenceRef.current++}`,
						group,
						check,
						status,
						value: buildIssueValue(group, record),
						summary: summarizeIssue(entry),
						details: buildIssueDetails(key, record)
					});
				});
			}

			visit(value, nextPath);
		}
	};

	visit(raw, []);
	extractCuratedInfoRows(asRecord(raw), rows, sequenceRef);
	return rows;
};
