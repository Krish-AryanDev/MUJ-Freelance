import mongoose from 'mongoose';

import Order from '../models/Order.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const toMonthlySeries = (raw, keyField, valueField = 'total') => {
	const monthMap = new Map(raw.map((item) => [Number(item[keyField]), Number(item[valueField] || 0)]));

	return Array.from({ length: 12 }, (_, index) => ({
		month: index + 1,
		value: monthMap.get(index + 1) || 0,
	}));
};

const getDashboardStats = asyncHandler(async (_req, res) => {
	const [users, orders, projects, disputedOrders, completedRevenue, monthlyRevenueRaw] = await Promise.all([
		User.countDocuments({}),
		Order.countDocuments({}),
		Project.countDocuments({}),
		Order.countDocuments({ status: 'disputed' }),
		Order.aggregate([
			{ $match: { status: 'completed' } },
			{ $group: { _id: null, total: { $sum: '$amount' } } },
		]),
		Order.aggregate([
			{ $match: { status: 'completed' } },
			{
				$group: {
					_id: { $month: '$createdAt' },
					total: { $sum: '$amount' },
				},
			},
			{ $project: { _id: 0, month: '$_id', total: 1 } },
			{ $sort: { month: 1 } },
		]),
	]);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				stats: {
					totalUsers: users,
					totalOrders: orders,
					totalProjects: projects,
					disputedOrders,
					totalRevenue: Number(completedRevenue[0]?.total || 0),
				},
				monthlyRevenue: toMonthlySeries(monthlyRevenueRaw, 'month'),
			},
			'Dashboard statistics fetched successfully',
		),
	);
});

const getUsers = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const { search, role, status } = req.query;

	const filters = {};

	if (search) {
		filters.$or = [
			{ fullName: { $regex: String(search).trim(), $options: 'i' } },
			{ email: { $regex: String(search).trim(), $options: 'i' } },
		];
	}

	if (role) {
		filters.roles = String(role);
	}

	if (status) {
		filters.accountStatus = String(status);
	}

	const [users, total] = await Promise.all([
		User.find(filters)
			.select('-password -refreshToken')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		User.countDocuments(filters),
	]);

	const mappedUsers = users.map((user) => ({
		...user,
		id: String(user._id),
	}));

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ users: mappedUsers },
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

const banUser = asyncHandler(async (req, res) => {
	const userId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError(400, 'Invalid user ID');
	}

	const user = await User.findById(userId);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	if (String(user._id) === String(req.user._id)) {
		throw new ApiError(400, 'You cannot block your own account');
	}

	user.accountStatus = 'blocked';
	await user.save();

	return res.status(200).json(new ApiResponse(200, { user }, 'User blocked successfully'));
});

const unbanUser = asyncHandler(async (req, res) => {
	const userId = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError(400, 'Invalid user ID');
	}

	const user = await User.findById(userId);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	user.accountStatus = 'active';
	await user.save();

	return res.status(200).json(new ApiResponse(200, { user }, 'User unblocked successfully'));
});

const getOrders = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const { status } = req.query;

	const filters = {};

	if (status) {
		filters.status = String(status);
	}

	const [orders, total] = await Promise.all([
		Order.find(filters)
			.populate('clientId', 'fullName email avatar accountStatus')
			.populate('freelancerId', 'fullName email avatar accountStatus')
			.populate('gigId', 'title status')
			.populate('adminResolution.resolvedBy', 'fullName email')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Order.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ orders },
			'Orders fetched successfully',
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

const getDisputes = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);

	const [orders, total] = await Promise.all([
		Order.find({ status: 'disputed' })
			.populate('clientId', 'fullName email avatar accountStatus')
			.populate('freelancerId', 'fullName email avatar accountStatus')
			.populate('gigId', 'title')
			.sort({ disputedAt: -1, createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Order.countDocuments({ status: 'disputed' }),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ disputes: orders },
			'Disputes fetched successfully',
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

const resolveDispute = asyncHandler(async (req, res) => {
	const orderId = req.params.id;
	const { resolutionNote } = req.body;

	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		throw new ApiError(400, 'Invalid order ID');
	}

	if (!resolutionNote || !String(resolutionNote).trim()) {
		throw new ApiError(400, 'Resolution note is required');
	}

	const order = await Order.findById(orderId);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (order.status !== 'disputed') {
		throw new ApiError(400, 'Only disputed orders can be resolved');
	}

	order.status = 'resolved';
	order.adminResolution = {
		note: String(resolutionNote).trim(),
		resolvedAt: new Date(),
		resolvedBy: req.user._id,
	};

	await order.save();

	const populatedOrder = await Order.findById(order._id)
		.populate('clientId', 'fullName email avatar accountStatus')
		.populate('freelancerId', 'fullName email avatar accountStatus')
		.populate('gigId', 'title status')
		.populate('adminResolution.resolvedBy', 'fullName email')
		.lean();

	return res.status(200).json(new ApiResponse(200, { order: populatedOrder }, 'Dispute resolved successfully'));
});

const getAnalytics = asyncHandler(async (_req, res) => {
	const [monthlyRevenueRaw, usersByRoleRaw, orderStatusRaw] = await Promise.all([
		Order.aggregate([
			{ $match: { status: 'completed' } },
			{
				$group: {
					_id: { $month: '$createdAt' },
					total: { $sum: '$amount' },
				},
			},
			{ $project: { _id: 0, month: '$_id', total: 1 } },
			{ $sort: { month: 1 } },
		]),
		User.aggregate([
			{ $unwind: '$roles' },
			{ $group: { _id: '$roles', count: { $sum: 1 } } },
			{ $project: { _id: 0, role: '$_id', count: 1 } },
		]),
		Order.aggregate([
			{ $group: { _id: '$status', count: { $sum: 1 } } },
			{ $project: { _id: 0, status: '$_id', count: 1 } },
		]),
	]);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				monthlyRevenue: toMonthlySeries(monthlyRevenueRaw, 'month'),
				usersByRole: usersByRoleRaw,
				ordersByStatus: orderStatusRaw,
			},
			'Analytics fetched successfully',
		),
	);
});

export {
	getDashboardStats,
	getUsers,
	banUser,
	unbanUser,
	getOrders,
	getDisputes,
	resolveDispute,
	getAnalytics,
};

