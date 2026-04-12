import mongoose from 'mongoose';

const { Schema } = mongoose;

const NOTIFICATION_TYPES = [
	'order_created',
	'order_paid',
	'order_delivered',
	'revision_requested',
	'order_completed',
	'proposal_received',
	'proposal_accepted',
	'message_received',
	'review_received',
	'system',
];

const NOTIFICATION_CHANNELS = ['in_app', 'email'];

const notificationSchema = new Schema(
	{
		recipient: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		actor: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		type: {
			type: String,
			enum: NOTIFICATION_TYPES,
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 180,
		},
		message: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1200,
		},
		channel: {
			type: String,
			enum: NOTIFICATION_CHANNELS,
			default: 'in_app',
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: {},
		},
		isRead: {
			type: Boolean,
			default: false,
			index: true,
		},
		readAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
		collection: 'notifications',
	},
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

notificationSchema.pre('save', function syncReadAt(next) {
	if (this.isRead && !this.readAt) {
		this.readAt = new Date();
	}

	if (!this.isRead) {
		this.readAt = null;
	}

	next();
});

const Notification =
	mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, Notification };
export default Notification;

