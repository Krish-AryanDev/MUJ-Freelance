import mongoose from 'mongoose';

const { Schema } = mongoose;

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
		from: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		to: {
			type: Schema.Types.ObjectId,
			ref: 'User',
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
			trim: true,
			maxlength: 2000,
			default: '',
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

reviewSchema.index({ order: 1, from: 1 }, { unique: true });
reviewSchema.index({ to: 1, createdAt: -1 });

reviewSchema.pre('validate', function validateParticipants(next) {
	if (this.from && this.to && this.from.toString() === this.to.toString()) {
		this.invalidate('to', 'Reviewer and reviewee cannot be the same user');
	}

	next();
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export { Review };
export default Review;

