import { getIO } from '../config/socket.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const conversationPopulate = [
	{ path: 'participants', select: 'fullName avatar email' },
	{
		path: 'lastMessage',
		populate: { path: 'sender', select: 'fullName avatar email' },
	},
	{ path: 'relatedOrder', select: 'status amount packageTier' },
	{ path: 'relatedGig', select: 'title slug' },
];

const messagePopulate = [{ path: 'sender', select: 'fullName avatar email' }];

const toUserId = (value) => String(value?._id || value || '');
const toUserRoomId = (userId) => String(userId || '');

const isParticipant = (conversation, userId) => {
	const normalizedUserId = String(userId);
	return conversation.participants.some((participant) => toUserId(participant) === normalizedUserId);
};

const parsePagination = (query) => {
	const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 30, 1), 100);
	const skip = (page - 1) * limit;

	return { page, limit, skip };
};

const normalizeAttachment = (attachment) => ({
	url: String(attachment?.url || attachment?.fileUrl || '').trim(),
	name: String(attachment?.filename || attachment?.name || 'Attachment').trim(),
	size: Number(attachment?.size || attachment?.sizeInBytes || 0),
	mimeType: String(attachment?.fileType || attachment?.mimeType || '').trim(),
});

const toMessagePayload = (message, currentUserId) => {
	const userId = String(currentUserId);
	const readBy = Array.isArray(message.readBy) ? message.readBy : [];
	const ownReadEntry = readBy.find((entry) => toUserId(entry?.user) === userId);

	return {
		_id: String(message._id),
		conversation: String(message.conversation),
		sender: message.sender,
		content: message.content,
		messageType: message.type || message.messageType || 'text',
		attachments: Array.isArray(message.attachments)
			? message.attachments.map((item) => ({
				url: item.url,
				filename: item.name,
				fileType: item.mimeType,
				size: item.size,
			}))
			: [],
		isRead: Boolean(ownReadEntry || message.isRead),
		readAt: ownReadEntry?.readAt || message.readAt || null,
		readBy,
		createdAt: message.createdAt,
		updatedAt: message.updatedAt,
		deletedAt: message.deletedAt || null,
	};
};

const countUnreadForConversation = async (conversationId, userId) => {
	return Message.countDocuments({
		conversation: conversationId,
		sender: { $ne: userId },
		readBy: {
			$not: {
				$elemMatch: {
					user: userId,
				},
			},
		},
	});
};

const getConversations = asyncHandler(async (req, res) => {
	const conversations = await Conversation.find({
		participants: req.user._id,
		isActive: true,
	})
		.populate(conversationPopulate)
		.sort({ updatedAt: -1 })
		.lean();

	const conversationsWithUnread = await Promise.all(
		conversations.map(async (conversation) => {
			const unreadCount = await countUnreadForConversation(conversation._id, req.user._id);
			return {
				...conversation,
				unreadCount,
			};
		}),
	);

	return res
		.status(200)
		.json(new ApiResponse(200, conversationsWithUnread, 'Conversations fetched successfully'));
});

const getOrCreateConversation = asyncHandler(async (req, res) => {
	const { otherUserId, relatedGig, relatedOrder } = req.body;

	if (!otherUserId) {
		throw new ApiError(400, 'otherUserId is required');
	}

	if (String(otherUserId) === String(req.user._id)) {
		throw new ApiError(400, 'You cannot start a conversation with yourself');
	}

	const otherUser = await User.findById(otherUserId).select('_id').lean();
	if (!otherUser) {
		throw new ApiError(404, 'Other user not found');
	}

	const filter = {
		participants: { $all: [req.user._id, otherUser._id] },
		isActive: true,
	};

	if (relatedOrder) {
		filter.$or = [{ relatedOrder }, { order: relatedOrder }];
	}

	if (relatedGig) {
		filter.$and = [...(filter.$and || []), { $or: [{ relatedGig }, { gig: relatedGig }] }];
	}

	let conversation = await Conversation.findOne(filter).populate(conversationPopulate).lean();

	if (!conversation) {
		const created = await Conversation.create({
			type: relatedOrder ? 'order' : 'direct',
			participants: [req.user._id, otherUser._id],
			relatedOrder: relatedOrder || null,
			order: relatedOrder || null,
			relatedGig: relatedGig || null,
			gig: relatedGig || null,
			isActive: true,
		});

		conversation = await Conversation.findById(created._id).populate(conversationPopulate).lean();
	}

	return res
		.status(200)
		.json(new ApiResponse(200, conversation, 'Conversation fetched successfully'));
});

const getMessages = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { page, limit, skip } = parsePagination(req.query);

	const conversation = await Conversation.findById(id).select('participants').lean();
	if (!conversation) {
		throw new ApiError(404, 'Conversation not found');
	}

	if (!isParticipant(conversation, req.user._id)) {
		throw new ApiError(403, 'You are not a participant of this conversation');
	}

	await Message.updateMany(
		{
			conversation: id,
			sender: { $ne: req.user._id },
			readBy: {
				$not: {
					$elemMatch: {
						user: req.user._id,
					},
				},
			},
		},
		{
			$set: { isRead: true, readAt: new Date() },
			$push: { readBy: { user: req.user._id, readAt: new Date() } },
		},
	);

	const [messages, total] = await Promise.all([
		Message.find({ conversation: id })
			.populate(messagePopulate)
			.sort({ createdAt: 1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Message.countDocuments({ conversation: id }),
	]);

	const totalPages = Math.max(Math.ceil(total / limit), 1);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				messages: messages.map((message) => toMessagePayload(message, req.user._id)),
				totalPages,
				currentPage: page,
			},
			'Messages fetched successfully',
		),
	);
});

const sendMessage = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { content, messageType, attachments } = req.body;

	const conversation = await Conversation.findById(id).select('participants').lean();
	if (!conversation) {
		throw new ApiError(404, 'Conversation not found');
	}

	if (!isParticipant(conversation, req.user._id)) {
		throw new ApiError(403, 'You are not a participant of this conversation');
	}

	const normalizedType = ['text', 'image', 'file', 'order_update'].includes(String(messageType || 'text'))
		? String(messageType || 'text')
		: 'text';

	const normalizedAttachments = Array.isArray(attachments)
		? attachments
				.map(normalizeAttachment)
				.filter((item) => Boolean(item.url))
		: [];

	if (!String(content || '').trim() && normalizedAttachments.length === 0) {
		throw new ApiError(400, 'Message content or attachment is required');
	}

	const createdMessage = await Message.create({
		conversation: id,
		sender: req.user._id,
		type: normalizedType,
		content: String(content || '').trim(),
		attachments: normalizedAttachments,
		readBy: [{ user: req.user._id, readAt: new Date() }],
		isRead: true,
		readAt: new Date(),
	});

	await Conversation.findByIdAndUpdate(id, {
		lastMessage: createdMessage._id,
		lastMessageAt: new Date(),
		updatedAt: new Date(),
	});

	const message = await Message.findById(createdMessage._id).populate(messagePopulate).lean();
	const payload = toMessagePayload(message, req.user._id);

	const io = getIO();
	if (io) {
		const recipients = conversation.participants
			.map((participant) => String(participant))
			.filter((participantId) => participantId !== String(req.user._id));

		recipients.forEach((recipientId) => {
			io.to(toUserRoomId(recipientId)).emit('new_message', {
				conversationId: id,
				message: payload,
			});

			io.to(toUserRoomId(recipientId)).emit('conversation_updated', {
				conversationId: id,
				lastMessage: payload,
				updatedAt: new Date().toISOString(),
			});
		});
	}

	return res.status(201).json(new ApiResponse(201, payload, 'Message sent successfully'));
});

const markAsRead = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const conversation = await Conversation.findById(id).select('participants').lean();
	if (!conversation) {
		throw new ApiError(404, 'Conversation not found');
	}

	if (!isParticipant(conversation, req.user._id)) {
		throw new ApiError(403, 'You are not a participant of this conversation');
	}

	await Message.updateMany(
		{
			conversation: id,
			sender: { $ne: req.user._id },
			readBy: {
				$not: {
					$elemMatch: {
						user: req.user._id,
					},
				},
			},
		},
		{
			$set: { isRead: true, readAt: new Date() },
			$push: { readBy: { user: req.user._id, readAt: new Date() } },
		},
	);

	return res.status(200).json(new ApiResponse(200, null, 'Messages marked as read'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
	const conversations = await Conversation.find({ participants: req.user._id }).select('_id').lean();
	const conversationIds = conversations.map((conversation) => conversation._id);

	if (conversationIds.length === 0) {
		return res.status(200).json(new ApiResponse(200, { count: 0 }, 'Unread count fetched successfully'));
	}

	const count = await Message.countDocuments({
		conversation: { $in: conversationIds },
		sender: { $ne: req.user._id },
		readBy: {
			$not: {
				$elemMatch: {
					user: req.user._id,
				},
			},
		},
	});

	return res
		.status(200)
		.json(new ApiResponse(200, { count }, 'Unread count fetched successfully'));
});

const deleteMessage = asyncHandler(async (req, res) => {
	const { messageId } = req.params;

	const message = await Message.findById(messageId);
	if (!message) {
		throw new ApiError(404, 'Message not found');
	}

	if (String(message.sender) !== String(req.user._id)) {
		throw new ApiError(403, 'You can only delete your own messages');
	}

	message.content = 'This message was deleted';
	message.deletedAt = new Date();
	message.isEdited = true;
	message.editedAt = new Date();
	message.attachments = [];

	await message.save();

	return res.status(200).json(new ApiResponse(200, null, 'Message deleted successfully'));
});

export {
	deleteMessage,
	getConversations,
	getMessages,
	getOrCreateConversation,
	getUnreadCount,
	markAsRead,
	sendMessage,
};

