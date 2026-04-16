import { getRedisClient, isRedisReady } from '../config/redis.js';

const CACHE_PREFIX = 'muj:cache';

const stableSort = (value) => {
	if (Array.isArray(value)) {
		return value.map((item) => stableSort(item));
	}

	if (value && typeof value === 'object') {
		return Object.keys(value)
			.sort()
			.reduce((acc, key) => {
				acc[key] = stableSort(value[key]);
				return acc;
			}, {});
	}

	return value;
};

const serialize = (value) => {
	try {
		return JSON.stringify(stableSort(value));
	} catch (_error) {
		return String(value);
	}
};

const buildCacheKey = (namespace, payload = undefined) => {
	if (payload === undefined) {
		return `${CACHE_PREFIX}:${namespace}`;
	}

	return `${CACHE_PREFIX}:${namespace}:${serialize(payload)}`;
};

const getCachedJson = async (key) => {
	if (!isRedisReady()) {
		return null;
	}

	const client = getRedisClient();
	if (!client) {
		return null;
	}

	try {
		const value = await client.get(key);
		if (!value) {
			return null;
		}

		return JSON.parse(value);
	} catch (_error) {
		return null;
	}
};

const setCachedJson = async (key, value, ttlSeconds) => {
	if (!isRedisReady()) {
		return false;
	}

	const client = getRedisClient();
	if (!client) {
		return false;
	}

	try {
		const payload = JSON.stringify(value);
		if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
			await client.set(key, payload, 'EX', ttlSeconds);
		} else {
			await client.set(key, payload);
		}

		return true;
	} catch (_error) {
		return false;
	}
};

const deleteCacheKey = async (key) => {
	if (!isRedisReady()) {
		return 0;
	}

	const client = getRedisClient();
	if (!client) {
		return 0;
	}

	try {
		return await client.del(key);
	} catch (_error) {
		return 0;
	}
};

const deleteCacheByPattern = async (pattern) => {
	if (!isRedisReady()) {
		return 0;
	}

	const client = getRedisClient();
	if (!client) {
		return 0;
	}

	let cursor = '0';
	let deleted = 0;

	try {
		do {
			const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;

			if (Array.isArray(keys) && keys.length > 0) {
				deleted += await client.del(...keys);
			}
		} while (cursor !== '0');
	} catch (_error) {
		return deleted;
	}

	return deleted;
};

export {
	buildCacheKey,
	getCachedJson,
	setCachedJson,
	deleteCacheKey,
	deleteCacheByPattern,
};

export default {
	buildCacheKey,
	getCachedJson,
	setCachedJson,
	deleteCacheKey,
	deleteCacheByPattern,
};
