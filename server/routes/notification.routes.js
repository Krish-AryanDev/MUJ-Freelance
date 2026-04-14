import express from 'express';
import { param, query, validationResult } from 'express-validator';

import {
	deleteAllRead,
	deleteNotification,
	getNotifications,
	getUnreadCount,
	markAllAsRead,
	markAsRead,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
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

router.use(requireAuth);

router.get(
	'/',
	[
		query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
		query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
		query('isRead').optional().isIn(['true', 'false', 'all']).withMessage('isRead must be true, false, or all'),
	],
	validateRequest,
	getNotifications,
);
router.get('/unread-count', validateRequest, getUnreadCount);
router.put('/mark-all-read', validateRequest, markAllAsRead);
router.put(
	'/:notificationId/read',
	[param('notificationId').isMongoId().withMessage('notificationId must be valid')],
	validateRequest,
	markAsRead,
);
router.delete('/read', validateRequest, deleteAllRead);
router.delete(
	'/:notificationId',
	[param('notificationId').isMongoId().withMessage('notificationId must be valid')],
	validateRequest,
	deleteNotification,
);

export default router;
