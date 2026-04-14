import mongoose from 'mongoose';

const { Schema } = mongoose;

const CONVERSATION_TYPES = ['direct', 'order', 'project'];

const conversationSchema = new Schema(
	{
		type: {
			type: String,
			enum: CONVERSATION_TYPES,
			default: 'direct',
			index: true,
		},
		participants: {
			type: [
				{
					type: Schema.Types.ObjectId,
					ref: 'User',
					required: true,
				},
			],
			required: true,
			validate: {
				validator: (value) => Array.isArray(value) && value.length >= 2,
				message: 'Conversation must include at least two participants',
			},
		},
		order: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
			default: null,
		},
		relatedOrder: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
			default: null,
		},
		gig: {
			type: Schema.Types.ObjectId,
			ref: 'Gig',
			default: null,
		},
		relatedGig: {
			type: Schema.Types.ObjectId,
			ref: 'Gig',
			default: null,
		},
		project: {
			type: Schema.Types.ObjectId,
			ref: 'Project',
			default: null,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		lastMessage: {
			type: Schema.Types.ObjectId,
			ref: 'Message',
			default: null,
		},
		lastMessageAt: {
			type: Date,
			default: null,
		},
		unreadCount: {
			type: Map,
			of: Number,
			default: {},
		},
	},
	{
		timestamps: true,
		collection: 'conversations',
	},
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ order: 1 }, { sparse: true });
conversationSchema.index({ relatedOrder: 1 }, { sparse: true });
conversationSchema.index({ gig: 1 }, { sparse: true });
conversationSchema.index({ relatedGig: 1 }, { sparse: true });
conversationSchema.index({ project: 1 }, { sparse: true });

conversationSchema.pre('validate', function validateScopedEntity(next) {
	if (this.type === 'order' && !this.order) {
		this.invalidate('order', 'Order conversation must reference an order');
	}

	if (this.type === 'project' && !this.project) {
		this.invalidate('project', 'Project conversation must reference a project');
	}

	next();
});

const Conversation =
	mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export { CONVERSATION_TYPES, Conversation };
export default Conversation;

