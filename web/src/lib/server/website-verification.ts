import { toRegistrableDomain } from 'rdapper';
import { DateTime, RecordId } from 'surrealdb';
import { queryOne, withAdminDb } from '$lib/server/db';
import type { Website, WebsiteVerification } from '$lib/types';

type VerificationMethod = 'cache' | 'dns' | 'http' | 'none';

type VerificationResult = {
	verified: boolean;
	method: VerificationMethod;
	txtHost: string;
	txtValue: string;
	httpUrl: string;
	errors?: string[];
	verification_method?: 'dns' | 'file' | null;
};

const cleanTxtValue = (value: string): string => value.replace(/^"+|"+$/g, '').replace(/\\"/g, '"').trim();

export const generateWebsiteVerificationCode = (): string =>
	crypto.randomUUID().replace(/-/g, '').toLowerCase();

export const isWebsiteVerificationFresh = (
	verifiedAt: DateTime | null | undefined
): boolean => Boolean(verifiedAt);

const checkDnsTxt = async (txtHost: string, code: string): Promise<{ ok: boolean; error?: string }> => {
	try {
		const response = await fetch(
			`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(txtHost)}&type=TXT`,
			{
				headers: {
					accept: 'application/dns-json'
				}
			}
		);
		if (!response.ok) {
			return { ok: false, error: `DNS lookup failed with HTTP ${response.status}` };
		}
		const payload = (await response.json()) as { Answer?: Array<{ data?: string }> };
		const answers = Array.isArray(payload.Answer) ? payload.Answer : [];
		const values = answers
			.map((entry) => (typeof entry?.data === 'string' ? cleanTxtValue(entry.data) : ''))
			.filter(Boolean);
		return { ok: values.includes(code) };
	} catch (error) {
		return { ok: false, error: (error as Error).message };
	}
};

const checkHttpFile = async (httpUrl: string): Promise<{ ok: boolean; error?: string }> => {
	try {
		const response = await fetch(httpUrl, { method: 'GET' });
		return { ok: response.status === 200, error: response.status === 200 ? undefined : `HTTP ${response.status}` };
	} catch (error) {
		return { ok: false, error: (error as Error).message };
	}
};

const updateWebsiteVerificationDate = async (
	id: RecordId,
	isValid: boolean,
	method?: 'dns' | 'file'
): Promise<{ ok: boolean; error?: string }> => {
	const refreshed = await withAdminDb((db) =>
		queryOne<WebsiteVerification>(
			db,
			isValid
				? 'UPDATE website_verifications SET verified_at = time::now(), verification_method = $method WHERE id = $id RETURN id, verification_code, verified_at, verification_method;'
				: 'UPDATE website_verifications SET verified_at = NONE WHERE id = $id RETURN id, verification_code, verified_at, verification_method;',
			{ id, method }
		)
	);
	if (!refreshed) {
		return { ok: false, error: 'Unable to persist verification date.' };
	}
	return { ok: true };
};

export const ensureWebsiteVerification = async (
	website: Website,
	group: string
): Promise<WebsiteVerification | null> => {
	if (website.verification_id) {
		const existing = await withAdminDb((db) =>
			queryOne<WebsiteVerification>(
				db,
				'SELECT * FROM website_verifications WHERE id = $id LIMIT 1;',
				{ id: website.verification_id }
			)
		);
		return existing ?? null;
	}

	let parsed: URL;
	try {
		parsed = new URL(website.url);
	} catch {
		return null;
	}
	const registrableDomain = toRegistrableDomain(parsed.hostname);
	if (!registrableDomain && !parsed.hostname.endsWith('example.test')) {
		return null;
	}
	const domain = registrableDomain ?? parsed.hostname;

	const existing = await withAdminDb((db) =>
		queryOne<WebsiteVerification>(
			db,
			'SELECT * FROM website_verifications WHERE `group` = $group AND registrable_domain = $domain LIMIT 1;',
			{ group, domain }
		)
	);
	if (existing) {
		await withAdminDb((db) =>
			queryOne<Website>(
				db,
				'UPDATE websites SET verification_id = $verificationId WHERE id = $id RETURN id;',
				{ id: website.id, verificationId: existing.id }
			)
		);
		return existing;
	}

	const created = await withAdminDb((db) =>
		queryOne<WebsiteVerification>(
			db,
			'CREATE website_verifications CONTENT { `group`: $group, registrable_domain: $domain, verification_code: $code, verified_at: NONE } RETURN AFTER;',
			{ group, domain, code: generateWebsiteVerificationCode() }
		)
	);
	if (!created) return null;

	await withAdminDb((db) =>
		queryOne<Website>(
			db,
			'UPDATE websites SET verification_id = $verificationId WHERE id = $id RETURN id;',
			{ id: website.id, verificationId: created.id }
		)
	);
	return created;
};

export const verifyWebsiteOwnership = async (
	website: Website,
	group: string,
	skipCache: boolean = false
): Promise<VerificationResult> => {
	const verifyResult: VerificationResult = {
		verified: false,
		method: 'none',
		txtValue: '',
		txtHost: '',
		httpUrl: '',
		errors: []
	};

	const verification = await ensureWebsiteVerification(website, group);
	if (!verification) {
		verifyResult.errors?.push('Unable to load verification record.');
		return verifyResult;
	}
	verifyResult.txtValue = verification.verification_code;

	let parsed: URL;
	try {
		parsed = new URL(website.url);
	} catch (e) {
		verifyResult.errors?.push((e as Error).message);
		return verifyResult;
	}
	verifyResult.httpUrl = `${parsed.origin}/hesperida-${verifyResult.txtValue}.txt`;
	const registrableDomain = toRegistrableDomain(parsed.hostname);
	if (!registrableDomain && !parsed.hostname.endsWith('example.test')) {
		verifyResult.errors?.push('Invalid Domain.');
		return verifyResult;
	}

	verifyResult.txtHost = `hesperida.${registrableDomain ?? parsed.hostname}`.toLowerCase();
	if (!skipCache) {
		const cached = isWebsiteVerificationFresh(verification.verified_at);
		if (cached) {
			verifyResult.method = 'cache';
			verifyResult.verified = true;
			verifyResult.verification_method = verification.verification_method ?? null;
			return verifyResult;
		}
	}

	const dns = await checkDnsTxt(verifyResult.txtHost, verifyResult.txtValue);
	let updateResult = await updateWebsiteVerificationDate(verification.id!, dns.ok, 'dns');
	if (!updateResult.ok) {
		verifyResult.errors?.push(updateResult.error!);
		return verifyResult;
	}
	if (dns.ok) {
		verifyResult.method = 'dns';
		verifyResult.verified = true;
		verifyResult.verification_method = 'dns';
		return verifyResult;
	}
	if (dns.error) verifyResult.errors?.push(dns.error);

	const http = await checkHttpFile(verifyResult.httpUrl);
	updateResult = await updateWebsiteVerificationDate(verification.id!, http.ok, 'file');
	if (!updateResult.ok) {
		verifyResult.errors?.push(updateResult.error!);
		return verifyResult;
	}
	if (http.ok) {
		verifyResult.method = 'http';
		verifyResult.verified = true;
		verifyResult.verification_method = 'file';
		return verifyResult;
	}
	if (http.error) verifyResult.errors?.push(http.error);

	return verifyResult;
};
