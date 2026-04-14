import mongoose from 'mongoose';

import { asyncHandler } from '../middleware/error.middleware.js';
import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const parseIsReadFilter = (value) => {
	if (value === undefined || value === null || value === '' || value === 'all') {
		return null;
	}

	if (value === true || value === 'true') {
		return true;
	}

	if (value === false || value === 'false') {
		return false;
	}

	throw new ApiError(400, 'isRead must be true, false, or all');
};

const toNotificationPayload = (notification) => {
	const sender = notification?.sender;

	return {
		_id: notification?._id,
		recipient: notification?.recipient,
		sender: sender
			? {
					_id: sender._id,
					name: sender.fullName || sender.name || 'User',
					avatar: sender.avatar?.url || sender.avatar || '',
			  }
			: undefined,
		type: notification?.type,
		title: notification?.title,
		message: notification?.message,
		link: notification?.link || '',
		isRead: Boolean(notification?.isRead),
		readAt: notification?.readAt,
		metadata: notification?.metadata || {},
		createdAt: notification?.createdAt,
		updatedAt: notification?.updatedAt,
	};
};

const getNotifications = asyncHandler(async (req, res) => {
	const { page, limit, skip } = parsePagination(req.query);
	const isRead = parseIsReadFilter(req.query.isRead);
	const filters = { recipient: req.user._id };

	if (typeof isRead === 'boolean') {
		filters.isRead = isRead;
	}

	const [notifications, totalCount, unreadCount] = await Promise.all([
		Notification.find(filters)
			.populate('sender', 'fullName avatar')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Notification.countDocuments(filters),
		Notification.countDocuments({ recipient: req.user._id, isRead: false }),
	]);

	const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				notifications: notifications.map(toNotificationPayload),
				totalCount,
				unreadCount,
				currentPage: page,
				totalPages,
			},
			'Notifications fetched successfully',
		),
	);
});

const getUnreadCount = asyncHandler(async (req, res) => {
	const count = await Notification.countDocuments({
		recipient: req.user._id,
		isRead: false,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, { count }, 'Unread notification count fetched successfully'));
});

const markAsRead = asyncHandler(async (req, res) => {
	const { notificationId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(notificationId)) {
		throw new ApiError(400, 'Invalid notification ID');
	}

	const notification = await Notification.findOneAndUpdate(
		{ _id: notificationId, recipient: req.user._id },
		{ $set: { isRead: true, readAt: new Date() } },
		{ new: true },
	)
		.populate('sender', 'fullName avatar')
		.lean();

	if (!notification) {
		throw new ApiError(404, 'Notification not found');
	}

	return res
		.status(200)
		.json(new ApiResponse(200, toNotificationPayload(notification), 'Notification marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
	const result = await Notification.updateMany(
		{ recipient: req.user._id, isRead: false },
		{ $set: { isRead: true, readAt: new Date() } },
	);

	return res.status(200).json(
		new ApiResponse(
			200,
			{ modifiedCount: Number(result.modifiedCount || 0) },
			'All notifications marked as read',
		),
	);
});

const deleteNotification = asyncHandler(async (req, res) => {
	const { notificationId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(notificationId)) {
		throw new ApiError(400, 'Invalid notification ID');
	}

	const deleted = await Notification.findOneAndDelete({
		_id: notificationId,
		recipient: req.user._id,
	});

	if (!deleted) {
		throw new ApiError(404, 'Notification not found');
	}

	return res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
});

const deleteAllRead = asyncHandler(async (req, res) => {
	await Notification.deleteMany({
		recipient: req.user._id,
		isRead: true,
	});

	return res.status(200).json(new ApiResponse(200, null, 'Read notifications deleted successfully'));
});

const createNotification = async ({ recipient, sender, type, title, message, link, metadata, io }) => {
	try {
		if (!recipient || !type || !title || !message) {
			return null;
		}

		const notification = await Notification.create({
			recipient,
			sender: sender || null,
			type,
			title,
			message,
			link: link || '',
			metadata: metadata || {},
		});

		const emittedNotification = await Notification.findById(notification._id)
			.populate('sender', 'fullName avatar')
			.lean();

		if (io && emittedNotification) {
			io.to(String(recipient)).emit('new_notification', toNotificationPayload(emittedNotification));
		}

		return emittedNotification ? toNotificationPayload(emittedNotification) : null;
	} catch (error) {
		console.error('Failed to create notification:', error?.message || error);
		return null;
	}
};

export {
	createNotification,
	deleteAllRead,
	deleteNotification,
	getNotifications,
	getUnreadCount,
	markAllAsRead,
	markAsRead,
};

export default {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	deleteAllRead,
};
