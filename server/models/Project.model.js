import mongoose from 'mongoose';

const { Schema } = mongoose;

const PROJECT_STATUSES = ['open', 'in_review', 'assigned', 'in_progress', 'completed', 'cancelled'];

const PROJECT_CATEGORIES = [
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

/**
 * Client-posted custom project for proposal-based hiring.
 */
const projectSchema = new Schema(
	{
		client: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 150,
		},
		description: {
			type: String,
			required: true,
			trim: true,
			maxlength: 8000,
		},
		category: {
			type: String,
			enum: PROJECT_CATEGORIES,
			required: true,
			index: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		skillsRequired: {
			type: [String],
			default: [],
		},
		budget: {
			type: {
				type: String,
				enum: ['fixed', 'hourly'],
				default: 'fixed',
			},
			min: {
				type: Number,
				required: true,
				min: 1,
			},
			max: {
				type: Number,
				required: true,
				min: 1,
			},
			currency: {
				type: String,
				default: 'INR',
				uppercase: true,
				trim: true,
			},
		},
		deadline: {
			type: Date,
			required: true,
		},
		attachments: {
			type: [
				{
					url: { type: String, required: true },
					name: { type: String, required: true, trim: true },
				},
			],
			default: [],
		},
		status: {
			type: String,
			enum: PROJECT_STATUSES,
			default: 'open',
			index: true,
		},
		assignedFreelancer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		selectedFreelancer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		proposalCount: {
			type: Number,
			min: 0,
			default: 0,
		},
	},
	{
		timestamps: true,
		collection: 'projects',
	},
);

projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

projectSchema.pre('validate', function validateBudget(next) {
	if (this.budget?.min > this.budget?.max) {
		this.invalidate('budget.max', 'Budget max must be greater than or equal to budget min');
	}

	next();
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export { PROJECT_CATEGORIES, PROJECT_STATUSES, Project };
export default Project;

