import jwt from 'jsonwebtoken';

import ApiError from './ApiError.js';

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

const getCookieOptions = (maxAgeMs) => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	maxAge: maxAgeMs,
});

const requireSecret = (secret, name) => {
	if (!secret) {
		throw new ApiError(500, `${name} is not configured`);
	}
};

const buildTokenPayload = (user) => ({
	userId: user._id?.toString?.() || user.id,
	email: user.email,
	roles: user.roles || [],
});

const generateAccessToken = (user) => {
	const secret = process.env.ACCESS_TOKEN_SECRET;
	requireSecret(secret, 'ACCESS_TOKEN_SECRET');

	return jwt.sign(buildTokenPayload(user), secret, {
		expiresIn: ACCESS_TOKEN_EXPIRY,
	});
};

const generateRefreshToken = (user) => {
	const secret = process.env.REFRESH_TOKEN_SECRET;
	requireSecret(secret, 'REFRESH_TOKEN_SECRET');

	return jwt.sign(buildTokenPayload(user), secret, {
		expiresIn: REFRESH_TOKEN_EXPIRY,
	});
};

const verifyAccessToken = (token) => {
	const secret = process.env.ACCESS_TOKEN_SECRET;
	requireSecret(secret, 'ACCESS_TOKEN_SECRET');
	return jwt.verify(token, secret);
};

const verifyRefreshToken = (token) => {
	const secret = process.env.REFRESH_TOKEN_SECRET;
	requireSecret(secret, 'REFRESH_TOKEN_SECRET');
	return jwt.verify(token, secret);
};

const setAuthCookies = (res, accessToken, refreshToken) => {
	const accessTokenCookieOptions = getCookieOptions(15 * 60 * 1000);
	const refreshTokenCookieOptions = getCookieOptions(7 * 24 * 60 * 60 * 1000);

	res.cookie('accessToken', accessToken, accessTokenCookieOptions);
	res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

const clearAuthCookies = (res) => {
	const expiredOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
	};

	res.clearCookie('accessToken', expiredOptions);
	res.clearCookie('refreshToken', expiredOptions);
};

export {
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN_EXPIRY,
	clearAuthCookies,
	generateAccessToken,
	generateRefreshToken,
	setAuthCookies,
	verifyAccessToken,
	verifyRefreshToken,
};

