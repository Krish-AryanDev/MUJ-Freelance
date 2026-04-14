/**
 * MOCK PAYMENT SYSTEM
 *
 * This is a simulated payment system for development.
 * No real money is processed.
 *
 * TODO: Replace with real payment gateway when deploying:
 * 1. Register business on Cashfree/Razorpay
 * 2. Complete KYC verification
 * 3. Get API credentials
 * 4. Replace initiatePayment with real API call
 * 5. Replace confirmPayment with webhook handler
 * 6. Add real payout API for freelancer bank transfer
 * 7. Store bank account details securely
 */

import Order from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import User from '../models/User.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const getUserRoles = (user) =>
	Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);

const initiatePayment = asyncHandler(async (req, res) => {
	const { orderId } = req.body;

	const order = await Order.findById(orderId);

	if (!order) {
		throw new ApiError(404, 'Order not found');
	}

	if (String(req.user._id) !== String(order.clientId)) {
		throw new ApiError(403, 'Only the order client can initiate payment');
	}

	const existing = await Payment.findOne({ orderId: order._id });

	if (existing && existing.status === 'completed') {
		throw new ApiError(400, 'Payment already completed');
	}

	const commissionPercent = 3;
	const commission = Math.round((order.amount * commissionPercent) / 100);
	const freelancerAmount = order.amount - commission;

	const payment = await Payment.findOneAndUpdate(
		{ orderId: order._id },
		{
			orderId: order._id,
			clientId: order.clientId,
			freelancerId: order.freelancerId,
			amount: order.amount,
			commissionPercent,
			commission,
			freelancerAmount,
			status: 'pending',
		},
		{ upsert: true, new: true, setDefaultsOnInsert: true },
	);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ payment },
			'Mock payment initiated successfully',
		),
	);
});

const confirmPayment = asyncHandler(async (req, res) => {
	const { paymentId, action } = req.body;

	const payment = await Payment.findById(paymentId);

	if (!payment) {
		throw new ApiError(404, 'Payment not found');
	}

	if (payment.status !== 'pending') {
		throw new ApiError(400, 'Only pending payments can be confirmed');
	}

	if (action === 'success') {
		payment.status = 'completed';
		payment.paidAt = new Date();
		await payment.save();

		return res.status(200).json(new ApiResponse(200, { payment }, 'Payment confirmed successfully'));
	}

	if (action === 'failure') {
		payment.status = 'failed';
		payment.failedAt = new Date();
		await payment.save();
		throw new ApiError(400, 'Payment failed');
	}

	throw new ApiError(400, 'Invalid payment action');
});

const releasePaymentForOrder = async (orderId) => {
	const payment = await Payment.findOne({ orderId });

	if (!payment || payment.status !== 'completed') {
		throw new ApiError(400, 'No completed payment found for this order');
	}

	payment.status = 'released';
	payment.releasedAt = new Date();
	await payment.save();

	await User.findByIdAndUpdate(payment.freelancerId, {
		$inc: {
			totalEarnings: payment.freelancerAmount,
			completedOrders: 1,
		},
	});

	return payment;
};

const refundPaymentForOrder = async (orderId) => {
	const payment = await Payment.findOne({ orderId });

	if (!payment) {
		return null;
	}

	if (payment.status === 'completed') {
		payment.status = 'refunded';
		payment.refundedAt = new Date();
		payment.notes = 'Order cancelled by client';
		await payment.save();
	}

	return payment;
};

const getPaymentHistory = asyncHandler(async (req, res) => {
	const userRoles = getUserRoles(req.user);
	const query = {};

	const isClient = userRoles.includes('client');
	const isFreelancer = userRoles.includes('freelancer');

	if (isClient && isFreelancer) {
		query.$or = [{ clientId: req.user._id }, { freelancerId: req.user._id }];
	} else if (isClient) {
		query.clientId = req.user._id;
	} else if (isFreelancer) {
		query.freelancerId = req.user._id;
	} else {
		throw new ApiError(403, 'No eligible role found to access payment history');
	}

	const payments = await Payment.find(query)
		.populate({ path: 'orderId', select: 'gigId packageTier amount createdAt' })
		.populate({ path: 'clientId', select: 'fullName avatar' })
		.populate({ path: 'freelancerId', select: 'fullName avatar' })
		.sort({ createdAt: -1 })
		.lean();

	return res.status(200).json(new ApiResponse(200, { payments }, 'Payment history fetched successfully'));
});

const getEarnings = asyncHandler(async (req, res) => {
	const payments = await Payment.find({ freelancerId: req.user._id })
		.populate({ path: 'orderId', select: 'gigId packageTier amount createdAt' })
		.populate({ path: 'clientId', select: 'fullName avatar' })
		.sort({ createdAt: -1 })
		.lean();

	const totalEarnings = payments
		.filter((payment) => payment.status === 'released')
		.reduce((sum, payment) => sum + payment.freelancerAmount, 0);

	const pendingEarnings = payments
		.filter((payment) => payment.status === 'completed')
		.reduce((sum, payment) => sum + payment.freelancerAmount, 0);

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const thisMonthEarnings = payments
		.filter((payment) => payment.status === 'released' && payment.releasedAt && new Date(payment.releasedAt) >= thisMonth)
		.reduce((sum, payment) => sum + payment.freelancerAmount, 0);

	const totalOrders = payments.filter((payment) => payment.status === 'released').length;

	const commissionPaid = payments
		.filter((payment) => payment.status === 'released')
		.reduce((sum, payment) => sum + payment.commission, 0);

	const earnings = {
		totalEarnings,
		pendingEarnings,
		thisMonthEarnings,
		totalOrders,
		commissionPaid,
	};

	return res.status(200).json(new ApiResponse(200, { earnings, payments }, 'Earnings fetched successfully'));
});

export {
	confirmPayment,
	getEarnings,
	getPaymentHistory,
	initiatePayment,
	releasePaymentForOrder,
	refundPaymentForOrder,
};

