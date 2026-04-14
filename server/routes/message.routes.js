import express from 'express';
import { body, param, query } from 'express-validator';

import {
	deleteMessage,
	getConversations,
	getMessages,
	getOrCreateConversation,
	getUnreadCount,
	markAsRead,
	sendMessage,
} from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/error.middleware.js';

const router = express.Router();

router.get('/conversations', requireAuth, getConversations);

router.post(
	'/conversations',
	requireAuth,
	body('otherUserId').isMongoId().withMessage('otherUserId must be a valid user id'),
	body('relatedGig').optional().isMongoId().withMessage('relatedGig must be a valid gig id'),
	body('relatedOrder').optional().isMongoId().withMessage('relatedOrder must be a valid order id'),
	validateRequest,
	getOrCreateConversation,
);

router.get(
	'/conversations/:id',
	requireAuth,
	param('id').isMongoId().withMessage('Conversation id must be valid'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
	validateRequest,
	getMessages,
);

router.post(
	'/conversations/:id',
	requireAuth,
	param('id').isMongoId().withMessage('Conversation id must be valid'),
	body('content').optional().isString().withMessage('content must be a string'),
	body('messageType')
		.optional()
		.isIn(['text', 'image', 'file', 'order_update'])
		.withMessage('Invalid messageType'),
	body('attachments').optional().isArray().withMessage('attachments must be an array'),
	body('attachments.*.url').optional().isString().trim().withMessage('attachment url must be a string'),
	body('attachments.*.filename')
		.optional()
		.isString()
		.trim()
		.withMessage('attachment filename must be a string'),
	body('attachments.*.fileType')
		.optional()
		.isString()
		.trim()
		.withMessage('attachment fileType must be a string'),
	validateRequest,
	sendMessage,
);

router.put(
	'/conversations/:id/read',
	requireAuth,
	param('id').isMongoId().withMessage('Conversation id must be valid'),
	validateRequest,
	markAsRead,
);

router.get('/unread-count', requireAuth, getUnreadCount);

router.delete(
	'/:messageId',
	requireAuth,
	param('messageId').isMongoId().withMessage('messageId must be a valid message id'),
	validateRequest,
	deleteMessage,
);

export default router;

