import mongoose from 'mongoose';

const { Schema } = mongoose;

const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'expert'];
const RESPONSE_TIMES = ['within_an_hour', 'within_a_few_hours', 'within_a_day', 'within_a_few_days'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const LANGUAGE_PROFICIENCY_LEVELS = ['basic', 'conversational', 'fluent', 'native'];
const PROFILE_VISIBILITY = ['public', 'muj_only', 'private'];
const PREMIUM_BADGES = ['none', 'silver', 'gold', 'platinum'];

const skillDetailedSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 80,
		},
		level: {
			type: String,
			enum: SKILL_LEVELS,
			default: 'intermediate',
		},
	},
	{ _id: true },
);

const educationSchema = new Schema(
	{
		institution: {
			type: String,
			required: true,
			trim: true,
			maxlength: 180,
		},
		degree: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		fieldOfStudy: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		startYear: {
			type: Number,
			min: 1950,
			max: 2100,
		},
		endYear: {
			type: Number,
			min: 1950,
			max: 2100,
		},
		currentlyStudying: {
			type: Boolean,
			default: false,
		},
		grade: {
			type: String,
			trim: true,
			maxlength: 40,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 1200,
		},
	},
	{ _id: true },
);

const experienceSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 140,
		},
		company: {
			type: String,
			required: true,
			trim: true,
			maxlength: 140,
		},
		location: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		startDate: {
			type: Date,
		},
		endDate: {
			type: Date,
		},
		currentlyWorking: {
			type: Boolean,
			default: false,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 1800,
		},
		skills: {
			type: [String],
			default: [],
		},
	},
	{ _id: true },
);

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
			maxlength: 1500,
		},
		imageUrl: {
			type: String,
			trim: true,
		},
		projectUrl: {
			type: String,
			trim: true,
		},
		githubUrl: {
			type: String,
			trim: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		completedAt: {
			type: Date,
		},
	},
	{ _id: true },
);

const certificationSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 140,
		},
		issuingOrganization: {
			type: String,
			trim: true,
			maxlength: 140,
		},
		issueDate: {
			type: Date,
		},
		expiryDate: {
			type: Date,
		},
		credentialId: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		credentialUrl: {
			type: String,
			trim: true,
		},
	},
	{ _id: true },
);

const languageSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 60,
		},
		proficiency: {
			type: String,
			enum: LANGUAGE_PROFICIENCY_LEVELS,
			default: 'conversational',
		},
	},
	{ _id: true },
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
		tagline: {
			type: String,
			trim: true,
			maxlength: 120,
		},
		avatar: {
			type: String,
			trim: true,
		},
		coverImage: {
			type: String,
			trim: true,
		},
		location: {
			type: String,
			trim: true,
			default: 'Jaipur, Rajasthan',
			maxlength: 120,
		},
		profileUrl: {
			type: String,
			trim: true,
			lowercase: true,
			unique: true,
			sparse: true,
			match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Profile URL must be lowercase and hyphenated'],
		},
		isAvailable: {
			type: Boolean,
			default: true,
		},
		responseTime: {
			type: String,
			enum: RESPONSE_TIMES,
			default: 'within_a_day',
		},
		skills: {
			type: [String],
			default: [],
		},
		skillsDetailed: {
			type: [skillDetailedSchema],
			default: [],
		},
		education: {
			type: [educationSchema],
			default: [],
		},
		experience: {
			type: [experienceSchema],
			default: [],
		},
		portfolio: {
			type: [portfolioItemSchema],
			default: [],
			validate: {
				validator: (value) => Array.isArray(value) && value.length <= 12,
				message: 'Portfolio can have maximum 12 items',
			},
		},
		certifications: {
			type: [certificationSchema],
			default: [],
		},
		languages: {
			type: [languageSchema],
			default: [],
		},
		hourlyRate: {
			type: Number,
			min: 0,
		},
		experienceLevel: {
			type: String,
			enum: EXPERIENCE_LEVELS,
			default: 'beginner',
		},
		about: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		socialLinks: {
			linkedin: {
				type: String,
				trim: true,
			},
			github: {
				type: String,
				trim: true,
			},
			twitter: {
				type: String,
				trim: true,
			},
			behance: {
				type: String,
				trim: true,
			},
			dribbble: {
				type: String,
				trim: true,
			},
			website: {
				type: String,
				trim: true,
			},
			instagram: {
				type: String,
				trim: true,
			},
		},
		mujDetails: {
			enrollmentNo: {
				type: String,
				uppercase: true,
				trim: true,
			},
			branch: {
				type: String,
				trim: true,
			},
			semester: {
				type: Number,
				min: 1,
				max: 10,
			},
			batch: {
				type: String,
				trim: true,
			},
			hostel: {
				type: String,
				trim: true,
			},
		},
		settings: {
			showEmail: {
				type: Boolean,
				default: false,
			},
			showPhone: {
				type: Boolean,
				default: false,
			},
			showEarnings: {
				type: Boolean,
				default: false,
			},
			profileVisibility: {
				type: String,
				enum: PROFILE_VISIBILITY,
				default: 'public',
			},
			allowMessages: {
				type: Boolean,
				default: true,
			},
			showOnlineStatus: {
				type: Boolean,
				default: true,
			},
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
		totalProjects: {
			type: Number,
			min: 0,
			default: 0,
		},
		completedProjects: {
			type: Number,
			min: 0,
			default: 0,
		},
		totalEarnings: {
			type: Number,
			min: 0,
			default: 0,
		},
		profileViews: {
			type: Number,
			min: 0,
			default: 0,
		},
		profileCompletionScore: {
			type: Number,
			min: 0,
			max: 100,
			default: 0,
		},
		isPremium: {
			type: Boolean,
			default: false,
		},
		premiumExpiresAt: {
			type: Date,
		},
		premiumBadge: {
			type: String,
			enum: PREMIUM_BADGES,
			default: 'none',
		},
	},
	{
		timestamps: true,
		collection: 'freelancerprofiles',
	},
);

freelancerProfileSchema.pre('save', function computeProfileCompletionScore(next) {
	let score = 0;

	if (this.avatar && this.avatar.trim()) {
		score += 10;
	}

	if (this.tagline && this.tagline.trim()) {
		score += 10;
	}

	if (this.about && this.about.trim()) {
		score += 15;
	}

	if (Array.isArray(this.skills) && this.skills.length >= 3) {
		score += 10;
	}

	if (Array.isArray(this.education) && this.education.length >= 1) {
		score += 15;
	}

	if (Array.isArray(this.experience) && this.experience.length >= 1) {
		score += 10;
	}

	if (Array.isArray(this.portfolio) && this.portfolio.length >= 1) {
		score += 15;
	}

	if (this.socialLinks?.github || this.socialLinks?.linkedin) {
		score += 10;
	}

	if (typeof this.hourlyRate === 'number' && this.hourlyRate > 0) {
		score += 5;
	}

	this.profileCompletionScore = Math.min(100, score);
	next();
});

freelancerProfileSchema.index({ skills: 1 });
freelancerProfileSchema.index({ 'skillsDetailed.name': 1 });
freelancerProfileSchema.index({ isAvailable: 1, experienceLevel: 1, hourlyRate: 1 });
freelancerProfileSchema.index({ averageRating: -1, createdAt: -1 });
freelancerProfileSchema.index({ isPremium: -1, profileCompletionScore: -1 });
freelancerProfileSchema.index({ 'settings.profileVisibility': 1 });
freelancerProfileSchema.index({ profileUrl: 1 });

const FreelancerProfile =
	mongoose.models.FreelancerProfile || mongoose.model('FreelancerProfile', freelancerProfileSchema);

export {
	EXPERIENCE_LEVELS,
	LANGUAGE_PROFICIENCY_LEVELS,
	PREMIUM_BADGES,
	PROFILE_VISIBILITY,
	RESPONSE_TIMES,
	SKILL_LEVELS,
	FreelancerProfile,
};
export default FreelancerProfile;

