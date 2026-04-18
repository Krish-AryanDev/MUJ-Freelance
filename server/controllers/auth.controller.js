import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import generateOTP from '../utils/generateOTP.js';
import {
	clearAuthCookies,
	generateAccessToken,
	generateRefreshToken,
	setAuthCookies,
	verifyRefreshToken,
} from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const MAX_OTP_ATTEMPTS = Number(process.env.MAX_OTP_ATTEMPTS || 5);

const hashOtp = (otp) => {
	const otpSecret = process.env.OTP_SECRET || 'muj-otp-secret';
	return crypto.createHash('sha256').update(`${otp}.${otpSecret}`).digest('hex');
};

const sanitizeUser = (user) => {
	if (!user) {
		return null;
	}

	const { password, refreshToken, __v, ...safeUser } = user;

	if (Array.isArray(safeUser.roles)) {
		return safeUser;
	}

	if (safeUser.role) {
		return {
			...safeUser,
			roles: [safeUser.role],
		};
	}

	return {
		...safeUser,
		roles: [],
	};
};

const issueAuthTokens = async ({ user, res, updateLastLogin = true }) => {
	const accessToken = generateAccessToken(user);
	const refreshToken = generateRefreshToken(user);

	const update = {
		refreshToken,
	};

	if (updateLastLogin) {
		update.lastLoginAt = new Date();
	}

	await User.findByIdAndUpdate(user._id, update, { new: false });
	setAuthCookies(res, accessToken, refreshToken);

	return { accessToken, refreshToken };
};

const register = asyncHandler(async (req, res) => {
	const { name, email, password } = req.body;

	if (!name || !email || !password) {
		throw new ApiError(400, 'Name, email, and password are required');
	}

	const normalizedEmail = String(email).toLowerCase().trim();
	const existingUser = await User.findOne({ email: normalizedEmail }).lean();

	if (existingUser) {
		throw new ApiError(409, 'User already exists with this email');
	}

	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
	const createdUser = await User.create({
		fullName: String(name).trim(),
		email: normalizedEmail,
		password: hashedPassword,
		roles: ['client', 'freelancer'],
	});

	const user = await User.findById(createdUser._id).select('-password -refreshToken').lean();
	const tokens = await issueAuthTokens({ user: createdUser, res, updateLastLogin: false });

	return res
		.status(201)
		.json(new ApiResponse(201, { user: sanitizeUser(user), ...tokens }, 'User registered successfully'));
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		throw new ApiError(400, 'Email and password are required');
	}

	const normalizedEmail = String(email).toLowerCase().trim();
	const user = await User.findOne({ email: normalizedEmail }).select('+password +refreshToken');

	if (!user) {
		throw new ApiError(401, 'Invalid email or password');
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		throw new ApiError(401, 'Invalid email or password');
	}

	if (user.accountStatus === 'blocked' || user.accountStatus === 'suspended') {
		throw new ApiError(403, 'Your account is currently restricted');
	}

	const tokens = await issueAuthTokens({ user, res, updateLastLogin: true });
	const safeUser = sanitizeUser(user.toObject());

	return res
		.status(200)
		.json(new ApiResponse(200, { user: safeUser, ...tokens }, 'Login successful'));
});

const logout = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(req.user._id, { refreshToken: '' }, { new: false });
	clearAuthCookies(res);

	return res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, 'Refresh token is required');
	}

	const payload = verifyRefreshToken(incomingRefreshToken);
	const user = await User.findById(payload.userId).select('+refreshToken');

	if (!user) {
		throw new ApiError(401, 'Invalid refresh token user');
	}

	if (!user.refreshToken || user.refreshToken !== incomingRefreshToken) {
		throw new ApiError(401, 'Refresh token is invalid or already rotated');
	}

	if (user.accountStatus === 'blocked' || user.accountStatus === 'suspended') {
		throw new ApiError(403, 'Your account is currently restricted');
	}

	const tokens = await issueAuthTokens({ user, res, updateLastLogin: true });
	const safeUser = sanitizeUser(user.toObject());

	return res
		.status(200)
		.json(new ApiResponse(200, { user: safeUser, ...tokens }, 'Access token refreshed'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
	return res.status(200).json(new ApiResponse(200, { user: req.user }, 'Current user fetched'));
});

const becomeFreelancer = asyncHandler(async (req, res) => {
	const updatedUser = await User.findByIdAndUpdate(
		req.user._id,
		{ $addToSet: { roles: 'freelancer' } },
		{ new: true },
	)
		.select('-password -refreshToken')
		.lean();

	return res
		.status(200)
		.json(new ApiResponse(200, { user: updatedUser }, 'Freelancer role enabled successfully'));
});

const sendVerificationOtp = asyncHandler(async (req, res) => {
	const { email } = req.body;

	if (!email) {
		throw new ApiError(400, 'Email is required');
	}

	const normalizedEmail = String(email).toLowerCase().trim();
	const user = await User.findOne({ email: normalizedEmail }).lean();

	if (!user) {
		throw new ApiError(404, 'User not found with this email');
	}

	if (user.isEmailVerified) {
		throw new ApiError(400, 'Email is already verified');
	}

	const otp = generateOTP(6);
	const otpHash = hashOtp(otp);
	const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

	await User.collection.updateOne(
		{ _id: user._id },
		{
			$set: {
				verificationOtpHash: otpHash,
				verificationOtpExpiresAt: otpExpiry,
				verificationOtpAttempts: 0,
				verificationOtpSentAt: new Date(),
			},
		},
	);

	await sendEmail({
		to: normalizedEmail,
		subject: 'MUJ Freelance • Verify your email',
		html: `<p>Your email verification OTP is <b>${otp}</b>.</p><p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
		text: `Your email verification OTP is ${otp}. This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.`,
	});

	const responseData = {
		email: normalizedEmail,
		expiresAt: otpExpiry.toISOString(),
	};

	return res
		.status(200)
		.json(new ApiResponse(200, responseData, 'Verification OTP sent successfully'));
});

const verifyEmailOtp = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;

	if (!email || !otp) {
		throw new ApiError(400, 'Email and OTP are required');
	}

	const normalizedEmail = String(email).toLowerCase().trim();
	const user = await User.findOne({ email: normalizedEmail }).lean();

	if (!user) {
		throw new ApiError(404, 'User not found with this email');
	}

	if (user.isEmailVerified) {
		return res.status(200).json(new ApiResponse(200, { email: normalizedEmail }, 'Email already verified'));
	}

	const otpState = await User.collection.findOne(
		{ _id: user._id },
		{
			projection: {
				verificationOtpHash: 1,
				verificationOtpExpiresAt: 1,
				verificationOtpAttempts: 1,
			},
		},
	);

	if (!otpState?.verificationOtpHash || !otpState?.verificationOtpExpiresAt) {
		throw new ApiError(400, 'No verification OTP found. Please request a new OTP');
	}

	const attempts = Number(otpState.verificationOtpAttempts || 0);
	if (attempts >= MAX_OTP_ATTEMPTS) {
		throw new ApiError(429, 'Maximum OTP attempts exceeded. Please request a new OTP');
	}

	if (new Date(otpState.verificationOtpExpiresAt).getTime() < Date.now()) {
		throw new ApiError(400, 'OTP has expired. Please request a new OTP');
	}

	const providedOtpHash = hashOtp(String(otp).trim());
	if (providedOtpHash !== otpState.verificationOtpHash) {
		await User.collection.updateOne(
			{ _id: user._id },
			{ $inc: { verificationOtpAttempts: 1 } },
		);

		throw new ApiError(401, 'Invalid OTP');
	}

	await User.collection.updateOne(
		{ _id: user._id },
		{
			$set: {
				isEmailVerified: true,
				accountStatus: 'active',
			},
			$unset: {
				verificationOtpHash: '',
				verificationOtpExpiresAt: '',
				verificationOtpAttempts: '',
				verificationOtpSentAt: '',
			},
		},
	);

	const updatedUser = await User.findById(user._id).select('-password -refreshToken').lean();

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				user: updatedUser,
			},
			'Email verified successfully',
		),
	);
});

export {
	becomeFreelancer,
	getCurrentUser,
	login,
	logout,
	refreshAccessToken,
	register,
	sendVerificationOtp,
	verifyEmailOtp,
};

export default {
	register,
	login,
	logout,
	refreshAccessToken,
	getCurrentUser,
	becomeFreelancer,
	sendVerificationOtp,
	verifyEmailOtp,
};

