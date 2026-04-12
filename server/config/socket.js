import { Server } from 'socket.io';

let ioInstance;
const activeUsers = new Map();

const registerUserSocket = (userId, socketId) => {
	if (!userId) {
		return;
	}

	activeUsers.set(String(userId), socketId);
};

const removeUserSocket = (socketId) => {
	for (const [userId, registeredSocketId] of activeUsers.entries()) {
		if (registeredSocketId === socketId) {
			activeUsers.delete(userId);
			break;
		}
	}
};

const getUserSocketId = (userId) => activeUsers.get(String(userId));

const emitToUser = (userId, eventName, payload) => {
	if (!ioInstance) {
		return;
	}

	const socketId = getUserSocketId(userId);
	if (socketId) {
		ioInstance.to(socketId).emit(eventName, payload);
	}
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

	ioInstance.on('connection', (socket) => {
		socket.on('register_user', ({ userId }) => {
			registerUserSocket(userId, socket.id);
			socket.join(`user:${userId}`);
			ioInstance.emit('active_users', Array.from(activeUsers.keys()));
		});

		socket.on('join_conversation', ({ conversationId }) => {
			if (!conversationId) {
				return;
			}

			socket.join(`conversation:${conversationId}`);
		});

		socket.on('leave_conversation', ({ conversationId }) => {
			if (!conversationId) {
				return;
			}

			socket.leave(`conversation:${conversationId}`);
		});

		socket.on('typing_start', ({ conversationId, userId }) => {
			socket.to(`conversation:${conversationId}`).emit('typing_start', {
				conversationId,
				userId,
			});
		});

		socket.on('typing_stop', ({ conversationId, userId }) => {
			socket.to(`conversation:${conversationId}`).emit('typing_stop', {
				conversationId,
				userId,
			});
		});

		socket.on('send_message', ({ conversationId, message }) => {
			ioInstance.to(`conversation:${conversationId}`).emit('new_message', message);
		});

		socket.on('mark_read', ({ conversationId, userId }) => {
			socket.to(`conversation:${conversationId}`).emit('message_read', {
				conversationId,
				userId,
			});
		});

		socket.on('disconnect', () => {
			removeUserSocket(socket.id);
			ioInstance.emit('active_users', Array.from(activeUsers.keys()));
		});
	});

	return ioInstance;
};

const getIO = () => ioInstance;

export { emitToUser, getIO, getUserSocketId, initSocket };
export default initSocket;

