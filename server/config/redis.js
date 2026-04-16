import Redis from 'ioredis';

let redisClient = null;
let cacheEnabled = false;

const createRedisClient = () => {
	const redisUrl = process.env.REDIS_URL || '';

	if (!redisUrl) {
		console.warn('REDIS_URL is not set. Redis cache is disabled.');
		return null;
	}

	return new Redis(redisUrl, {
		lazyConnect: true,
		enableReadyCheck: true,
		maxRetriesPerRequest: 1,
		retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
	});
};

const connectRedis = async () => {
	if (redisClient && cacheEnabled) {
		return true;
	}

	if (!redisClient) {
		redisClient = createRedisClient();
	}

	if (!redisClient) {
		cacheEnabled = false;
		return false;
	}

	redisClient.on('error', (error) => {
		cacheEnabled = false;
		console.warn(`Redis error: ${error?.message || error}`);
	});

	redisClient.on('ready', () => {
		cacheEnabled = true;
	});

	redisClient.on('end', () => {
		cacheEnabled = false;
	});

	try {
		await redisClient.connect();
		cacheEnabled = true;
		console.log('Redis connected');
		return true;
	} catch (error) {
		cacheEnabled = false;
		console.warn(`Redis connection failed: ${error?.message || error}`);
		return false;
	}
};

const disconnectRedis = async () => {
	if (!redisClient) {
		return;
	}

	try {
		if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
			await redisClient.quit();
		}
	} catch (_error) {
		await redisClient.disconnect();
	} finally {
		cacheEnabled = false;
		redisClient = null;
	}
};

const getRedisClient = () => {
	if (!redisClient || !cacheEnabled) {
		return null;
	}

	return redisClient;
};

const isRedisReady = () => cacheEnabled && Boolean(redisClient);

export { connectRedis, disconnectRedis, getRedisClient, isRedisReady };

export default {
	connectRedis,
	disconnectRedis,
	getRedisClient,
	isRedisReady,
};
