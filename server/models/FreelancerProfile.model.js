import mongoose from 'mongoose';

const { Schema } = mongoose;

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert'];
const AVAILABILITY_STATUSES = ['available', 'busy', 'unavailable'];

const portfolioItemSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 1000,
		},
		projectUrl: {
			type: String,
			trim: true,
		},
		imageUrl: {
			type: String,
			trim: true,
		},
	},
	{ _id: false },
);

/**
 * Freelancer-specific public profile and performance metadata.
 */
const freelancerProfileSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
		},
		headline: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		bio: {
			type: String,
			required: true,
			trim: true,
			maxlength: 2500,
		},
		skills: {
			type: [String],
			default: [],
		},
		hourlyRate: {
			type: Number,
			min: 0,
			default: 0,
		},
		experienceLevel: {
			type: String,
			enum: EXPERIENCE_LEVELS,
			default: 'beginner',
		},
		languages: {
			type: [String],
			default: ['English'],
		},
		portfolioItems: {
			type: [portfolioItemSchema],
			default: [],
		},
		socialLinks: {
			github: {
				type: String,
				trim: true,
				default: '',
			},
			linkedin: {
				type: String,
				trim: true,
				default: '',
			},
			portfolio: {
				type: String,
				trim: true,
				default: '',
			},
		},
		availabilityStatus: {
			type: String,
			enum: AVAILABILITY_STATUSES,
			default: 'available',
		},
		totalEarnings: {
			type: Number,
			min: 0,
			default: 0,
		},
		completedOrders: {
			type: Number,
			min: 0,
			default: 0,
		},
		averageRating: {
			type: Number,
			min: 0,
			max: 5,
			default: 0,
		},
		totalReviews: {
			type: Number,
			min: 0,
			default: 0,
		},
	},
	{
		timestamps: true,
		collection: 'freelancerprofiles',
	},
);

freelancerProfileSchema.index({ skills: 1 });

const FreelancerProfile =
	mongoose.models.FreelancerProfile || mongoose.model('FreelancerProfile', freelancerProfileSchema);

export { AVAILABILITY_STATUSES, EXPERIENCE_LEVELS, FreelancerProfile };
export default FreelancerProfile;

