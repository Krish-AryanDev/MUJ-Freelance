import mongoose from 'mongoose';

const { Schema } = mongoose;

const ORDER_STATUSES = ['active', 'delivered', 'revision', 'completed', 'cancelled', 'disputed', 'resolved'];
const PACKAGE_TIERS = ['basic', 'standard', 'premium'];

const createOrderNumber = () => {
	const timestampPart = Date.now().toString(36).toUpperCase();
	const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `ORD-${timestampPart}-${randomPart}`;
};

const orderSchema = new Schema(
	{
		orderNumber: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
		},
		gigId: {
			type: Schema.Types.ObjectId,
			ref: 'Gig',
			required: true,
			index: true,
		},
		clientId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		freelancerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		packageTier: {
			type: String,
			enum: PACKAGE_TIERS,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 1,
		},
		deadline: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: ORDER_STATUSES,
			default: 'active',
			index: true,
		},
		revisionsAllowed: {
			type: Number,
			min: 0,
			required: true,
		},
		revisionsUsed: {
			type: Number,
			min: 0,
			default: 0,
		},
		deliveryMessage: {
			type: String,
			trim: true,
			default: '',
			maxlength: 4000,
		},
		attachments: {
			type: [String],
			default: [],
		},
		revisionNote: {
			type: String,
			trim: true,
			default: '',
			maxlength: 2000,
		},
		disputeReason: {
			type: String,
			trim: true,
			default: '',
			maxlength: 2000,
		},
		deliveredAt: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: null,
		},
		cancelledAt: {
			type: Date,
			default: null,
		},
		disputedAt: {
			type: Date,
			default: null,
		},
		adminResolution: {
			note: {
				type: String,
				trim: true,
				default: '',
				maxlength: 2000,
			},
			resolvedAt: {
				type: Date,
				default: null,
			},
			resolvedBy: {
				type: Schema.Types.ObjectId,
				ref: 'User',
				default: null,
			},
		},
	},
	{
		timestamps: true,
		collection: 'orders',
	},
);

orderSchema.index({ clientId: 1, createdAt: -1 });
orderSchema.index({ freelancerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre('validate', function assignOrderNumber(next) {
	// Backfill legacy records created before orderNumber existed.
	if (!this.orderNumber) {
		this.orderNumber = createOrderNumber();
	}

	next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export { ORDER_STATUSES, PACKAGE_TIERS, Order };
export default Order;

