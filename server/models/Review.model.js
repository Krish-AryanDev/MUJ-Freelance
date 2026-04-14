import mongoose from 'mongoose';

const { Schema } = mongoose;

const REVIEW_TYPES = ['client_to_freelancer', 'freelancer_to_client'];

const reviewSchema = new Schema(
	{
		order: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
			required: true,
			index: true,
		},
		gig: {
			type: Schema.Types.ObjectId,
			ref: 'Gig',
			default: null,
			index: true,
		},
		reviewer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			alias: 'from',
			index: true,
		},
		reviewee: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			alias: 'to',
			index: true,
		},
		type: {
			type: String,
			enum: REVIEW_TYPES,
			required: true,
			index: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		comment: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		isPublic: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		collection: 'reviews',
	},
);

reviewSchema.index({ order: 1, type: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ gig: 1, type: 1, createdAt: -1 });

reviewSchema.pre('validate', function validateParticipants(next) {
	if (this.reviewer && this.reviewee && this.reviewer.toString() === this.reviewee.toString()) {
		this.invalidate('reviewee', 'Reviewer and reviewee cannot be the same user');
	}

	next();
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// Cleanup legacy unique index from old schema (`order + from`) that breaks
// two-direction reviews with the new reviewer/reviewee fields.
const cleanupLegacyIndexes = async () => {
	try {
		await Review.collection.dropIndex('order_1_from_1');
	} catch (_error) {
		// Ignore if index does not exist.
	}
};

void cleanupLegacyIndexes();

export { Review };
export default Review;

