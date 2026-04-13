import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface Device {
	name: string;
	resolution: string;
	isMobile: boolean;
}

interface PlaywrightDeviceDescriptor {
	viewport?: {
		width?: number;
		height?: number;
	};
	isMobile?: boolean;
}

const DEVICES_SOURCE_URL =
	'https://raw.githubusercontent.com/microsoft/playwright/refs/heads/main/packages/playwright-core/src/server/deviceDescriptorsSource.json';
const DEVICES_ASSET_DIR_CANDIDATES = [
	resolve(process.cwd(), 'src/lib/assets'),
	resolve(process.cwd(), 'lib/assets')
];
const DEVICES_FILE_NAME = 'playwright-devices.json';
const FALLBACK_DEVICES: Device[] = [{ name: 'Desktop Chrome', resolution: '1280x720', isMobile: false }];

let devicesCache: Device[] | null = null;
let loadPromise: Promise<Device[]> | null = null;
let resolvedDevicesFilePath: string | null = null;

const parseDevices = (raw: Record<string, PlaywrightDeviceDescriptor>): Device[] => {
	const devices: Device[] = [];
	for (const [name, descriptor] of Object.entries(raw)) {
		const width = Number(descriptor?.viewport?.width ?? 0);
		const height = Number(descriptor?.viewport?.height ?? 0);
		if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;

		devices.push({
			name,
			resolution: `${width}x${height}`,
			isMobile: Boolean(descriptor?.isMobile)
		});
	}
	return devices;
};

const resolveDevicesFilePath = async (): Promise<string> => {
	if (resolvedDevicesFilePath) return resolvedDevicesFilePath;

	for (const directory of DEVICES_ASSET_DIR_CANDIDATES) {
		try {
			await access(directory, fsConstants.F_OK);
			resolvedDevicesFilePath = resolve(directory, DEVICES_FILE_NAME);
			return resolvedDevicesFilePath;
		} catch {
			// keep checking next candidate
		}
	}

	// fallback to first candidate and create it
	await mkdir(DEVICES_ASSET_DIR_CANDIDATES[0], { recursive: true });
	resolvedDevicesFilePath = resolve(DEVICES_ASSET_DIR_CANDIDATES[0], DEVICES_FILE_NAME);
	return resolvedDevicesFilePath;
};

const readDevicesFile = async (filePath: string): Promise<Record<string, PlaywrightDeviceDescriptor>> => {
	const content = await readFile(filePath, 'utf8');
	return JSON.parse(content) as Record<string, PlaywrightDeviceDescriptor>;
};

const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		await access(filePath, fsConstants.F_OK);
		return true;
	} catch {
		return false;
	}
};

const downloadDevicesFile = async (filePath: string): Promise<Record<string, PlaywrightDeviceDescriptor>> => {
	const response = await fetch(DEVICES_SOURCE_URL);
	if (!response.ok) {
		throw new Error(`Failed to download Playwright devices list: ${response.status} ${response.statusText}`);
	}

	const payload = (await response.json()) as Record<string, PlaywrightDeviceDescriptor>;
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
	return payload;
};

const loadDevices = async (): Promise<Device[]> => {
	if (devicesCache) return devicesCache;
	const filePath = await resolveDevicesFilePath();

	let source: Record<string, PlaywrightDeviceDescriptor> | null = null;
	try {
		source = (await fileExists(filePath)) ? await readDevicesFile(filePath) : await downloadDevicesFile(filePath);
	} catch {
		source = null;
	}

	const parsed = source ? parseDevices(source) : FALLBACK_DEVICES;
	devicesCache = parsed;
	return parsed;
};

export const getPlaywrightDevices = async (): Promise<Device[]> => {
	if (devicesCache) return devicesCache;
	if (!loadPromise) {
		loadPromise = loadDevices().finally(() => {
			loadPromise = null;
		});
	}
	return loadPromise;
};

export const warmPlaywrightDevicesCache = (): void => {
	// fire-and-forget preload; request path can still await getPlaywrightDevices if needed
	void getPlaywrightDevices().catch((error) => {
		console.warn('[web] playwright devices cache warmup failed:', error instanceof Error ? error.message : String(error));
	});
};
