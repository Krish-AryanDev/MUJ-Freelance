import mongoose from 'mongoose';

import FreelancerProfile from '../models/FreelancerProfile.model.js';
import Gig from '../models/Gig.model.js';
import Order from '../models/Order.model.js';
import Project from '../models/Project.model.js';
import Review from '../models/Review.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const toSafeUser = (user) => {
	if (!user) {
		return null;
	}

	const source = typeof user.toObject === 'function' ? user.toObject() : user;
	const { password, refreshToken, __v, ...safe } = source;
	return safe;
};

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const getMyProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).select('-password -refreshToken').lean();

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	const freelancerProfile = await FreelancerProfile.findOne({ user: user._id }).lean();

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				user: toSafeUser(user),
				freelancerProfile,
			},
			'User profile fetched successfully',
		),
	);
});

const updateMyProfile = asyncHandler(async (req, res) => {
	const { fullName, avatarUrl, avatarPublicId } = req.body;

	if (!fullName && avatarUrl === undefined && avatarPublicId === undefined) {
		throw new ApiError(400, 'At least one profile field is required to update');
	}

	const update = {};

	if (fullName) {
		update.fullName = String(fullName).trim();
	}

	if (avatarUrl !== undefined) {
		update['avatar.url'] = String(avatarUrl || '').trim();
	}

	if (avatarPublicId !== undefined) {
		update['avatar.publicId'] = String(avatarPublicId || '').trim();
	}

	const updatedUser = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true })
		.select('-password -refreshToken')
		.lean();

	if (!updatedUser) {
		throw new ApiError(404, 'User not found');
	}

	return res
		.status(200)
		.json(new ApiResponse(200, { user: toSafeUser(updatedUser) }, 'User profile updated successfully'));
});

const getUserPublicProfile = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError(400, 'Invalid user ID');
	}

	const user = await User.findById(userId)
		.select('fullName roles avatar isEmailVerified createdAt accountStatus')
		.lean();

	if (!user || user.accountStatus === 'blocked') {
		throw new ApiError(404, 'User not found');
	}

	const freelancerProfile = await FreelancerProfile.findOne({ user: user._id })
		.select('-__v -createdAt -updatedAt')
		.lean();

	const [totalPublicReviews, gigsPublished, projectsPosted, ordersCompleted] = await Promise.all([
		Review.countDocuments({ to: user._id, isPublic: true }),
		Gig.countDocuments({ freelancer: user._id, status: 'published' }),
		Project.countDocuments({ client: user._id }),
		Order.countDocuments({
			$or: [{ client: user._id }, { freelancer: user._id }],
			status: 'completed',
		}),
	]);

	const responseUser = {
		_id: user._id,
		fullName: user.fullName,
		roles: user.roles,
		avatar: user.avatar,
		isEmailVerified: user.isEmailVerified,
		joinedAt: user.createdAt,
	};

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				user: responseUser,
				freelancerProfile,
				stats: {
					totalPublicReviews,
					gigsPublished,
					projectsPosted,
					ordersCompleted,
				},
			},
			'Public user profile fetched successfully',
		),
	);
});

const listUsersForAdmin = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const { role, status, search } = req.query;

	const filters = {};

	if (role) {
		filters.roles = String(role).toLowerCase();
	}

	if (status) {
		filters.accountStatus = String(status).toLowerCase();
	}

	if (search) {
		const safeSearch = String(search).trim();
		filters.$or = [
			{ fullName: { $regex: safeSearch, $options: 'i' } },
			{ email: { $regex: safeSearch, $options: 'i' } },
		];
	}

	const [items, total] = await Promise.all([
		User.find(filters)
			.select('-password -refreshToken')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		User.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ users: items.map(toSafeUser) },
			'Users fetched successfully',
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

export { getMyProfile, getUserPublicProfile, listUsersForAdmin, updateMyProfile };

export default {
	getMyProfile,
	updateMyProfile,
	getUserPublicProfile,
	listUsersForAdmin,
};

