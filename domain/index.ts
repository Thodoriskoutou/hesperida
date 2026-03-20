import { lookup, toRegistrableDomain, type BootstrapData } from "rdapper";
import { readFile, writeFile, stat } from 'node:fs/promises';
import { restrictedTLDs } from './constants';
import { type Domain } from './types';
import {DateTime, RecordId, Surreal, Table, type Values} from 'surrealdb';

const host = Bun.argv[2]
const job_id = Bun.argv[3]

if(!host) throw new Error(`Host parameter missing!`);
if(!job_id) throw new Error(`Job ID parameter missing!`);

const domain = toRegistrableDomain(host!);
const tld = domain?.split('.').pop();

if(restrictedTLDs.includes(tld!)) {
    throw new Error(`.${tld} does not offer a public whois service!`);
}

const CACHE_FILE = '/rdap-cache.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getBootstrapData(): Promise<BootstrapData> {
    try {
        // Check if cache file exists and is fresh
        const stats = await stat(CACHE_FILE);
        const age = Date.now() - stats.mtimeMs;

        if (age < CACHE_TTL_MS) {
            const cached = await readFile(CACHE_FILE, 'utf-8');
            return JSON.parse(cached);
        }
    } catch {
        // Cache file doesn't exist or is unreadable, will fetch fresh
    }

    // Fetch fresh data
    const response = await fetch('https://data.iana.org/rdap/dns.json');
    if (!response.ok) {
        throw new Error(`Failed to load bootstrap data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as BootstrapData;

    // Write to cache file
    await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');

    return data;
}

// Use the cached bootstrap data in lookups
const bootstrapData = await getBootstrapData();
const { ok, record, error } = await lookup(domain!, {
    customBootstrapData: bootstrapData
});

if (!ok) throw new Error(error);

const result: Values<Domain> = {
    job: new RecordId('jobs', job_id.split(':')[1]),
    domain: record?.domain ?? null,
    tld: record?.tld ?? null,
    punycodeName: record?.punycodeName ?? null,
    unicodeName: record?.unicodeName ?? null,
    //isRegistered: record?.isRegistered ?? false,
    isIDN: record?.isIDN ?? false,
    registrar: {
        name: record?.registrar?.name ?? null,
        ianaId: record?.registrar?.ianaId ?? null,
        url: record?.registrar?.url ?? null,
        email: record?.registrar?.email ?? null,
        phone: record?.registrar?.phone ?? null
    },
    statuses: Array.isArray(record?.statuses) ? record?.statuses.map(s => s.status.toLowerCase()) : [],
    transferLock: record?.transferLock ?? false,
    creationDate: record?.creationDate ? new DateTime(record?.creationDate): null,
    updatedDate: record?.updatedDate ? new DateTime(record?.updatedDate): null,
    expirationDate: record?.expirationDate ? new DateTime(record?.expirationDate): null,
    //deletionDate: record?.deletionDate ? new DateTime(record?.deletionDate): null,
    dnssecEnabled: record?.dnssec?.enabled ?? false,
    privacyEnabled: record?.privacyEnabled ?? false,
    nameservers: Array.isArray(record?.nameservers) ? [...new Set(record?.nameservers.map(ns => ns.host?.toLowerCase()).filter(Boolean))]: [],
};

if(Bun.env.DEBUG == "true") console.debug(`Domain results for ${job_id} on ${host}: ${JSON.stringify(result)}`);

try {
    const db = new Surreal();

    await db.connect(`${Bun.env.SURREAL_PROTOCOL}://${Bun.env.SURREAL_ADDRESS}/rpc`, {
        namespace: Bun.env.SURREAL_NAMESPACE,
        database: Bun.env.SURREAL_DATABASE,
        authentication: {
            username: Bun.env.SURREAL_USER!,
            password: Bun.env.SURREAL_PASS!
        }
    });

    const domain_results = new Table('domain_results');

    await db.create(domain_results).content<Domain>(result);
    await db.close();
} catch (e) {
    throw `DB Error: ${(e as Error).message}`;
}