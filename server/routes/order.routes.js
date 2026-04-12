import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

import {
	acceptDelivery,
	cancelOrder,
	createDispute,
	createOrder,
	deliverOrder,
	getMyOrders,
	getOrderById,
	requestRevision,
} from '../controllers/order.controller.js';
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

const idValidation = [
	param('id').isMongoId().withMessage('Order id must be valid'),
];

const createOrderValidation = [
	body('gigId').isMongoId().withMessage('gigId is required and must be valid'),
	body('packageTier')
		.isString()
		.trim()
		.isIn(['basic', 'standard', 'premium'])
		.withMessage('packageTier must be basic, standard, or premium'),
];

const listValidation = [
	query('status').optional().isString().trim().notEmpty().withMessage('status must be a string'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];

const deliverValidation = [
	body('deliveryMessage')
		.isString()
		.trim()
		.isLength({ min: 1 })
		.withMessage('deliveryMessage is required'),
	body('attachments').optional().isArray().withMessage('attachments must be an array'),
	body('attachments.*').optional().isString().trim().withMessage('Each attachment must be a string'),
];

const revisionValidation = [
	body('revisionNote')
		.isString()
		.trim()
		.isLength({ min: 1 })
		.withMessage('revisionNote is required'),
];

const disputeValidation = [
	body('reason').isString().trim().isLength({ min: 1 }).withMessage('reason is required'),
];

router.post('/', requireAuth, createOrderValidation, validateRequest, createOrder);
router.get('/', requireAuth, listValidation, validateRequest, getMyOrders);
router.get('/:id', requireAuth, idValidation, validateRequest, getOrderById);
router.put('/:id/deliver', requireAuth, idValidation, deliverValidation, validateRequest, deliverOrder);
router.put('/:id/accept', requireAuth, idValidation, validateRequest, acceptDelivery);
router.put('/:id/revision', requireAuth, idValidation, revisionValidation, validateRequest, requestRevision);
router.put('/:id/cancel', requireAuth, idValidation, validateRequest, cancelOrder);
router.post('/:id/dispute', requireAuth, idValidation, disputeValidation, validateRequest, createDispute);

export default router;

