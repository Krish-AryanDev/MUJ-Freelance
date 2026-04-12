/**
 * Standardized API error class for consistent backend error handling.
 */
class ApiError extends Error {
	constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.success = false;
		this.errors = errors;
		this.data = null;

		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export { ApiError };
export default ApiError;

