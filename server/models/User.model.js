import mongoose from 'mongoose';

const { Schema } = mongoose;

const USER_ROLES = ['client', 'freelancer', 'admin'];
const ACCOUNT_STATUSES = ['pending_verification', 'active', 'suspended', 'blocked'];

/**
 * Core user identity and authentication model.
 */
const userSchema = new Schema(
	{
		fullName: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 80,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[A-Za-z0-9._%+-]+@muj\.manipal\.edu$/i, 'Only @muj.manipal.edu emails are allowed'],
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},
		roles: {
			type: [String],
			enum: USER_ROLES,
			default: ['client'],
			validate: {
				validator: (value) => Array.isArray(value) && value.length > 0,
				message: 'At least one role is required',
			},
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		accountStatus: {
			type: String,
			enum: ACCOUNT_STATUSES,
			default: 'pending_verification',
		},
		avatar: {
			url: {
				type: String,
				default: '',
			},
			publicId: {
				type: String,
				default: '',
			},
		},
		refreshToken: {
			type: String,
			select: false,
			default: '',
		},
		lastLoginAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
		collection: 'users',
	},
);

userSchema.index({ roles: 1 });

userSchema.pre('save', function sanitizeRoles(next) {
	if (Array.isArray(this.roles)) {
		this.roles = [...new Set(this.roles)];
	}

	next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export { ACCOUNT_STATUSES, USER_ROLES, User };
export default User;

