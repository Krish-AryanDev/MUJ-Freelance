/**
 * Standardized API success response class for all controllers.
 */
class ApiResponse {
	constructor(statusCode, data, message = 'Success', meta = undefined) {
		this.success = true;
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;

		if (meta !== undefined) {
			this.meta = meta;
		}
	}
}

export { ApiResponse };
export default ApiResponse;

