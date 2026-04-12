import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/generateToken.js';
import User from '../models/User.model.js';

const getTokenFromRequest = (req) => {
	const authHeader = req.headers.authorization || req.headers.Authorization;

	if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
		return authHeader.slice(7).trim();
	}

	if (req.cookies?.accessToken) {
		return req.cookies.accessToken;
	}

	return null;
};

const requireAuth = async (req, _res, next) => {
	try {
		const token = getTokenFromRequest(req);

		if (!token) {
			throw new ApiError(401, 'Authentication required');
		}

		const decoded = verifyAccessToken(token);
		const tokenUserId = decoded?.id || decoded?.userId;

		if (!tokenUserId) {
			throw new ApiError(401, 'Invalid access token payload');
		}

		const user = await User.findById(tokenUserId)
			.select('-password -refreshToken')
			.lean();

		if (!user) {
			throw new ApiError(401, 'User not found for provided token');
		}

		if (user.accountStatus === 'blocked' || user.accountStatus === 'suspended') {
			throw new ApiError(403, 'Your account is not allowed to access this resource');
		}

		const normalizedRoles = Array.isArray(user.roles)
			? user.roles
			: user.role
				? [user.role]
				: Array.isArray(decoded.roles)
					? decoded.roles
					: [];

		req.user = {
			...user,
			roles: normalizedRoles,
		};

		req.auth = {
			userId: tokenUserId,
			email: decoded.email,
			roles: normalizedRoles,
		};

		return next();
	} catch (error) {
		if (error instanceof ApiError) {
			return next(error);
		}

		return next(new ApiError(401, 'Invalid or expired access token', [error.message]));
	}
};

const optionalAuth = async (req, _res, next) => {
	try {
		const token = getTokenFromRequest(req);

		if (!token) {
			return next();
		}

		const decoded = verifyAccessToken(token);
		const tokenUserId = decoded?.id || decoded?.userId;

		if (!tokenUserId) {
			return next();
		}

		const user = await User.findById(tokenUserId)
			.select('-password -refreshToken')
			.lean();

		if (user) {
			const normalizedRoles = Array.isArray(user.roles)
				? user.roles
				: user.role
					? [user.role]
					: Array.isArray(decoded.roles)
						? decoded.roles
						: [];

			req.user = {
				...user,
				roles: normalizedRoles,
			};
			req.auth = {
				userId: tokenUserId,
				email: decoded.email,
				roles: normalizedRoles,
			};
		}

		return next();
	} catch (_error) {
		return next();
	}
};

export { getTokenFromRequest, optionalAuth, requireAuth };
export default requireAuth;

