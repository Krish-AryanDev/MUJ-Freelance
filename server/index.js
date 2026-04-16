import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDBWithRetry, disconnectDB, mongoose } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import profileRoutes from './routes/profile.routes.js';
import projectRoutes from './routes/project.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';
import { initSocket } from './config/socket.js';
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const ALLOW_SERVER_WITHOUT_DB = process.env.ALLOW_SERVER_WITHOUT_DB === 'true';

const DB_STATE_MAP = {
	0: 'disconnected',
	1: 'connected',
	2: 'connecting',
	3: 'disconnecting',
};

const RECONNECT_COOLDOWN_MS = 15_000;
let reconnectInProgress = false;
let lastReconnectAttemptAt = 0;

const wait = async (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const waitForDatabaseReady = async (timeoutMs = 4000, intervalMs = 200) => {
	const startedAt = Date.now();

	while (Date.now() - startedAt < timeoutMs) {
		if (mongoose.connection.readyState === 1) {
			return true;
		}

		await wait(intervalMs);
	}

	return mongoose.connection.readyState === 1;
};

const triggerReconnectIfNeeded = () => {
	const now = Date.now();

	if (reconnectInProgress || now - lastReconnectAttemptAt < RECONNECT_COOLDOWN_MS) {
		return;
	}

	reconnectInProgress = true;
	lastReconnectAttemptAt = now;

	void connectDBWithRetry({ retries: 3, delayMs: 2000 })
		.catch((error) => {
			console.warn('Background Mongo reconnect failed:', error?.message || error);
		})
		.finally(() => {
			reconnectInProgress = false;
		});
};

app.set('trust proxy', 1);

app.use(
	cors({
		origin: CLIENT_URL,
		credentials: true,
	}),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 300,
		standardHeaders: true,
		legacyHeaders: false,
	}),
);

app.get('/', (_req, res) => {
	return res
		.status(200)
		.json(new ApiResponse(200, { status: 'OK' }, 'MUJ Freelance API is running 🚀'));
});

app.get('/api/health', (_req, res) => {
	const readyState = mongoose.connection.readyState;

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				uptimeSeconds: process.uptime(),
				timestamp: new Date().toISOString(),
				environment: NODE_ENV,
				database: DB_STATE_MAP[readyState] || 'unknown',
			},
			'Server is healthy',
		),
	);
});

app.use('/api', async (req, _res, next) => {
	if (req.path === '/health') {
		return next();
	}

	if (mongoose.connection.readyState !== 1) {
		triggerReconnectIfNeeded();

		const becameReady = await waitForDatabaseReady(5000, 250);

		if (becameReady) {
			return next();
		}

		return next(
			new ApiError(
				503,
				'Database is currently unavailable. Please check MongoDB connection/whitelist and try again.',
			),
		);
	}

	return next();
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
	try {
		await connectDBWithRetry();
	} catch (error) {
		const canContinueWithoutDB = NODE_ENV === 'development' && ALLOW_SERVER_WITHOUT_DB;

		if (!canContinueWithoutDB) {
			console.error('Database connection failed. Exiting server startup.');
			console.error(error);
			process.exit(1);
		}

		console.warn(
			'Database connection failed in development mode. Continuing because ALLOW_SERVER_WITHOUT_DB=true.',
		);
		console.warn(error?.message || error);
	}

	await connectRedis();

	initSocket(server);

	server.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
};

const shutdownServer = async (signal) => {
	console.log(`Received ${signal}. Shutting down gracefully...`);

	server.close(async () => {
		try {
			await disconnectRedis();
			await disconnectDB();
			console.log('HTTP server closed.');
			process.exit(0);
		} catch (error) {
			console.error('Error during shutdown:', error);
			process.exit(1);
		}
	});
};

process.on('SIGINT', () => {
	void shutdownServer('SIGINT');
});

process.on('SIGTERM', () => {
	void shutdownServer('SIGTERM');
});

startServer();

