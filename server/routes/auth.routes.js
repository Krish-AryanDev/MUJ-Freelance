import express from 'express';
import { body, validationResult } from 'express-validator';

import {
	becomeFreelancer,
	getCurrentUser,
	login,
	logout,
	refreshAccessToken,
	register,
	sendVerificationOtp,
	verifyEmailOtp,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

const registerValidation = [
	body('name')
		.trim()
		.notEmpty()
		.withMessage('Name is required')
		.isLength({ min: 2, max: 80 })
		.withMessage('Name is required'),
	body('email')
		.isEmail()
		.withMessage('Valid email is required')
		.normalizeEmail()
		.matches(/@muj\.manipal\.edu$/i)
		.withMessage('Only @muj.manipal.edu emails are allowed'),
	body('password')
		.isString()
		.withMessage('Password is required')
		.isLength({ min: 8 })
		.withMessage('Password must be at least 8 characters long'),
];

const loginValidation = [
	body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
	body('password').isString().withMessage('Password is required').notEmpty(),
];

const sendOtpValidation = [
	body('email')
		.isEmail()
		.withMessage('Valid email is required')
		.normalizeEmail()
		.matches(/@muj\.manipal\.edu$/i)
		.withMessage('Only @muj.manipal.edu emails are allowed'),
];

const verifyOtpValidation = [
	body('email')
		.isEmail()
		.withMessage('Valid email is required')
		.normalizeEmail()
		.matches(/@muj\.manipal\.edu$/i)
		.withMessage('Only @muj.manipal.edu emails are allowed'),
	body('otp')
		.isString()
		.withMessage('OTP is required')
		.trim()
		.matches(/^\d{4,8}$/)
		.withMessage('OTP must be a 4 to 8 digit code'),
];

const validateRequest = (req, _res, next) => {
	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) {
		const errors = validationErrors.array().map((error) => error.msg);
		return next(new ApiError(422, 'Validation failed', errors));
	}

	return next();
};

router.post('/register', authRateLimiter, registerValidation, validateRequest, register);
router.post('/login', authRateLimiter, loginValidation, validateRequest, login);
router.post('/send-verification-otp', authRateLimiter, sendOtpValidation, validateRequest, sendVerificationOtp);
router.post('/verify-email-otp', authRateLimiter, verifyOtpValidation, validateRequest, verifyEmailOtp);
router.post('/logout', requireAuth, logout);
router.post('/refresh-token', authRateLimiter, refreshAccessToken);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/become-freelancer', requireAuth, becomeFreelancer);

export default router;

