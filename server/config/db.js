import mongoose from 'mongoose';

import ApiError from '../utils/ApiError.js';

mongoose.set('strictQuery', true);

const wait = async (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI;

	if (!mongoUri) {
		throw new ApiError(500, 'MONGO_URI is not configured');
	}

	try {
		const connection = await mongoose.connect(mongoUri);

		console.log(`MongoDB connected: ${connection.connection.host}`);
		return connection;
	} catch (error) {
		throw new ApiError(500, 'Failed to connect to MongoDB', [error.message]);
	}
};

const disconnectDB = async () => {
	if (mongoose.connection.readyState === 0) {
		return;
	}

	await mongoose.disconnect();
	console.log('MongoDB disconnected');
};

const connectDBWithRetry = async (options = {}) => {
	const retries = Number(options.retries ?? process.env.DB_CONNECT_RETRIES ?? 5);
	const delayMs = Number(options.delayMs ?? process.env.DB_CONNECT_RETRY_DELAY_MS ?? 3000);

	let lastError;

	for (let attempt = 1; attempt <= retries; attempt += 1) {
		try {
			return await connectDB();
		} catch (error) {
			lastError = error;
			const isLastAttempt = attempt === retries;
			const detail =
				Array.isArray(error?.errors) && error.errors.length > 0
					? ` | details: ${error.errors.join(' | ')}`
					: '';

			console.warn(
				`MongoDB connection attempt ${attempt}/${retries} failed: ${error?.message || error}${detail}`,
			);

			if (!isLastAttempt) {
				await wait(delayMs);
			}
		}
	}

	throw new ApiError(500, `Failed to connect to MongoDB after ${retries} attempts`, [
		lastError?.message || 'Unknown MongoDB connection error',
	]);
};

export { connectDB, connectDBWithRetry, disconnectDB, mongoose };
export default connectDB;

