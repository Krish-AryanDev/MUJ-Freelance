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
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import gigRoutes from './routes/gig.routes.js';
import orderRoutes from './routes/order.routes.js';
import projectRoutes from './routes/project.routes.js';
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

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/orders', orderRoutes);
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

	initSocket(server);

	server.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
};

const shutdownServer = async (signal) => {
	console.log(`Received ${signal}. Shutting down gracefully...`);

	server.close(async () => {
		try {
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

