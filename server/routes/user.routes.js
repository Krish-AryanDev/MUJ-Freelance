import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

import {
	getMyProfile,
	getUserPublicProfile,
	listUsersForAdmin,
	updateMyProfile,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

const validateRequest = (req, _res, next) => {
	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) {
		const errors = validationErrors.array().map((error) => error.msg);
		return next(new ApiError(422, 'Validation failed', errors));
	}

	return next();
};

const updateProfileValidation = [
	body('fullName')
		.optional()
		.isString()
		.withMessage('Full name must be a string')
		.trim()
		.isLength({ min: 2, max: 80 })
		.withMessage('Full name must be between 2 and 80 characters'),
	body('avatarUrl')
		.optional({ nullable: true })
		.isString()
		.withMessage('Avatar URL must be a string')
		.trim()
		.isLength({ max: 500 })
		.withMessage('Avatar URL is too long'),
	body('avatarPublicId')
		.optional({ nullable: true })
		.isString()
		.withMessage('Avatar public ID must be a string')
		.trim()
		.isLength({ max: 300 })
		.withMessage('Avatar public ID is too long'),
];

const userIdValidation = [
	param('userId').isMongoId().withMessage('Valid user ID is required'),
];

const adminListValidation = [
	query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
	query('role')
		.optional()
		.isIn(['client', 'freelancer', 'admin'])
		.withMessage('Role must be one of client, freelancer, admin'),
	query('status')
		.optional()
		.isIn(['pending_verification', 'active', 'suspended', 'blocked'])
		.withMessage('Status must be one of pending_verification, active, suspended, blocked'),
	query('search').optional().isString().withMessage('Search query must be a string'),
];

router.get('/me', requireAuth, getMyProfile);
router.patch('/me', requireAuth, updateProfileValidation, validateRequest, updateMyProfile);
router.get('/admin/list', requireAuth, requireAdmin, adminListValidation, validateRequest, listUsersForAdmin);
router.get('/profile/:userId', userIdValidation, validateRequest, getUserPublicProfile);
router.get('/:userId', userIdValidation, validateRequest, getUserPublicProfile);

export default router;

