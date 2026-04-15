import mongoose from 'mongoose';

import Gig from '../models/Gig.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const allowedStatuses = ['active', 'draft', 'published', 'paused', 'archived'];
const packageTiers = ['basic', 'standard', 'premium'];

const normalizePackages = (packages) => {
	if (!packages) {
		return packages;
	}

	if (Array.isArray(packages)) {
		return packages;
	}

	if (typeof packages !== 'object') {
		return packages;
	}

	return packageTiers.map((tier) => {
		const pkg = packages[tier] || {};

		return {
			tier,
			title: pkg.title || pkg.name,
			description: pkg.description,
			deliveryDays: pkg.deliveryDays,
			revisions: pkg.revisions,
			price: pkg.price,
			features: Array.isArray(pkg.features) ? pkg.features : [],
		};
	});
};

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const buildSort = ({ sortBy, hasTextSearch }) => {
	if (sortBy === 'price_low_to_high') {
		return { 'packages.0.price': 1, createdAt: -1 };
	}

	if (sortBy === 'price_high_to_low') {
		return { 'packages.0.price': -1, createdAt: -1 };
	}

	if (sortBy === 'rating') {
		return { averageRating: -1, totalReviews: -1, createdAt: -1 };
	}

	if (sortBy === 'newest') {
		return { createdAt: -1 };
	}

	if (sortBy === 'relevance' && hasTextSearch) {
		return { score: { $meta: 'textScore' }, createdAt: -1 };
	}

	return { isFeatured: -1, createdAt: -1 };
};

const parseGigLookup = (value) => {
	const input = String(value || '').trim();

	if (!input) {
		return null;
	}

	if (mongoose.Types.ObjectId.isValid(input)) {
		return { _id: input };
	}

	return { slug: input.toLowerCase() };
};

const getGigFreelancerId = (gig) => {
	if (!gig?.freelancer) {
		return null;
	}

	if (typeof gig.freelancer === 'string') {
		return gig.freelancer;
	}

	if (gig.freelancer._id) {
		return String(gig.freelancer._id);
	}

	if (gig.freelancer.id) {
		return String(gig.freelancer.id);
	}

	try {
		return String(gig.freelancer);
	} catch (_error) {
		return null;
	}
};

const canAccessUnpublishedGig = (req, gig) => {
	if (!req.user || !gig) {
		return false;
	}

	const gigFreelancerId = getGigFreelancerId(gig);
	const isOwner = gigFreelancerId === req.user._id?.toString();
	const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');

	return isOwner || isAdmin;
};

const createGig = asyncHandler(async (req, res) => {
	const {
		title,
		description,
		category,
		subcategory,
		tags,
		packages,
		images,
		faqs,
		status,
	} = req.body;

	const normalizedPackages = normalizePackages(packages);

	const createdGig = await Gig.create({
		freelancer: req.user._id,
		title,
		description,
		category,
		subcategory,
		tags: Array.isArray(tags) ? tags : [],
		packages: normalizedPackages,
		images: Array.isArray(images) ? images : [],
		faqs: Array.isArray(faqs) ? faqs : [],
		status: status && allowedStatuses.includes(status) ? status : undefined,
	});

	const gig = await Gig.findById(createdGig._id)
		.populate('freelancer', 'fullName avatar')
		.lean();

	return res.status(201).json(new ApiResponse(201, { gig }, 'Gig created successfully'));
});

const listGigs = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const {
		category,
		search,
		minPrice,
		maxPrice,
		deliveryDaysMax,
		minRating,
		sortBy,
		status,
		freelancerId,
	} = req.query;

	const filters = {};

	if (category) {
		const categories = String(category)
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);

		if (categories.length === 1) {
			filters.category = categories[0];
		} else if (categories.length > 1) {
			filters.category = { $in: categories };
		}
	}

	if (status && allowedStatuses.includes(String(status))) {
		filters.status = String(status);
	} else {
		filters.status = { $in: ['active', 'published'] };
	}

	if (freelancerId && mongoose.Types.ObjectId.isValid(String(freelancerId))) {
		filters.freelancer = String(freelancerId);
	}

	if (search) {
		filters.$text = { $search: String(search).trim() };
	}

	if (minPrice || maxPrice) {
		filters['packages.price'] = {};

		if (minPrice !== undefined) {
			filters['packages.price'].$gte = Number(minPrice);
		}

		if (maxPrice !== undefined) {
			filters['packages.price'].$lte = Number(maxPrice);
		}
	}

	if (deliveryDaysMax !== undefined) {
		filters['packages.deliveryDays'] = { $lte: Number(deliveryDaysMax) };
	}

	if (minRating !== undefined) {
		filters.averageRating = { $gte: Number(minRating) };
	}

	const projection = search
		? {
			score: { $meta: 'textScore' },
			title: 1,
			slug: 1,
			description: 1,
			category: 1,
			subcategory: 1,
			tags: 1,
			packages: 1,
			images: 1,
			status: 1,
			isFeatured: 1,
			averageRating: 1,
			totalReviews: 1,
			totalOrders: 1,
			freelancer: 1,
			createdAt: 1,
			updatedAt: 1,
		}
		: undefined;

	const sort = buildSort({ sortBy, hasTextSearch: Boolean(search) });

	const [items, total] = await Promise.all([
		Gig.find(filters, projection)
			.populate('freelancer', 'fullName avatar')
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean(),
		Gig.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ gigs: items },
			'Gigs fetched successfully',
			{
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		),
	);
});

const getGigByIdOrSlug = asyncHandler(async (req, res) => {
	const lookup = parseGigLookup(req.params.gigId);

	if (!lookup) {
		throw new ApiError(400, 'Gig ID or slug is required');
	}

	const gig = await Gig.findOne(lookup).populate('freelancer', 'fullName avatar').lean();

	if (!gig) {
		throw new ApiError(404, 'Gig not found');
	}

	const canAccessAsOwnerOrAdmin = canAccessUnpublishedGig(req, gig);
	const isPublicGig = gig.status === 'active' || gig.status === 'published';

	if (!canAccessAsOwnerOrAdmin && !isPublicGig) {
		throw new ApiError(404, 'Gig not found');
	}

	return res.status(200).json(new ApiResponse(200, { gig }, 'Gig fetched successfully'));
});

const listMyGigs = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const status = req.query.status ? String(req.query.status) : undefined;

	const filters = { freelancer: req.user._id };

	if (status && allowedStatuses.includes(status)) {
		filters.status = status;
	}

	const [items, total] = await Promise.all([
		Gig.find(filters).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
		Gig.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ gigs: items },
			'Your gigs fetched successfully',
			{
				page,
				limit,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		),
	);
});

const updateGig = asyncHandler(async (req, res) => {
	const lookup = parseGigLookup(req.params.gigId);

	if (!lookup) {
		throw new ApiError(400, 'Gig ID or slug is required');
	}

	const gig = await Gig.findOne(lookup);

	if (!gig) {
		throw new ApiError(404, 'Gig not found');
	}

	const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');
	const isOwner = gig.freelancer.toString() === req.user._id.toString();

	if (!isOwner && !isAdmin) {
		throw new ApiError(403, 'You are not allowed to update this gig');
	}

	const allowedUpdates = [
		'title',
		'description',
		'category',
		'subcategory',
		'tags',
		'packages',
		'images',
		'faqs',
		'status',
	];

	for (const field of allowedUpdates) {
		if (Object.prototype.hasOwnProperty.call(req.body, field)) {
			gig[field] = field === 'packages' ? normalizePackages(req.body[field]) : req.body[field];
		}
	}

	await gig.save();

	const updatedGig = await Gig.findById(gig._id).populate('freelancer', 'fullName avatar').lean();

	return res.status(200).json(new ApiResponse(200, { gig: updatedGig }, 'Gig updated successfully'));
});

const updateGigStatus = asyncHandler(async (req, res) => {
	const lookup = parseGigLookup(req.params.gigId);
	const { status } = req.body;

	if (!lookup) {
		throw new ApiError(400, 'Gig ID or slug is required');
	}

	if (!status || !allowedStatuses.includes(String(status))) {
		throw new ApiError(400, 'A valid gig status is required');
	}

	const gig = await Gig.findOne(lookup);

	if (!gig) {
		throw new ApiError(404, 'Gig not found');
	}

	const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');
	const isOwner = gig.freelancer.toString() === req.user._id.toString();

	if (!isOwner && !isAdmin) {
		throw new ApiError(403, 'You are not allowed to update this gig status');
	}

	gig.status = String(status);
	await gig.save();

	return res
		.status(200)
		.json(new ApiResponse(200, { gig }, 'Gig status updated successfully'));
});

const deleteGig = asyncHandler(async (req, res) => {
	const lookup = parseGigLookup(req.params.gigId);

	if (!lookup) {
		throw new ApiError(400, 'Gig ID or slug is required');
	}

	const gig = await Gig.findOne(lookup);

	if (!gig) {
		throw new ApiError(404, 'Gig not found');
	}

	const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin');
	const isOwner = gig.freelancer.toString() === req.user._id.toString();

	if (!isOwner && !isAdmin) {
		throw new ApiError(403, 'You are not allowed to delete this gig');
	}

	await Gig.deleteOne({ _id: gig._id });

	return res.status(200).json(new ApiResponse(200, null, 'Gig deleted successfully'));
});

export {
	createGig,
	deleteGig,
	getGigByIdOrSlug,
	listGigs,
	listMyGigs,
	updateGig,
	updateGigStatus,
};

export default {
	createGig,
	listGigs,
	getGigByIdOrSlug,
	listMyGigs,
	updateGig,
	updateGigStatus,
	deleteGig,
};

