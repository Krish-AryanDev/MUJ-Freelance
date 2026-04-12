import mongoose from 'mongoose';

const { Schema } = mongoose;

const PROPOSAL_STATUSES = ['pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];

const milestoneSchema = new Schema(
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
			maxlength: 1200,
			default: '',
		},
		amount: {
			type: Number,
			required: true,
			min: 1,
		},
		dueInDays: {
			type: Number,
			required: true,
			min: 1,
		},
	},
	{ _id: false },
);

/**
 * Freelancer bid/proposal for a project post.
 */
const proposalSchema = new Schema(
	{
		project: {
			type: Schema.Types.ObjectId,
			ref: 'Project',
			required: true,
			index: true,
		},
		client: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		freelancer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		coverLetter: {
			type: String,
			required: true,
			trim: true,
			maxlength: 4000,
		},
		bidAmount: {
			type: Number,
			required: true,
			min: 1,
		},
		deliveryDays: {
			type: Number,
			required: true,
			min: 1,
		},
		estimatedDays: {
			type: Number,
			min: 1,
		},
		milestones: {
			type: [milestoneSchema],
			default: [],
		},
		status: {
			type: String,
			enum: PROPOSAL_STATUSES,
			default: 'pending',
			index: true,
		},
		declineReason: {
			type: String,
			trim: true,
			default: '',
		},
	},
	{
		timestamps: true,
		collection: 'proposals',
	},
);

proposalSchema.index({ project: 1, freelancer: 1 }, { unique: true });

proposalSchema.pre('save', function syncEstimatedDays(next) {
	if (this.deliveryDays && !this.estimatedDays) {
		this.estimatedDays = this.deliveryDays;
	}

	next();
});

proposalSchema.pre('validate', function validateMilestones(next) {
	if (!this.milestones?.length) {
		return next();
	}

	const milestoneTotal = this.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
	if (milestoneTotal !== this.bidAmount) {
		this.invalidate('milestones', 'Sum of milestone amounts must equal bid amount');
	}

	next();
});

const Proposal = mongoose.models.Proposal || mongoose.model('Proposal', proposalSchema);

export { PROPOSAL_STATUSES, Proposal };
export default Proposal;

