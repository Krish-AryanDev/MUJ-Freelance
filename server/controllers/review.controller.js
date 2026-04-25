import mongoose from 'mongoose';
import { getIO } from '../config/socket.js';
import FreelancerProfile from '../models/FreelancerProfile.model.js';
import Gig from '../models/Gig.model.js';
import Order from '../models/Order.model.js';
import Review from '../models/Review.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { createNotification } from './notification.controller.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const REVIEW_TYPE_CLIENT_TO_FREELANCER = 'client_to_freelancer';
const REVIEW_TYPE_FREELANCER_TO_CLIENT = 'freelancer_to_client';

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const parseSort = (sort) => {
	if (sort === 'highest') {
		return { rating: -1, createdAt: -1 };
	}

	if (sort === 'lowest') {
		return { rating: 1, createdAt: -1 };
	}

	return { createdAt: -1 };
};

const createEmptyBreakdown = () => ({
	1: 0,
	2: 0,
	3: 0,
	4: 0,
	5: 0,
});

const toAggregateFilters = (filters) => {
	const aggregateFilters = { ...filters };
	const objectIdKeys = ['gig', 'reviewee', 'reviewer', 'order'];

	objectIdKeys.forEach((key) => {
		const value = aggregateFilters[key];
		if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
			aggregateFilters[key] = new mongoose.Types.ObjectId(value);
		}
	});

	return aggregateFilters;
};

const getRatingBreakdown = async (filters) => {
	const aggregateFilters = toAggregateFilters(filters);

	const aggregation = await Review.aggregate([
		{ $match: aggregateFilters },
		{ $group: { _id: '$rating', count: { $sum: 1 } } },
	]);

	const breakdown = createEmptyBreakdown();

	aggregation.forEach((entry) => {
		const rating = Number(entry._id);
		if ([1, 2, 3, 4, 5].includes(rating)) {
			breakdown[rating] = entry.count;
		}
	});

	return breakdown;
};

const getAverageRating = async (filters) => {
	const aggregateFilters = toAggregateFilters(filters);

	const aggregation = await Review.aggregate([
		{ $match: aggregateFilters },
		{
			$group: {
				_id: null,
				averageRating: { $avg: '$rating' },
				totalReviews: { $sum: 1 },
			},
		},
	]);

	if (aggregation.length === 0) {
		return { averageRating: 0, totalReviews: 0 };
	}

	return {
		averageRating: Number(aggregation[0].averageRating || 0),
		totalReviews: Number(aggregation[0].totalReviews || 0),
	};
};

const recalculateGigRatings = async (gigId) => {
	if (!gigId) {
		return;
	}

	const { averageRating, totalReviews } = await getAverageRating({
		gig: gigId,
		isPublic: true,
		type: REVIEW_TYPE_CLIENT_TO_FREELANCER,
	});

	await Gig.findByIdAndUpdate(gigId, {
		$set: {
			averageRating: Number(averageRating.toFixed(2)),
			totalReviews,
		},
	});
};

const recalculateFreelancerProfileRatings = async (freelancerUserId) => {
	if (!freelancerUserId) {
		return;
	}

	const { averageRating, totalReviews } = await getAverageRating({
		reviewee: freelancerUserId,
		isPublic: true,
		type: REVIEW_TYPE_CLIENT_TO_FREELANCER,
	});

	await FreelancerProfile.findOneAndUpdate(
		{ user: freelancerUserId },
		{
			$set: {
				averageRating: Number(averageRating.toFixed(2)),
				totalReviews,
			},
		},
		{ new: true },
	);
};

const getOrderPartyIds = (order) => ({
	buyerId: String(order.clientId),
	sellerId: String(order.freelancerId),
});

const createReview = asyncHandler(async (req, res) => {
	try {
		const { orderId, rating, comment, type, gigId } = req.body;

		if (!orderId || !rating || !comment || !type) {
			throw new ApiError(400, 'orderId, rating, comment, and type are required');
		}

		if (![REVIEW_TYPE_CLIENT_TO_FREELANCER, REVIEW_TYPE_FREELANCER_TO_CLIENT].includes(type)) {
			throw new ApiError(400, 'Invalid review type');
		}

		if (Number(rating) < 1 || Number(rating) > 5) {
			throw new ApiError(400, 'rating must be between 1 and 5');
		}

		if (String(comment).trim().length < 10 || String(comment).trim().length > 1000) {
			throw new ApiError(400, 'comment must be between 10 and 1000 characters');
		}

		const order = await Order.findById(orderId).select('status clientId freelancerId gigId').lean();

		if (!order) {
			throw new ApiError(404, 'Order not found');
		}

		if (order.status !== 'completed') {
			throw new ApiError(400, 'Reviews can only be submitted for completed orders');
		}

		const { buyerId, sellerId } = getOrderPartyIds(order);
		const requesterId = String(req.user._id);

		if (![buyerId, sellerId].includes(requesterId)) {
			throw new ApiError(403, 'You are not eligible to review this order');
		}

		if (type === REVIEW_TYPE_CLIENT_TO_FREELANCER && requesterId !== buyerId) {
			throw new ApiError(403, 'Only the client can leave this review type');
		}

		if (type === REVIEW_TYPE_FREELANCER_TO_CLIENT && requesterId !== sellerId) {
			throw new ApiError(403, 'Only the freelancer can leave this review type');
		}

		const existingReview = await Review.findOne({ order: orderId, type }).lean();

		if (existingReview) {
			const populatedExistingReview = await Review.findById(existingReview._id)
				.populate({ path: 'reviewer', select: 'fullName avatar' })
				.populate({ path: 'reviewee', select: 'fullName avatar' })
				.populate({ path: 'gig', select: 'title' })
				.lean();

			return res.status(200).json(new ApiResponse(200, populatedExistingReview, 'Review already submitted'));
		}

		const reviewer = type === REVIEW_TYPE_CLIENT_TO_FREELANCER ? buyerId : sellerId;
		const reviewee = type === REVIEW_TYPE_CLIENT_TO_FREELANCER ? sellerId : buyerId;

		let createdReview;
		try {
			createdReview = await Review.create({
				order: orderId,
				gig: gigId || order.gigId || null,
				reviewer,
				reviewee,
				rating: Number(rating),
				comment: String(comment).trim(),
				type,
				isPublic: true,
			});
		} catch (creationError) {
			if (creationError?.code !== 11000) {
				throw creationError;
			}

			const duplicateReview = await Review.findOne({
				order: orderId,
				reviewer,
			}).lean();

			if (!duplicateReview) {
				throw creationError;
			}

			const populatedDuplicateReview = await Review.findById(duplicateReview._id)
				.populate({ path: 'reviewer', select: 'fullName avatar' })
				.populate({ path: 'reviewee', select: 'fullName avatar' })
				.populate({ path: 'gig', select: 'title' })
				.lean();

			return res.status(200).json(new ApiResponse(200, populatedDuplicateReview, 'Review already submitted'));
		}

		if (type === REVIEW_TYPE_CLIENT_TO_FREELANCER) {
			await Promise.all([
				recalculateGigRatings(createdReview.gig),
				recalculateFreelancerProfileRatings(sellerId),
			]);
		}

		const review = await Review.findById(createdReview._id)
			.populate({ path: 'reviewer', select: 'fullName avatar' })
			.populate({ path: 'reviewee', select: 'fullName avatar' })
			.populate({ path: 'gig', select: 'title' })
			.lean();

		const reviewerName = req.user?.fullName || req.user?.name || 'Someone';
		void createNotification({
			recipient: reviewee,
			sender: req.user._id,
			type: 'new_review',
			title: 'New Review Received!',
			message: `${reviewerName} left you a ${Number(rating)}-star review`,
			link: `/profile/${reviewee}`,
			metadata: { reviewId: review._id, orderId, type },
			io: getIO(),
		});

		return res.status(201).json(new ApiResponse(201, review, 'Review created successfully'));
	} catch (error) {
		throw error;
	}
});

const getGigReviews = asyncHandler(async (req, res) => {
	try {
		const { gigId } = req.params;
		const { page, limit, skip } = parsePagination(req.query);
		const sort = parseSort(String(req.query.sort || 'recent'));

		const filters = {
			gig: gigId,
			isPublic: true,
			type: REVIEW_TYPE_CLIENT_TO_FREELANCER,
		};

		const [reviews, totalReviews, averageSummary, ratingBreakdown] = await Promise.all([
			Review.find(filters)
				.populate({ path: 'reviewer', select: 'fullName avatar' })
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean(),
			Review.countDocuments(filters),
			getAverageRating(filters),
			getRatingBreakdown(filters),
		]);

		const totalPages = Math.max(Math.ceil(totalReviews / limit), 1);

		return res.status(200).json(
			new ApiResponse(
				200,
				{
					reviews,
					totalReviews,
					averageRating: Number(averageSummary.averageRating.toFixed(2)),
					ratingBreakdown,
					currentPage: page,
					totalPages,
				},
				'Gig reviews fetched successfully',
			),
		);
	} catch (error) {
		throw error;
	}
});

const getUserReviews = asyncHandler(async (req, res) => {
	try {
		const { userId } = req.params;
		const { page, limit, skip } = parsePagination(req.query);
		const sort = parseSort(String(req.query.sort || 'recent'));

		const filters = {
			reviewee: userId,
			isPublic: true,
		};

		const loadReviews = async (withPopulate) => {
			let query = Review.find(filters).sort(sort).skip(skip).limit(limit);

			if (withPopulate) {
				query = query
					.populate({ path: 'reviewer', select: 'fullName avatar' })
					.populate({ path: 'gig', select: 'title' });
			}

			return query.lean();
		};

		const [totalReviews, averageSummary, ratingBreakdown] = await Promise.all([
			Review.countDocuments(filters),
			getAverageRating(filters),
			getRatingBreakdown(filters),
		]);

		let reviews = [];

		try {
			reviews = await loadReviews(true);
		} catch (queryError) {
			if (queryError?.name !== 'CastError') {
				throw queryError;
			}

			// Fallback for malformed legacy refs so public profile pages do not fail with 500.
			reviews = await loadReviews(false);
		}

		const totalPages = Math.max(Math.ceil(totalReviews / limit), 1);

		return res.status(200).json(
			new ApiResponse(
				200,
				{
					reviews,
					totalReviews,
					averageRating: Number(averageSummary.averageRating.toFixed(2)),
					ratingBreakdown,
					currentPage: page,
					totalPages,
				},
				'User reviews fetched successfully',
			),
		);
	} catch (error) {
		throw error;
	}
});

const getOrderReviews = asyncHandler(async (req, res) => {
	try {
		const { orderId } = req.params;
		const requesterId = String(req.user._id);

		const order = await Order.findById(orderId).select('status clientId freelancerId').lean();

		if (!order) {
			throw new ApiError(404, 'Order not found');
		}

		const { buyerId, sellerId } = getOrderPartyIds(order);

		if (![buyerId, sellerId].includes(requesterId)) {
			throw new ApiError(403, 'You are not allowed to access reviews for this order');
		}

		const reviews = await Review.find({ order: orderId })
			.populate({ path: 'reviewer', select: 'fullName avatar' })
			.populate({ path: 'reviewee', select: 'fullName avatar' })
			.populate({ path: 'gig', select: 'title' })
			.sort({ createdAt: -1 })
			.lean();

		const hasClientReview = reviews.some((review) => review.type === REVIEW_TYPE_CLIENT_TO_FREELANCER);
		const hasFreelancerReview = reviews.some((review) => review.type === REVIEW_TYPE_FREELANCER_TO_CLIENT);

		const canReviewAsClient = order.status === 'completed' && requesterId === buyerId && !hasClientReview;
		const canReviewAsFreelancer = order.status === 'completed' && requesterId === sellerId && !hasFreelancerReview;

		return res.status(200).json(
			new ApiResponse(
				200,
				{
					reviews,
					canReviewAsClient,
					canReviewAsFreelancer,
				},
				'Order reviews fetched successfully',
			),
		);
	} catch (error) {
		throw error;
	}
});

const updateReview = asyncHandler(async (req, res) => {
	try {
		const { reviewId } = req.params;
		const { rating, comment } = req.body;

		const review = await Review.findById(reviewId);

		if (!review) {
			throw new ApiError(404, 'Review not found');
		}

		if (String(review.reviewer) !== String(req.user._id)) {
			throw new ApiError(403, 'You can only update your own review');
		}

		if (rating === undefined && comment === undefined) {
			throw new ApiError(400, 'At least one field (rating or comment) is required');
		}

		if (rating !== undefined) {
			const normalizedRating = Number(rating);
			if (normalizedRating < 1 || normalizedRating > 5) {
				throw new ApiError(400, 'rating must be between 1 and 5');
			}
			review.rating = normalizedRating;
		}

		if (comment !== undefined) {
			const normalizedComment = String(comment).trim();
			if (normalizedComment.length < 10 || normalizedComment.length > 1000) {
				throw new ApiError(400, 'comment must be between 10 and 1000 characters');
			}
			review.comment = normalizedComment;
		}

		await review.save();

		if (review.type === REVIEW_TYPE_CLIENT_TO_FREELANCER) {
			const order = await Order.findById(review.order).select('freelancerId').lean();
			await Promise.all([
				recalculateGigRatings(review.gig),
				recalculateFreelancerProfileRatings(order?.freelancerId),
			]);
		}

		const updatedReview = await Review.findById(review._id)
			.populate({ path: 'reviewer', select: 'fullName avatar' })
			.populate({ path: 'reviewee', select: 'fullName avatar' })
			.populate({ path: 'gig', select: 'title' })
			.lean();

		return res.status(200).json(new ApiResponse(200, updatedReview, 'Review updated successfully'));
	} catch (error) {
		throw error;
	}
});

const deleteReview = asyncHandler(async (req, res) => {
	try {
		const { reviewId } = req.params;

		const review = await Review.findById(reviewId);

		if (!review) {
			throw new ApiError(404, 'Review not found');
		}

		const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];
		const isAdmin = userRoles.includes('admin');

		if (!isAdmin && String(review.reviewer) !== String(req.user._id)) {
			throw new ApiError(403, 'You are not allowed to delete this review');
		}

		const reviewGig = review.gig;
		const reviewType = review.type;
		const order = await Order.findById(review.order).select('freelancerId').lean();

		await review.deleteOne();

		if (reviewType === REVIEW_TYPE_CLIENT_TO_FREELANCER) {
			await Promise.all([
				recalculateGigRatings(reviewGig),
				recalculateFreelancerProfileRatings(order?.freelancerId),
			]);
		}

		return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
	} catch (error) {
		throw error;
	}
});

const getMyReviews = asyncHandler(async (req, res) => {
	try {
		const { page, limit, skip } = parsePagination(req.query);
		const sort = parseSort(String(req.query.sort || 'recent'));

		const filters = {
			reviewer: req.user._id,
		};

		const [reviews, totalReviews, averageSummary, ratingBreakdown] = await Promise.all([
			Review.find(filters)
				.populate({ path: 'reviewee', select: 'fullName avatar' })
				.populate({ path: 'gig', select: 'title' })
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.lean(),
			Review.countDocuments(filters),
			getAverageRating(filters),
			getRatingBreakdown(filters),
		]);

		const totalPages = Math.max(Math.ceil(totalReviews / limit), 1);

		return res.status(200).json(
			new ApiResponse(
				200,
				{
					reviews,
					totalReviews,
					averageRating: Number(averageSummary.averageRating.toFixed(2)),
					ratingBreakdown,
					currentPage: page,
					totalPages,
				},
				'My reviews fetched successfully',
			),
		);
	} catch (error) {
		throw error;
	}
});

export {
	createReview,
	deleteReview,
	getGigReviews,
	getMyReviews,
	getOrderReviews,
	getUserReviews,
	updateReview,
};

export default {
	createReview,
	getGigReviews,
	getUserReviews,
	getOrderReviews,
	updateReview,
	deleteReview,
	getMyReviews,
};

