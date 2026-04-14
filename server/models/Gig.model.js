import mongoose from 'mongoose';

const { Schema } = mongoose;

const GIG_STATUSES = ['active', 'inactive', 'draft', 'published', 'paused', 'archived'];
const GIG_CATEGORIES = [
	'WEB_DEVELOPMENT',
	'APP_DEVELOPMENT',
	'UI_UX_DESIGN',
	'GRAPHIC_DESIGN',
	'VIDEO_EDITING',
	'CONTENT_WRITING',
	'DIGITAL_MARKETING',
	'DATA_ANALYTICS',
	'PHOTOGRAPHY',
	'AI_ML',
	'TUTORING',
	'ASSIGNMENT_HELP',
	'RESUME_PORTFOLIO',
	'OTHER',
];

const packageSchema = new Schema(
	{
		tier: {
			type: String,
			enum: ['basic', 'standard', 'premium'],
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1500,
		},
		deliveryDays: {
			type: Number,
			required: true,
			min: 1,
		},
		revisions: {
			type: Number,
			required: true,
			min: 0,
		},
		price: {
			type: Number,
			required: true,
			min: 1,
		},
		features: {
			type: [String],
			default: [],
		},
	},
	{ _id: false },
);

const imageSchema = new Schema(
	{
		url: {
			type: String,
			required: true,
		},
		publicId: {
			type: String,
			required: true,
		},
	},
	{ _id: false },
);

const faqSchema = new Schema(
	{
		question: {
			type: String,
			required: true,
			trim: true,
			maxlength: 250,
		},
		answer: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1200,
		},
	},
	{ _id: false },
);

/**
 * Marketplace service listing with fixed package tiers.
 */
const gigSchema = new Schema(
	{
		freelancer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		slug: {
			type: String,
			trim: true,
			unique: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			maxlength: 6000,
		},
		category: {
			type: String,
			enum: GIG_CATEGORIES,
			required: true,
			index: true,
		},
		subcategory: {
			type: String,
			trim: true,
			default: '',
		},
		tags: {
			type: [String],
			default: [],
		},
		packages: {
			type: [packageSchema],
			required: true,
			validate: {
				validator: (packages) => {
					if (!Array.isArray(packages) || packages.length !== 3) {
						return false;
					}

					const tiers = new Set(packages.map((pkg) => pkg.tier));
					return tiers.has('basic') && tiers.has('standard') && tiers.has('premium');
				},
				message: 'Gig must include exactly basic, standard, and premium packages',
			},
		},
		images: {
			type: [imageSchema],
			default: [],
		},
		faqs: {
			type: [faqSchema],
			default: [],
		},
		status: {
			type: String,
			enum: GIG_STATUSES,
			default: 'active',
			index: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
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
		totalOrders: {
			type: Number,
			min: 0,
			default: 0,
		},
	},
	{
		timestamps: true,
		collection: 'gigs',
	},
);

gigSchema.index({ title: 'text', description: 'text', tags: 'text' });

gigSchema.pre('validate', function setSlug(next) {
	if (this.title) {
		this.slug = this.title
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	next();
});

const Gig = mongoose.models.Gig || mongoose.model('Gig', gigSchema);

export { GIG_CATEGORIES, GIG_STATUSES, Gig };
export default Gig;

