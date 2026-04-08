const WINDOW_MS = 60_000;
const MAX_AUTH_REQUESTS = 30;

type Bucket = {
	count: number;
	resetAt: number;
};

const buckets = new Map<string, Bucket>();

export const checkAuthRateLimit = (identity: string): { allowed: boolean; retryAfterSec: number } => {
	const now = Date.now();
	const current = buckets.get(identity);

	if (!current || current.resetAt <= now) {
		buckets.set(identity, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true, retryAfterSec: Math.ceil(WINDOW_MS / 1000) };
	}

	if (current.count >= MAX_AUTH_REQUESTS) {
		return {
			allowed: false,
			retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
		};
	}

	current.count += 1;
	buckets.set(identity, current);
	return { allowed: true, retryAfterSec: Math.ceil((current.resetAt - now) / 1000) };
};
