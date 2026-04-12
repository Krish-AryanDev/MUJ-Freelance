import rateLimit from 'express-rate-limit';

const buildRateLimitHandler = (message) => (req, res, _next, options) => {
	return res.status(options.statusCode).json({
		success: false,
		statusCode: options.statusCode,
		message,
		errors: [`Try again in ${Math.ceil(options.windowMs / 1000)} seconds`],
		path: req.originalUrl,
	});
};

const createRateLimiter = ({
	windowMs,
	max,
	message,
	standardHeaders = true,
	legacyHeaders = false,
}) => {
	return rateLimit({
		windowMs,
		max,
		standardHeaders,
		legacyHeaders,
		handler: buildRateLimitHandler(message),
	});
};

const apiRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000,
	max: 300,
	message: 'Too many requests from this IP',
});

const authRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000,
	max: 30,
	message: 'Too many authentication attempts',
});

const uploadRateLimiter = createRateLimiter({
	windowMs: 10 * 60 * 1000,
	max: 50,
	message: 'Too many upload requests',
});

export { apiRateLimiter, authRateLimiter, createRateLimiter, uploadRateLimiter };
export default apiRateLimiter;

