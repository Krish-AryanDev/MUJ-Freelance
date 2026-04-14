import express from 'express';
import { body, param, query } from 'express-validator';

import {
	createReview,
	deleteReview,
	getGigReviews,
	getMyReviews,
	getOrderReviews,
	getUserReviews,
	updateReview,
} from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/error.middleware.js';

const router = express.Router();

router.post(
	'/',
	requireAuth,
	body('orderId').isMongoId().withMessage('orderId must be a valid id'),
	body('gigId').optional().isMongoId().withMessage('gigId must be a valid id'),
	body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
	body('comment').isString().trim().isLength({ min: 10, max: 1000 }).withMessage('comment must be 10-1000 chars'),
	body('type')
		.isIn(['client_to_freelancer', 'freelancer_to_client'])
		.withMessage('type must be client_to_freelancer or freelancer_to_client'),
	validateRequest,
	createReview,
);

router.get(
	'/gig/:gigId',
	param('gigId').isMongoId().withMessage('gigId must be a valid id'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be positive'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1-50'),
	query('sort').optional().isIn(['recent', 'highest', 'lowest']).withMessage('Invalid sort value'),
	validateRequest,
	getGigReviews,
);

router.get(
	'/user/:userId',
	param('userId').isMongoId().withMessage('userId must be a valid id'),
	query('page').optional().isInt({ min: 1 }).withMessage('page must be positive'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1-50'),
	query('sort').optional().isIn(['recent', 'highest', 'lowest']).withMessage('Invalid sort value'),
	validateRequest,
	getUserReviews,
);

router.get(
	'/order/:orderId',
	requireAuth,
	param('orderId').isMongoId().withMessage('orderId must be a valid id'),
	validateRequest,
	getOrderReviews,
);

router.get(
	'/my-reviews',
	requireAuth,
	query('page').optional().isInt({ min: 1 }).withMessage('page must be positive'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1-50'),
	query('sort').optional().isIn(['recent', 'highest', 'lowest']).withMessage('Invalid sort value'),
	validateRequest,
	getMyReviews,
);

router.put(
	'/:reviewId',
	requireAuth,
	param('reviewId').isMongoId().withMessage('reviewId must be a valid id'),
	body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
	body('comment').optional().isString().trim().isLength({ min: 10, max: 1000 }).withMessage('comment must be 10-1000 chars'),
	validateRequest,
	updateReview,
);

router.delete(
	'/:reviewId',
	requireAuth,
	param('reviewId').isMongoId().withMessage('reviewId must be a valid id'),
	validateRequest,
	deleteReview,
);

export default router;

