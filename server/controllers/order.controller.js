import Gig from '../models/Gig.model.js';
import Order from '../models/Order.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const getUserRoles = (user) =>
	Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);

const ensureRole = (req, role) => {
	const userRoles = getUserRoles(req.user);

	if (!userRoles.includes(role)) {
		throw new ApiError(403, `Only ${role} users can perform this action`);
	}

	return userRoles;
};

const isOrderParty = (order, userId) =>
	String(order.clientId) === String(userId) || String(order.freelancerId) === String(userId);

const orderPopulate = [
	{ path: 'gigId', select: 'title images packages' },
	{ path: 'clientId', select: 'fullName avatar email' },
	{ path: 'freelancerId', select: 'fullName avatar email' },
];

const createOrder = asyncHandler(async (req, res) => {
	ensureRole(req, 'client');

	const { gigId, packageTier } = req.body;
	const normalizedTier = String(packageTier || '').toLowerCase();

	if (!['basic', 'standard', 'premium'].includes(normalizedTier)) {
		throw new ApiError(400, 'packageTier must be one of basic, standard, premium');
	}

	const gig = await Gig.findById(gigId).lean();

	if (!gig) {
		throw new ApiError(404, 'Gig not found');
	}

	if (String(gig.freelancer) === String(req.user._id)) {
		throw new ApiError(400, 'You cannot place an order on your own gig');
	}

	const selectedPackage = Array.isArray(gig.packages)
		? gig.packages.find((pkg) => pkg.tier === normalizedTier)
		: null;

	if (!selectedPackage) {
		throw new ApiError(400, 'Selected package tier does not exist for this gig');
	}

	const deliveryDays = Number(selectedPackage.deliveryDays || 1);
	const deadline = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

	const createdOrder = await Order.create({
		gigId: gig._id,
		clientId: req.user._id,
		freelancerId: gig.freelancer,
		packageTier: normalizedTier,
		amount: Number(selectedPackage.price || 0),
		deadline,
		status: 'active',
		revisionsAllowed: Number(selectedPackage.revisions || 0),
	});

	const order = await Order.findById(createdOrder._id).populate(orderPopulate).lean();

	return res.status(201).json(new ApiResponse(201, { order }, 'Order created successfully'));
});

const getMyOrders = asyncHandler(async (req, res) => {
	const userRoles = getUserRoles(req.user);
	const isClient = userRoles.includes('client');
	const isFreelancer = userRoles.includes('freelancer');

	if (!isClient && !isFreelancer) {
		throw new ApiError(403, 'No eligible role found to view orders');
	}

	const { page, limit, skip } = parsePagination(req.query);
	const status = req.query.status ? String(req.query.status) : undefined;
	const userId = req.user._id;

	const filters = {};

	if (isClient && isFreelancer) {
		filters.$or = [{ clientId: userId }, { freelancerId: userId }];
	} else if (isClient) {
		filters.clientId = userId;
	} else {
		filters.freelancerId = userId;
	}

	if (status) {
		filters.status = status;
	}

	const [orders, total] = await Promise.all([
		Order.find(filters)
			.populate(orderPopulate)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Order.countDocuments(filters),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(200, { orders }, 'Orders fetched successfully', {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		}),
	);
});

const getOrderById = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id).populate(orderPopulate).lean();

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (!isOrderParty(order, req.user._id)) {
		throw new ApiError(403, 'You are not authorized to view this order');
	}

	return res.status(200).json(new ApiResponse(200, { order }, 'Order fetched successfully'));
});

const deliverOrder = asyncHandler(async (req, res) => {
	ensureRole(req, 'freelancer');

	const { deliveryMessage, attachments } = req.body;
	const order = await Order.findById(req.params.id);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (String(order.freelancerId) !== String(req.user._id)) {
		throw new ApiError(403, 'Only the assigned freelancer can deliver this order');
	}

	if (!['active', 'revision'].includes(order.status)) {
		throw new ApiError(400, 'Order can only be delivered when active or in revision');
	}

	order.status = 'delivered';
	order.deliveryMessage = String(deliveryMessage || '').trim();
	order.attachments = Array.isArray(attachments) ? attachments.filter(Boolean).map(String) : [];
	order.deliveredAt = new Date();

	await order.save();

	const updatedOrder = await Order.findById(order._id).populate(orderPopulate).lean();

	return res.status(200).json(new ApiResponse(200, { order: updatedOrder }, 'Order delivered successfully'));
});

const acceptDelivery = asyncHandler(async (req, res) => {
	ensureRole(req, 'client');

	const order = await Order.findById(req.params.id);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (String(order.clientId) !== String(req.user._id)) {
		throw new ApiError(403, 'Only the client can accept this delivery');
	}

	if (order.status !== 'delivered') {
		throw new ApiError(400, 'Only delivered orders can be accepted');
	}

	order.status = 'completed';
	order.completedAt = new Date();

	await order.save();

	const updatedOrder = await Order.findById(order._id).populate(orderPopulate).lean();

	return res.status(200).json(new ApiResponse(200, { order: updatedOrder }, 'Delivery accepted successfully'));
});

const requestRevision = asyncHandler(async (req, res) => {
	ensureRole(req, 'client');

	const { revisionNote } = req.body;
	const order = await Order.findById(req.params.id);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (String(order.clientId) !== String(req.user._id)) {
		throw new ApiError(403, 'Only the client can request revisions');
	}

	if (order.status !== 'delivered') {
		throw new ApiError(400, 'Revision can only be requested after delivery');
	}

	if (order.revisionsUsed >= order.revisionsAllowed) {
		throw new ApiError(400, 'No revisions remaining for this order');
	}

	order.status = 'revision';
	order.revisionsUsed += 1;
	order.revisionNote = String(revisionNote || '').trim();

	await order.save();

	const updatedOrder = await Order.findById(order._id).populate(orderPopulate).lean();

	return res.status(200).json(new ApiResponse(200, { order: updatedOrder }, 'Revision requested successfully'));
});

const cancelOrder = asyncHandler(async (req, res) => {
	ensureRole(req, 'client');

	const order = await Order.findById(req.params.id);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (String(order.clientId) !== String(req.user._id)) {
		throw new ApiError(403, 'Only the client can cancel this order');
	}

	if (order.status !== 'active') {
		throw new ApiError(400, 'Only active orders can be cancelled');
	}

	order.status = 'cancelled';
	order.cancelledAt = new Date();

	await order.save();

	const updatedOrder = await Order.findById(order._id).populate(orderPopulate).lean();

	return res.status(200).json(new ApiResponse(200, { order: updatedOrder }, 'Order cancelled successfully'));
});

const createDispute = asyncHandler(async (req, res) => {
	const { reason } = req.body;
	const order = await Order.findById(req.params.id);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (!isOrderParty(order, req.user._id)) {
		throw new ApiError(403, 'Only order participants can raise disputes');
	}

	if (!['active', 'delivered'].includes(order.status)) {
		throw new ApiError(400, 'Dispute can only be raised for active or delivered orders');
	}

	order.status = 'disputed';
	order.disputeReason = String(reason || '').trim();
	order.disputedAt = new Date();

	await order.save();

	const updatedOrder = await Order.findById(order._id).populate(orderPopulate).lean();

	return res.status(200).json(new ApiResponse(200, { order: updatedOrder }, 'Dispute created successfully'));
});

export {
	acceptDelivery,
	cancelOrder,
	createDispute,
	createOrder,
	deliverOrder,
	getMyOrders,
	getOrderById,
	requestRevision,
};

