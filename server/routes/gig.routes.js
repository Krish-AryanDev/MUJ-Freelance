import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

import {
	createGig,
	deleteGig,
	getGigByIdOrSlug,
	listGigs,
	listMyGigs,
	updateGig,
	updateGigStatus,
} from '../controllers/gig.controller.js';
import { GIG_CATEGORIES } from '../models/Gig.model.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { requireFreelancer } from '../middleware/role.middleware.js';
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

const PACKAGE_TIERS = ['basic', 'standard', 'premium'];

const packageValidation = [
	body('packages')
		.isObject()
		.withMessage('Packages must be an object with basic, standard, premium keys')
		.custom((packages) => {
			if (!packages || typeof packages !== 'object') {
				return false;
			}

			return PACKAGE_TIERS.every((tier) => packages[tier] && typeof packages[tier] === 'object');
		})
		.withMessage('Packages must include basic, standard, and premium entries'),
	body('packages.basic.name').isString().trim().notEmpty().withMessage('Basic package name is required'),
	body('packages.standard.name').isString().trim().notEmpty().withMessage('Standard package name is required'),
	body('packages.premium.name').isString().trim().notEmpty().withMessage('Premium package name is required'),
	body('packages.basic.description').isString().trim().notEmpty().withMessage('Basic package description is required'),
	body('packages.standard.description')
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Standard package description is required'),
	body('packages.premium.description')
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Premium package description is required'),
	body('packages.basic.deliveryDays')
		.isInt({ min: 1 })
		.withMessage('Basic package deliveryDays must be at least 1'),
	body('packages.standard.deliveryDays')
		.isInt({ min: 1 })
		.withMessage('Standard package deliveryDays must be at least 1'),
	body('packages.premium.deliveryDays')
		.isInt({ min: 1 })
		.withMessage('Premium package deliveryDays must be at least 1'),
	body('packages.basic.revisions').isInt({ min: 0 }).withMessage('Basic package revisions must be 0 or more'),
	body('packages.standard.revisions')
		.isInt({ min: 0 })
		.withMessage('Standard package revisions must be 0 or more'),
	body('packages.premium.revisions')
		.isInt({ min: 0 })
		.withMessage('Premium package revisions must be 0 or more'),
	body('packages.basic.price').isFloat({ min: 1 }).withMessage('Basic package price must be at least 1'),
	body('packages.standard.price').isFloat({ min: 1 }).withMessage('Standard package price must be at least 1'),
	body('packages.premium.price').isFloat({ min: 1 }).withMessage('Premium package price must be at least 1'),
	body('packages.basic.features').optional().isArray().withMessage('Basic package features must be an array'),
	body('packages.standard.features').optional().isArray().withMessage('Standard package features must be an array'),
	body('packages.premium.features').optional().isArray().withMessage('Premium package features must be an array'),
];

const createGigValidation = [
	body('title')
		.isString()
		.trim()
		.isLength({ min: 10, max: 120 })
		.withMessage('Title must be between 10 and 120 characters'),
	body('description')
		.isString()
		.trim()
		.isLength({ min: 40, max: 6000 })
		.withMessage('Description must be between 40 and 6000 characters'),
	body('category')
		.isIn(GIG_CATEGORIES)
		.withMessage('Invalid gig category'),
	body('subcategory').optional().isString().trim().withMessage('Subcategory must be a string'),
	body('tags').optional().isArray().withMessage('Tags must be an array'),
	body('tags.*').optional().isString().trim().withMessage('Each tag must be a string'),
	body('status')
		.optional()
		.isIn(['active', 'draft', 'published', 'paused', 'archived'])
		.withMessage('Invalid gig status'),
	body('images').optional().isArray().withMessage('Images must be an array'),
	body('images.*.url').optional().isString().trim().notEmpty().withMessage('Image URL is required'),
	body('images.*.publicId')
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage('Image publicId is required'),
	body('faqs').optional().isArray().withMessage('FAQs must be an array'),
	body('faqs.*.question').optional().isString().trim().notEmpty().withMessage('FAQ question is required'),
	body('faqs.*.answer').optional().isString().trim().notEmpty().withMessage('FAQ answer is required'),
	...packageValidation,
];

const updateGigValidation = [
	body('title').optional().isString().trim().isLength({ min: 10, max: 120 }),
	body('description').optional().isString().trim().isLength({ min: 40, max: 6000 }),
	body('category')
		.optional()
		.isIn(GIG_CATEGORIES),
	body('status').optional().isIn(['active', 'draft', 'published', 'paused', 'archived']),
	body('subcategory').optional().isString().trim(),
	body('tags').optional().isArray(),
	body('tags.*').optional().isString().trim(),
	body('packages')
		.optional()
		.isObject()
		.withMessage('Packages must be an object with basic, standard, premium keys')
		.custom((packages) => {
			if (!packages || typeof packages !== 'object') {
				return false;
			}

			return PACKAGE_TIERS.every((tier) => packages[tier] && typeof packages[tier] === 'object');
		})
		.withMessage('Packages must include basic, standard, and premium entries'),
	body('packages.basic.name').optional().isString().trim().notEmpty(),
	body('packages.standard.name').optional().isString().trim().notEmpty(),
	body('packages.premium.name').optional().isString().trim().notEmpty(),
	body('packages.basic.description').optional().isString().trim().notEmpty(),
	body('packages.standard.description').optional().isString().trim().notEmpty(),
	body('packages.premium.description').optional().isString().trim().notEmpty(),
	body('packages.basic.deliveryDays').optional().isInt({ min: 1 }),
	body('packages.standard.deliveryDays').optional().isInt({ min: 1 }),
	body('packages.premium.deliveryDays').optional().isInt({ min: 1 }),
	body('packages.basic.revisions').optional().isInt({ min: 0 }),
	body('packages.standard.revisions').optional().isInt({ min: 0 }),
	body('packages.premium.revisions').optional().isInt({ min: 0 }),
	body('packages.basic.price').optional().isFloat({ min: 1 }),
	body('packages.standard.price').optional().isFloat({ min: 1 }),
	body('packages.premium.price').optional().isFloat({ min: 1 }),
	body('packages.basic.features').optional().isArray(),
	body('packages.standard.features').optional().isArray(),
	body('packages.premium.features').optional().isArray(),
	body('images').optional().isArray(),
	body('images.*.url').optional().isString().trim().notEmpty(),
	body('images.*.publicId').optional().isString().trim().notEmpty(),
	body('faqs').optional().isArray(),
	body('faqs.*.question').optional().isString().trim().notEmpty(),
	body('faqs.*.answer').optional().isString().trim().notEmpty(),
];

const statusValidation = [
	body('status')
		.isIn(['active', 'draft', 'published', 'paused', 'archived'])
		.withMessage('Status must be active, draft, published, paused, or archived'),
];

const listValidation = [
	query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
	query('category')
		.optional()
		.custom((value) => {
			if (Array.isArray(value)) {
				return value.every((item) => GIG_CATEGORIES.includes(String(item)));
			}

			const categories = String(value)
				.split(',')
				.map((item) => item.trim())
				.filter(Boolean);

			if (categories.length === 0) {
				return true;
			}

			return categories.every((item) => GIG_CATEGORIES.includes(item));
		})
		.withMessage('Invalid gig category'),
	query('search').optional().isString().withMessage('Search must be a string'),
	query('status')
		.optional()
		.isIn(['active', 'draft', 'published', 'paused', 'archived'])
		.withMessage('Invalid gig status'),
	query('sortBy')
		.optional()
		.isIn(['relevance', 'newest', 'price_low_to_high', 'price_high_to_low', 'rating'])
		.withMessage('Invalid sortBy value'),
	query('minPrice').optional().isFloat({ min: 0 }),
	query('maxPrice').optional().isFloat({ min: 0 }),
	query('minRating').optional().isFloat({ min: 0, max: 5 }),
	query('deliveryDaysMax').optional().isInt({ min: 1 }),
	query('freelancerId').optional().isMongoId().withMessage('freelancerId must be a valid ID'),
];

const gigIdValidation = [
	param('gigId').isString().trim().notEmpty().withMessage('Gig ID or slug is required'),
];

router.get('/me/list', requireAuth, requireFreelancer, listValidation, validateRequest, listMyGigs);
router.post('/', requireAuth, requireFreelancer, createGigValidation, validateRequest, createGig);
router.patch('/:gigId', requireAuth, requireFreelancer, gigIdValidation, updateGigValidation, validateRequest, updateGig);
router.patch(
	'/:gigId/status',
	requireAuth,
	requireFreelancer,
	gigIdValidation,
	statusValidation,
	validateRequest,
	updateGigStatus,
);
router.delete('/:gigId', requireAuth, requireFreelancer, gigIdValidation, validateRequest, deleteGig);

router.get('/', optionalAuth, listValidation, validateRequest, listGigs);
router.get('/:gigId', optionalAuth, gigIdValidation, validateRequest, getGigByIdOrSlug);

export default router;

