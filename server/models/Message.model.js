import mongoose from 'mongoose';

const { Schema } = mongoose;

const MESSAGE_TYPES = ['text', 'image', 'file', 'order_update', 'system'];

const attachmentSchema = new Schema(
	{
		url: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			alias: 'filename',
		},
		size: {
			type: Number,
			min: 0,
			default: 0,
		},
		mimeType: {
			type: String,
			trim: true,
			default: '',
			alias: 'fileType',
		},
	},
	{ _id: false },
);

const readReceiptSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		readAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false },
);

const messageSchema = new Schema(
	{
		conversation: {
			type: Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
			index: true,
		},
		sender: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: MESSAGE_TYPES,
			default: 'text',
			alias: 'messageType',
		},
		content: {
			type: String,
			trim: true,
			maxlength: 5000,
			default: '',
		},
		attachments: {
			type: [attachmentSchema],
			default: [],
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		readAt: {
			type: Date,
			default: null,
		},
		readBy: {
			type: [readReceiptSchema],
			default: [],
		},
		isEdited: {
			type: Boolean,
			default: false,
		},
		editedAt: {
			type: Date,
			default: null,
		},
		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
		collection: 'messages',
	},
);

messageSchema.index({ conversation: 1, createdAt: -1 });

messageSchema.pre('validate', function validateContent(next) {
	const hasContent = Boolean(this.content && this.content.trim().length > 0);
	const hasAttachment = Array.isArray(this.attachments) && this.attachments.length > 0;

	if (!hasContent && !hasAttachment && this.type !== 'system') {
		this.invalidate('content', 'Message must contain text or at least one attachment');
	}

	next();
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export { MESSAGE_TYPES, Message };
export default Message;

