import mongoose from 'mongoose';

import { getIO } from '../config/socket.js';
import Project from '../models/Project.model.js';
import Proposal from '../models/Proposal.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { buildCacheKey, deleteCacheByPattern, deleteCacheKey, getCachedJson, setCachedJson } from '../utils/cache.js';
import { createNotification } from './notification.controller.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const PROJECT_LIST_TTL_SECONDS = 90;
const PROJECT_DETAIL_TTL_SECONDS = 120;
const PROJECT_CATEGORIES_TTL_SECONDS = 1800;

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const buildProjectSort = (sortBy) => {
	if (sortBy === 'budget-high') {
		return { 'budget.max': -1, createdAt: -1 };
	}

	if (sortBy === 'budget-low') {
		return { 'budget.min': 1, createdAt: -1 };
	}

	return { createdAt: -1 };
};

const normalizeBudget = (budget = {}) => ({
	min: Number(budget.min),
	max: Number(budget.max),
	type: budget.type === 'hourly' ? 'hourly' : 'fixed',
	currency: 'INR',
});

const mapProjectForResponse = (projectDoc) => {
	const project = projectDoc && typeof projectDoc.toObject === 'function' ? projectDoc.toObject() : projectDoc;

	if (!project) {
		return project;
	}

	const skillsRequired = Array.isArray(project.skillsRequired)
		? project.skillsRequired
		: Array.isArray(project.tags)
			? project.tags
			: [];

	return {
		...project,
		skillsRequired,
	};
};

const getUserDisplayName = (user) => user?.fullName || user?.name || 'A freelancer';

const invalidateProjectCaches = async (projectId = null) => {
	await Promise.all([
		deleteCacheByPattern('muj:cache:projects:list:*'),
		deleteCacheByPattern('muj:cache:projects:categories*'),
		projectId ? deleteCacheKey(buildCacheKey('projects:detail', { id: String(projectId) })) : Promise.resolve(0),
	]);
};

const createProject = asyncHandler(async (req, res) => {
	const { title, description, category, skillsRequired, budget, deadline, attachments } = req.body;

	const project = await Project.create({
		client: req.user._id,
		title,
		description,
		category,
		skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : [],
		tags: Array.isArray(skillsRequired) ? skillsRequired : [],
		budget: normalizeBudget(budget),
		deadline,
		attachments: Array.isArray(attachments) ? attachments : [],
		status: 'open',
	});

	const populated = await Project.findById(project._id).populate('client', 'fullName avatar').lean();

	await invalidateProjectCaches(project._id);

	return res
		.status(201)
		.json(new ApiResponse(201, { project: mapProjectForResponse(populated) }, 'Project created successfully'));
});

const getAllProjects = asyncHandler(async (req, res) => {
	const listCacheKey = buildCacheKey('projects:list', req.query || {});
	const cachedList = await getCachedJson(listCacheKey);

	if (cachedList) {
		return res.status(200).json(cachedList);
	}

	const { page, limit, skip } = parsePagination(req.query);
	const { category, budgetMin, budgetMax, skills, status, search, sort = 'newest' } = req.query;

	const filters = {};

	if (category) {
		filters.category = String(category);
	}

	if (status) {
		filters.status = String(status);
	}

	if (!status) {
		filters.status = { $in: ['open', 'in-progress', 'in_progress', 'completed'] };
	}

	if (budgetMin !== undefined || budgetMax !== undefined) {
		filters['budget.max'] = {};

		if (budgetMin !== undefined) {
			filters['budget.max'].$gte = Number(budgetMin);
		}

		if (budgetMax !== undefined) {
			filters['budget.min'] = { $lte: Number(budgetMax) };
		}
	}

	if (skills) {
		const skillTokens = String(skills)
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean);

		if (skillTokens.length > 0) {
			filters.skillsRequired = { $in: skillTokens };
		}
	}

	if (search) {
		filters.$text = { $search: String(search).trim() };
	}

	const sortBy = buildProjectSort(String(sort || 'newest'));

	const [items, total] = await Promise.all([
		Project.find(filters)
			.populate('client', 'fullName avatar')
			.sort(sortBy)
			.skip(skip)
			.limit(limit)
			.lean(),
		Project.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	const response = new ApiResponse(
		200,
		{ projects: items.map(mapProjectForResponse) },
		'Projects fetched successfully',
		{
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		},
	);

	void setCachedJson(listCacheKey, response, PROJECT_LIST_TTL_SECONDS);

	return res.status(200).json(response);
});

const getProjectById = asyncHandler(async (req, res) => {
	const projectId = req.params.id;
	const detailCacheKey = buildCacheKey('projects:detail', { id: String(projectId || '') });
	const cachedProject = await getCachedJson(detailCacheKey);

	if (cachedProject) {
		return res.status(200).json(cachedProject);
	}

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const project = await Project.findById(projectId).populate('client', 'fullName avatar').lean();

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	const proposalsCount = await Proposal.countDocuments({ project: project._id });
	project.proposalCount = proposalsCount;

	const response = new ApiResponse(200, { project: mapProjectForResponse(project) }, 'Project fetched successfully');

	void setCachedJson(detailCacheKey, response, PROJECT_DETAIL_TTL_SECONDS);

	return res.status(200).json(response);
});

const getProjectCategories = asyncHandler(async (_req, res) => {
	const categoriesCacheKey = buildCacheKey('projects:categories');
	const cachedCategories = await getCachedJson(categoriesCacheKey);

	if (cachedCategories) {
		return res.status(200).json(cachedCategories);
	}

	const categories = await Project.distinct('category', {
		category: { $ne: null },
	});

	const sortedCategories = categories
		.map((category) => String(category || '').trim())
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b));

	const response = new ApiResponse(200, { categories: sortedCategories }, 'Project categories fetched successfully');

	void setCachedJson(categoriesCacheKey, response, PROJECT_CATEGORIES_TTL_SECONDS);

	return res.status(200).json(response);
});

const updateProject = asyncHandler(async (req, res) => {
	const projectId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const project = await Project.findById(projectId);

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) !== String(req.user._id)) {
		throw new ApiError(403, 'Only project owner can update this project');
	}

	if (project.status !== 'open') {
		throw new ApiError(400, 'Only open projects can be updated');
	}

	const allowedUpdates = ['title', 'description', 'category', 'skillsRequired', 'budget', 'deadline', 'attachments'];

	for (const field of allowedUpdates) {
		if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
			continue;
		}

		if (field === 'budget') {
			project.budget = normalizeBudget(req.body.budget);
			continue;
		}

		if (field === 'skillsRequired') {
			project.skillsRequired = Array.isArray(req.body.skillsRequired) ? req.body.skillsRequired : [];
			project.tags = project.skillsRequired;
			continue;
		}

		project[field] = req.body[field];
	}

	await project.save();

	const updated = await Project.findById(project._id).populate('client', 'fullName avatar').lean();

	await invalidateProjectCaches(project._id);

	return res
		.status(200)
		.json(new ApiResponse(200, { project: mapProjectForResponse(updated) }, 'Project updated successfully'));
});

const deleteProject = asyncHandler(async (req, res) => {
	const projectId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const project = await Project.findById(projectId);

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) !== String(req.user._id)) {
		throw new ApiError(403, 'Only project owner can delete this project');
	}

	const proposalsCount = await Proposal.countDocuments({ project: project._id });

	if (proposalsCount > 0) {
		throw new ApiError(400, 'Cannot delete project with submitted proposals');
	}

	await Project.deleteOne({ _id: project._id });

	await invalidateProjectCaches(projectId);

	return res.status(200).json(new ApiResponse(200, null, 'Project deleted successfully'));
});

const getClientProjects = asyncHandler(async (req, res) => {
	const projects = await Project.find({ client: req.user._id })
		.populate('client', 'fullName avatar')
		.sort({ createdAt: -1 })
		.lean();

	return res
		.status(200)
		.json(new ApiResponse(200, { projects: projects.map(mapProjectForResponse) }, 'Client projects fetched successfully'));
});

const submitProposal = asyncHandler(async (req, res) => {
	const projectId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const { coverLetter, bidAmount, deliveryDays } = req.body;
	const project = await Project.findById(projectId);

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) === String(req.user._id)) {
		throw new ApiError(400, 'You cannot submit proposal on your own project');
	}

	if (project.status !== 'open') {
		throw new ApiError(400, 'Proposals are only allowed on open projects');
	}

	const existing = await Proposal.findOne({ project: project._id, freelancer: req.user._id }).lean();

	if (existing) {
		throw new ApiError(409, 'You have already submitted a proposal for this project');
	}

	const proposal = await Proposal.create({
		project: project._id,
		client: project.client,
		freelancer: req.user._id,
		coverLetter,
		bidAmount: Number(bidAmount),
		deliveryDays: Number(deliveryDays),
	});

	project.proposalCount = (project.proposalCount || 0) + 1;
	await project.save();

	await invalidateProjectCaches(project._id);

	const populated = await Proposal.findById(proposal._id).populate('freelancer', 'fullName avatar').lean();

	void createNotification({
		recipient: project.client,
		sender: req.user._id,
		type: 'new_proposal',
		title: 'New Proposal Received!',
		message: `${getUserDisplayName(req.user)} submitted a proposal for "${project.title}"`,
		link: `/projects/${project._id}`,
		metadata: { projectId: project._id, proposalId: proposal._id },
		io: getIO(),
	});

	return res
		.status(201)
		.json(new ApiResponse(201, { proposal: populated }, 'Proposal submitted successfully'));
});

const getProjectProposals = asyncHandler(async (req, res) => {
	const projectId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const project = await Project.findById(projectId).lean();

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) !== String(req.user._id)) {
		throw new ApiError(403, 'Only project owner can view proposals');
	}

	const proposals = await Proposal.find({ project: project._id })
		.populate('freelancer', 'fullName avatar')
		.sort({ createdAt: -1 })
		.lean();

	return res
		.status(200)
		.json(new ApiResponse(200, { proposals }, 'Project proposals fetched successfully'));
});

const acceptProposal = asyncHandler(async (req, res) => {
	const { id: projectId, proposalId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(proposalId)) {
		throw new ApiError(400, 'Invalid project/proposal ID');
	}

	const project = await Project.findById(projectId);

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) !== String(req.user._id)) {
		throw new ApiError(403, 'Only project owner can accept proposal');
	}

	const proposal = await Proposal.findOne({ _id: proposalId, project: project._id });

	if (!proposal) {
		throw new ApiError(404, 'Proposal not found for this project');
	}

	proposal.status = 'accepted';
	await proposal.save();

	const rejectedProposals = await Proposal.find({
		project: project._id,
		_id: { $ne: proposal._id },
		status: 'pending',
	})
		.select('_id freelancer')
		.lean();

	await Proposal.updateMany(
		{ project: project._id, _id: { $ne: proposal._id }, status: 'pending' },
		{ $set: { status: 'rejected' } },
	);

	project.status = 'in-progress';
	project.assignedFreelancer = proposal.freelancer;
	project.selectedFreelancer = proposal.freelancer;
	await project.save();

	await invalidateProjectCaches(project._id);

	const updatedProject = await Project.findById(project._id)
		.populate('client', 'fullName avatar')
		.populate('assignedFreelancer', 'fullName avatar')
		.lean();

	void createNotification({
		recipient: proposal.freelancer,
		sender: req.user._id,
		type: 'proposal_accepted',
		title: 'Proposal Accepted!',
		message: `Your proposal for "${project.title}" was accepted!`,
		link: `/projects/${project._id}`,
		metadata: { projectId: project._id, proposalId: proposal._id },
		io: getIO(),
	});

	rejectedProposals.forEach((rejectedProposal) => {
		void createNotification({
			recipient: rejectedProposal.freelancer,
			sender: req.user._id,
			type: 'proposal_rejected',
			title: 'Proposal Rejected',
			message: `Your proposal for "${project.title}" was not selected`,
			link: `/projects/${project._id}`,
			metadata: { projectId: project._id, proposalId: rejectedProposal._id },
			io: getIO(),
		});
	});

	return res.status(200).json(
		new ApiResponse(
			200,
			{ project: mapProjectForResponse(updatedProject), proposal },
			'Proposal accepted successfully',
		),
	);
});

const closeProject = asyncHandler(async (req, res) => {
	const projectId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(projectId)) {
		throw new ApiError(400, 'Invalid project ID');
	}

	const project = await Project.findById(projectId);

	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	if (String(project.client) !== String(req.user._id)) {
		throw new ApiError(403, 'Only project owner can close this project');
	}

	project.status = 'cancelled';
	await project.save();

	await invalidateProjectCaches(project._id);

	return res
		.status(200)
		.json(new ApiResponse(200, { project: mapProjectForResponse(project) }, 'Project closed successfully'));
});

const getFreelancerProposals = asyncHandler(async (req, res) => {
	const proposals = await Proposal.find({ freelancer: req.user._id })
		.populate('project', 'title status budget deadline')
		.sort({ createdAt: -1 })
		.lean();

	return res
		.status(200)
		.json(new ApiResponse(200, { proposals }, 'Freelancer proposals fetched successfully'));
});

export {
	acceptProposal,
	closeProject,
	createProject,
	deleteProject,
	getAllProjects,
	getClientProjects,
	getProjectCategories,
	getFreelancerProposals,
	getProjectById,
	getProjectProposals,
	submitProposal,
	updateProject,
};

export default {
	createProject,
	getAllProjects,
	getProjectById,
	updateProject,
	deleteProject,
	getClientProjects,
	getProjectCategories,
	submitProposal,
	getProjectProposals,
	acceptProposal,
	closeProject,
	getFreelancerProposals,
};

