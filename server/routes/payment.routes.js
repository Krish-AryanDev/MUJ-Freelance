import express from 'express';
import { body } from 'express-validator';

import {
	confirmPayment,
	getEarnings,
	getPaymentHistory,
	initiatePayment,
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/error.middleware.js';

const router = express.Router();

router.post(
	'/initiate',
	requireAuth,
	body('orderId').notEmpty().withMessage('orderId is required'),
	validateRequest,
	initiatePayment,
);

router.post(
	'/confirm',
	requireAuth,
	body('paymentId').notEmpty().withMessage('paymentId is required'),
	body('action').isIn(['success', 'failure']).withMessage('action must be success or failure'),
	validateRequest,
	confirmPayment,
);

router.get('/history', requireAuth, getPaymentHistory);
router.get('/earnings', requireAuth, getEarnings);

export default router;

