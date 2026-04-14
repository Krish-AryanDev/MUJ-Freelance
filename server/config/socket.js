import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../models/User.model.js';

let ioInstance;
const activeUsers = new Map();

const toUserRoomId = (userId) => String(userId || '');

const getTokenFromHandshake = (socket) => {
	const authToken = socket?.handshake?.auth?.token;
	if (!authToken || typeof authToken !== 'string') {
		return '';
	}

	return authToken.startsWith('Bearer ') ? authToken.slice(7).trim() : authToken.trim();
};

const registerUserSocket = (userId, socketId) => {
	if (!userId) {
		return;
	}

	const normalizedUserId = toUserRoomId(userId);
	const existingSockets = activeUsers.get(normalizedUserId) || new Set();
	existingSockets.add(socketId);
	activeUsers.set(normalizedUserId, existingSockets);
};

const removeUserSocket = (socketId) => {
	for (const [userId, socketIds] of activeUsers.entries()) {
		if (!socketIds.has(socketId)) {
			continue;
		}

		socketIds.delete(socketId);
		if (socketIds.size === 0) {
			activeUsers.delete(userId);
		} else {
			activeUsers.set(userId, socketIds);
		}

		break;
	}
};

const getUserSocketId = (userId) => {
	const socketIds = activeUsers.get(toUserRoomId(userId));
	if (!socketIds || socketIds.size === 0) {
		return undefined;
	}

	return Array.from(socketIds)[0];
};

const emitToUser = (userId, eventName, payload) => {
	if (!ioInstance) {
		return;
	}

	ioInstance.to(toUserRoomId(userId)).emit(eventName, payload);
};

const initSocket = (httpServer) => {
	if (ioInstance) {
		return ioInstance;
	}

	ioInstance = new Server(httpServer, {
		cors: {
			origin: process.env.CLIENT_URL || 'http://localhost:3000',
			credentials: true,
		},
	});

	ioInstance.use(async (socket, next) => {
		try {
			const token = getTokenFromHandshake(socket);
			if (!token) {
				return next(new Error('Unauthorized: Missing token'));
			}

			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const userId = decoded?._id;
			if (!userId) {
				return next(new Error('Unauthorized: Invalid token payload'));
			}

			const user = await User.findById(userId).select('-password -refreshToken');
			if (!user) {
				return next(new Error('Unauthorized: User not found'));
			}

			socket.user = user;
			return next();
		} catch (_error) {
			return next(new Error('Unauthorized: Invalid token'));
		}
	});

	ioInstance.on('connection', (socket) => {
		const connectedUserId = toUserRoomId(socket?.user?._id);
		registerUserSocket(connectedUserId, socket.id);
		socket.join(connectedUserId);
		console.log(`User connected: ${connectedUserId}`);
		ioInstance.emit('active_users', Array.from(activeUsers.keys()));

		socket.on('register_user', async (_payload) => {
			try {
				registerUserSocket(connectedUserId, socket.id);
				socket.join(connectedUserId);
			} catch (_error) {
				// Ignore user re-registration errors and keep socket alive.
			}

			ioInstance.emit('active_users', Array.from(activeUsers.keys()));
		});

		socket.on('join_conversation', ({ conversationId }) => {
			if (!conversationId) {
				return;
			}

			socket.join(String(conversationId));
		});

		socket.on('leave_conversation', ({ conversationId }) => {
			if (!conversationId) {
				return;
			}

			socket.leave(String(conversationId));
		});

		socket.on('typing_start', ({ conversationId, userId }) => {
			socket.to(String(conversationId)).emit('typing_start', {
				conversationId,
				userId,
			});
		});

		socket.on('typing_stop', ({ conversationId, userId }) => {
			socket.to(String(conversationId)).emit('typing_stop', {
				conversationId,
				userId,
			});
		});

		socket.on('send_message', ({ conversationId, message }) => {
			ioInstance.to(String(conversationId)).emit('new_message', message);
		});

		socket.on('mark_read', ({ conversationId, userId }) => {
			socket.to(String(conversationId)).emit('message_read', {
				conversationId,
				userId,
			});
		});

		socket.on('disconnect', () => {
			removeUserSocket(socket.id);
			console.log(`User disconnected: ${connectedUserId}`);
			ioInstance.emit('active_users', Array.from(activeUsers.keys()));
		});
	});

	return ioInstance;
};

const getIO = () => ioInstance;

export { ioInstance as io, emitToUser, getIO, getUserSocketId, initSocket, toUserRoomId };
export default initSocket;

