import multer from 'multer';

import ApiError from '../utils/ApiError.js';

const asyncHandler = (handler) => (req, res, next) => {
	Promise.resolve(handler(req, res, next)).catch(next);
};

const notFoundHandler = (req, _res, next) => {
	next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const normalizeError = (error) => {
	if (error instanceof ApiError) {
		return error;
	}

	if (error instanceof multer.MulterError) {
		return new ApiError(400, error.message, [error.code]);
	}

	if (error?.name === 'ValidationError') {
		const messages = Object.values(error.errors || {}).map((entry) => entry.message);
		return new ApiError(422, 'Validation failed', messages);
	}

	if (error?.name === 'CastError') {
		return new ApiError(400, `Invalid ${error.path}: ${error.value}`);
	}

	if (error?.code === 11000) {
		const fields = Object.keys(error.keyPattern || {});
		return new ApiError(409, 'Duplicate value detected', fields);
	}

	if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
		return new ApiError(401, 'Invalid or expired token');
	}

	return new ApiError(500, error?.message || 'Internal server error');
};

const errorHandler = (error, _req, res, next) => {
	if (res.headersSent) {
		return next(error);
	}

	const normalizedError = normalizeError(error);

	if (process.env.NODE_ENV !== 'production') {
		console.error(normalizedError);
	}

	return res.status(normalizedError.statusCode).json({
		success: false,
		statusCode: normalizedError.statusCode,
		message: normalizedError.message,
		errors: normalizedError.errors,
		...(process.env.NODE_ENV !== 'production' ? { stack: normalizedError.stack } : {}),
	});
};

export { asyncHandler, errorHandler, notFoundHandler, normalizeError };
export default errorHandler;

