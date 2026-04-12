import express from 'express';
import { body, param, query, validationResult } from 'express-validator';

import {
	acceptProposal,
	closeProject,
	createProject,
	deleteProject,
	getAllProjects,
	getClientProjects,
	getFreelancerProposals,
	getProjectById,
	getProjectProposals,
	submitProposal,
	updateProject,
} from '../controllers/project.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
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

const isFutureDate = (value) => {
	const parsed = new Date(value);

	if (Number.isNaN(parsed.getTime())) {
		return false;
	}

	return parsed.getTime() > Date.now();
};

const createProjectValidation = [
	body('title')
		.isString()
		.trim()
		.isLength({ min: 10, max: 150 })
		.withMessage('Title must be between 10 and 150 characters'),
	body('description')
		.isString()
		.trim()
		.isLength({ min: 50, max: 8000 })
		.withMessage('Description must be at least 50 characters'),
	body('category').isString().trim().notEmpty().withMessage('Category is required'),
	body('skillsRequired').optional().isArray().withMessage('skillsRequired must be an array'),
	body('skillsRequired.*').optional().isString().trim().withMessage('Each skill must be a string'),
	body('budget.min').isNumeric().withMessage('budget.min must be a number'),
	body('budget.max').isNumeric().withMessage('budget.max must be a number'),
	body('budget.type')
		.optional()
		.isIn(['fixed', 'hourly'])
		.withMessage('budget.type must be fixed or hourly'),
	body('deadline')
		.custom((value) => isFutureDate(value))
		.withMessage('deadline must be a valid future date'),
	body('attachments').optional().isArray().withMessage('attachments must be an array'),
	body('attachments.*.url').optional().isString().trim().notEmpty().withMessage('Attachment URL is required'),
	body('attachments.*.name').optional().isString().trim().notEmpty().withMessage('Attachment name is required'),
];

const updateProjectValidation = [
	body('title').optional().isString().trim().isLength({ min: 10, max: 150 }),
	body('description').optional().isString().trim().isLength({ min: 50, max: 8000 }),
	body('category').optional().isString().trim().notEmpty(),
	body('skillsRequired').optional().isArray(),
	body('skillsRequired.*').optional().isString().trim(),
	body('budget.min').optional().isNumeric(),
	body('budget.max').optional().isNumeric(),
	body('budget.type').optional().isIn(['fixed', 'hourly']),
	body('deadline').optional().custom((value) => isFutureDate(value)).withMessage('deadline must be a future date'),
	body('attachments').optional().isArray(),
	body('attachments.*.url').optional().isString().trim().notEmpty(),
	body('attachments.*.name').optional().isString().trim().notEmpty(),
];

const proposalValidation = [
	body('coverLetter')
		.isString()
		.trim()
		.isLength({ min: 30, max: 4000 })
		.withMessage('coverLetter must be between 30 and 4000 characters'),
	body('bidAmount').isNumeric().withMessage('bidAmount is required and must be a number'),
	body('deliveryDays').isInt({ min: 1 }).withMessage('deliveryDays is required and must be at least 1'),
];

const projectIdValidation = [
	param('id').isMongoId().withMessage('Project ID must be valid'),
];

const proposalIdValidation = [
	param('proposalId').isMongoId().withMessage('Proposal ID must be valid'),
];

const listValidation = [
	query('page').optional().isInt({ min: 1 }).withMessage('page must be positive integer'),
	query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
	query('budgetMin').optional().isNumeric().withMessage('budgetMin must be number'),
	query('budgetMax').optional().isNumeric().withMessage('budgetMax must be number'),
	query('skills').optional().isString().withMessage('skills must be comma-separated string'),
	query('search').optional().isString().withMessage('search must be string'),
	query('sort').optional().isIn(['newest', 'budget-high', 'budget-low']).withMessage('Invalid sort option'),
];

router.post('/', requireAuth, requireRole('client'), createProjectValidation, validateRequest, createProject);
router.get('/', optionalAuth, listValidation, validateRequest, getAllProjects);
router.get('/my', requireAuth, requireRole('client'), validateRequest, getClientProjects);
router.get('/proposals/my', requireAuth, requireRole('freelancer'), validateRequest, getFreelancerProposals);
router.get('/:id', optionalAuth, projectIdValidation, validateRequest, getProjectById);
router.put('/:id', requireAuth, requireRole('client'), projectIdValidation, updateProjectValidation, validateRequest, updateProject);
router.delete('/:id', requireAuth, requireRole('client'), projectIdValidation, validateRequest, deleteProject);

router.post(
	'/:id/proposals',
	requireAuth,
	requireRole('freelancer'),
	projectIdValidation,
	proposalValidation,
	validateRequest,
	submitProposal,
);
router.get('/:id/proposals', requireAuth, projectIdValidation, validateRequest, getProjectProposals);
router.put(
	'/:id/proposals/:proposalId/accept',
	requireAuth,
	projectIdValidation,
	proposalIdValidation,
	validateRequest,
	acceptProposal,
);
router.put('/:id/close', requireAuth, requireRole('client'), projectIdValidation, validateRequest, closeProject);

export default router;

