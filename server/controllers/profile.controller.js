import fs from 'fs/promises';

import mongoose from 'mongoose';

import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import FreelancerProfile from '../models/FreelancerProfile.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const USER_POPULATE_FIELDS = 'fullName email avatar roles branch semester enrollmentNo';
const PROFILE_PUBLIC_FIELDS = '-__v';

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }

  return null;
};

const normalizeUserId = (user) => {
  return user?._id?.toString() || user?.id?.toString() || null;
};

const sanitizeProfileSlug = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const isMujEmail = (email) => /@muj\.manipal\.edu$/i.test(String(email || ''));

const isProfileOwner = (profile, reqUser) => {
  if (!profile || !reqUser) {
    return false;
  }

  const profileUserId = normalizeUserId(profile.user);
  const currentUserId = normalizeUserId(reqUser);

  return Boolean(profileUserId && currentUserId && profileUserId === currentUserId);
};

const canViewProfile = (profile, reqUser) => {
  const visibility = profile?.settings?.profileVisibility || 'public';

  if (visibility === 'public') {
    return true;
  }

  if (!reqUser) {
    return false;
  }

  if (isProfileOwner(profile, reqUser)) {
    return true;
  }

  if (visibility === 'muj_only') {
    return isMujEmail(reqUser.email);
  }

  return false;
};

const stripSensitiveData = (profileDoc, reqUser) => {
  const profile = profileDoc.toObject ? profileDoc.toObject() : profileDoc;
  const ownProfile = isProfileOwner(profile, reqUser);

  if (!profile.user) {
    return profile;
  }

  if (!ownProfile && profile.settings && profile.settings.showEmail === false && profile.user.email) {
    delete profile.user.email;
  }

  if (!ownProfile && profile.settings && profile.settings.showEarnings === false) {
    profile.totalEarnings = 0;
  }

  return profile;
};

const buildCompletionTips = (profile) => {
  const checks = [
    {
      section: 'avatar',
      tip: 'Upload a clear profile photo to build trust quickly.',
      points: 10,
      completed: Boolean(profile.avatar),
    },
    {
      section: 'tagline',
      tip: 'Add a short tagline that explains your core expertise.',
      points: 10,
      completed: Boolean(profile.tagline),
    },
    {
      section: 'about',
      tip: 'Write a concise summary highlighting your strengths and achievements.',
      points: 15,
      completed: Boolean(profile.about),
    },
    {
      section: 'skills',
      tip: 'Add at least 3 skills so clients can discover you faster.',
      points: 10,
      completed: Array.isArray(profile.skills) && profile.skills.length >= 3,
    },
    {
      section: 'education',
      tip: 'Add at least one education entry to improve credibility.',
      points: 15,
      completed: Array.isArray(profile.education) && profile.education.length >= 1,
    },
    {
      section: 'experience',
      tip: 'Add at least one experience entry to showcase your background.',
      points: 10,
      completed: Array.isArray(profile.experience) && profile.experience.length >= 1,
    },
    {
      section: 'portfolio',
      tip: 'Add one portfolio project with links and outcomes.',
      points: 15,
      completed: Array.isArray(profile.portfolio) && profile.portfolio.length >= 1,
    },
    {
      section: 'social',
      tip: 'Add LinkedIn or GitHub to strengthen your profile authenticity.',
      points: 10,
      completed: Boolean(profile.socialLinks?.github || profile.socialLinks?.linkedin),
    },
    {
      section: 'rate',
      tip: 'Set your hourly rate so clients can assess fit quickly.',
      points: 5,
      completed: typeof profile.hourlyRate === 'number' && profile.hourlyRate > 0,
    },
  ];

  return checks;
};

const getOrCreateProfile = async (userId) => {
  let profile = await FreelancerProfile.findOne({ user: userId });

  if (!profile) {
    profile = await FreelancerProfile.create({ user: userId });
  }

  return profile;
};

const getPopulatedProfileByUserId = async (userId) => {
  return FreelancerProfile.findOne({ user: userId })
    .populate('user', USER_POPULATE_FIELDS)
    .select(PROFILE_PUBLIC_FIELDS);
};

const saveAndPopulate = async (profile) => {
  await profile.save();
  return getPopulatedProfileByUserId(profile.user);
};

const updateSectionItemById = (section, itemId, payload) => {
  const next = section.map((entry) => {
    if (entry._id.toString() !== itemId) {
      return entry;
    }

    return {
      ...entry.toObject(),
      ...payload,
    };
  });

  return next;
};

const removeSectionItemById = (section, itemId) => {
  return section.filter((entry) => entry._id.toString() !== itemId);
};

const getMyProfile = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const profile = await getOrCreateProfile(userId);
  const populated = await getPopulatedProfileByUserId(profile.user);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Profile fetched successfully'));
});

const getProfileByUserId = asyncHandler(async (req, res) => {
  const userId = toObjectId(req.params.userId);

  if (!userId) {
    throw new ApiError(400, 'Invalid user id');
  }

  const profile = await FreelancerProfile.findOneAndUpdate(
    { user: userId },
    { $inc: { profileViews: 1 } },
    { new: true },
  )
    .populate('user', USER_POPULATE_FIELDS)
    .select(PROFILE_PUBLIC_FIELDS);

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  if (!canViewProfile(profile, req.user)) {
    throw new ApiError(403, 'This profile is not visible to you');
  }

  const safeProfile = stripSensitiveData(profile, req.user);

  return res.status(200).json(new ApiResponse(200, { profile: safeProfile }, 'Profile fetched successfully'));
});

const getProfileByUrl = asyncHandler(async (req, res) => {
  const profileUrl = sanitizeProfileSlug(req.params.profileUrl);

  if (!profileUrl) {
    throw new ApiError(400, 'Profile URL is required');
  }

  const profile = await FreelancerProfile.findOneAndUpdate(
    { profileUrl },
    { $inc: { profileViews: 1 } },
    { new: true },
  )
    .populate('user', USER_POPULATE_FIELDS)
    .select(PROFILE_PUBLIC_FIELDS);

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  if (!canViewProfile(profile, req.user)) {
    throw new ApiError(403, 'This profile is not visible to you');
  }

  const safeProfile = stripSensitiveData(profile, req.user);

  return res.status(200).json(new ApiResponse(200, { profile: safeProfile }, 'Profile fetched successfully'));
});

const updateBasicInfo = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  const {
    tagline,
    location,
    isAvailable,
    responseTime,
    hourlyRate,
    experienceLevel,
    profileUrl,
    name,
  } = req.body;

  if (Object.prototype.hasOwnProperty.call(req.body, 'tagline')) {
    profile.tagline = tagline;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'location')) {
    profile.location = location;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'isAvailable')) {
    profile.isAvailable = Boolean(isAvailable);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'responseTime')) {
    profile.responseTime = responseTime;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'hourlyRate')) {
    profile.hourlyRate = hourlyRate;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'experienceLevel')) {
    profile.experienceLevel = experienceLevel;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'profileUrl')) {
    const sanitizedProfileUrl = sanitizeProfileSlug(profileUrl);

    if (sanitizedProfileUrl) {
      const existing = await FreelancerProfile.findOne({
        profileUrl: sanitizedProfileUrl,
        user: { $ne: profile.user },
      }).lean();

      if (existing) {
        throw new ApiError(409, 'Profile URL is already taken');
      }

      profile.profileUrl = sanitizedProfileUrl;
    } else {
      profile.profileUrl = undefined;
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'name') && String(name || '').trim()) {
    await User.findByIdAndUpdate(profile.user, { fullName: String(name).trim() }, { new: false });
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Basic info updated'));
});

const updateAbout = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  profile.about = req.body.about || '';

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'About section updated'));
});

const updateSkills = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
  const skillsDetailed = Array.isArray(req.body.skillsDetailed) ? req.body.skillsDetailed : [];

  if (skills.length > 20 || skillsDetailed.length > 20) {
    throw new ApiError(400, 'Maximum 20 skills are allowed');
  }

  profile.skills = skills;
  profile.skillsDetailed = skillsDetailed;

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Skills updated'));
});

const updateSocialLinks = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  profile.socialLinks = {
    ...(profile.socialLinks || {}),
    ...(req.body.socialLinks || {}),
  };

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Social links updated'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  profile.settings = {
    ...(profile.settings || {}),
    ...(req.body.settings || {}),
  };

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Settings updated'));
});

const updateMujDetails = asyncHandler(async (req, res) => {
  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  const incomingMujDetails = req.body.mujDetails || {};

  profile.mujDetails = {
    ...(profile.mujDetails || {}),
    ...incomingMujDetails,
  };

  await User.findByIdAndUpdate(
    profile.user,
    {
      enrollmentNo: incomingMujDetails.enrollmentNo,
      branch: incomingMujDetails.branch,
      semester: incomingMujDetails.semester,
    },
    { new: false },
  );

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'MUJ details updated'));
});

const resolveCloudinaryPublicId = (url) => {
  const source = String(url || '');
  const marker = '/upload/';
  const index = source.indexOf(marker);

  if (index < 0) {
    return null;
  }

  const pathAfterUpload = source.slice(index + marker.length);
  const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
  const dotIndex = withoutVersion.lastIndexOf('.');

  if (dotIndex <= 0) {
    return withoutVersion;
  }

  return withoutVersion.slice(0, dotIndex);
};

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    throw new ApiError(400, 'Avatar image file is required');
  }

  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  const upload = await uploadToCloudinary(req.file.path, 'muj-freelance/profile/avatar');

  const oldAvatarPublicId = resolveCloudinaryPublicId(profile.avatar);
  profile.avatar = upload.secure_url;

  const updatedUser = await User.findByIdAndUpdate(
    profile.user,
    {
      avatar: {
        url: upload.secure_url,
        publicId: upload.public_id,
      },
    },
    { new: true },
  );

  await profile.save();

  if (oldAvatarPublicId) {
    await deleteFromCloudinary(oldAvatarPublicId).catch(() => null);
  }

  await fs.unlink(req.file.path).catch(() => null);

  const populated = await getPopulatedProfileByUserId(profile.user);

  return res.status(200).json(
    new ApiResponse(200, { profile: populated, user: updatedUser }, 'Avatar uploaded successfully'),
  );
});

const uploadCoverImage = asyncHandler(async (req, res) => {
  if (!req.file?.path) {
    throw new ApiError(400, 'Cover image file is required');
  }

  const userId = normalizeUserId(req.user);
  const profile = await getOrCreateProfile(userId);

  const upload = await uploadToCloudinary(req.file.path, 'muj-freelance/profile/cover');

  const oldCoverPublicId = resolveCloudinaryPublicId(profile.coverImage);
  profile.coverImage = upload.secure_url;

  await profile.save();

  if (oldCoverPublicId) {
    await deleteFromCloudinary(oldCoverPublicId).catch(() => null);
  }

  await fs.unlink(req.file.path).catch(() => null);

  const populated = await getPopulatedProfileByUserId(profile.user);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Cover image uploaded successfully'));
});

const addEducation = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  profile.education.push({
    institution: req.body.institution,
    degree: req.body.degree,
    fieldOfStudy: req.body.fieldOfStudy,
    startYear: req.body.startYear,
    endYear: req.body.endYear,
    currentlyStudying: Boolean(req.body.currentlyStudying),
    grade: req.body.grade,
    description: req.body.description,
  });

  const populated = await saveAndPopulate(profile);

  return res.status(201).json(new ApiResponse(201, { profile: populated }, 'Education added'));
});

const updateEducation = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const educationId = String(req.params.educationId || '');

  const exists = profile.education.some((item) => item._id.toString() === educationId);
  if (!exists) {
    throw new ApiError(404, 'Education entry not found');
  }

  profile.education = updateSectionItemById(profile.education, educationId, req.body);

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Education updated'));
});

const deleteEducation = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const educationId = String(req.params.educationId || '');

  const initialLength = profile.education.length;
  profile.education = removeSectionItemById(profile.education, educationId);

  if (profile.education.length === initialLength) {
    throw new ApiError(404, 'Education entry not found');
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Education deleted'));
});

const addExperience = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  profile.experience.push({
    title: req.body.title,
    company: req.body.company,
    location: req.body.location,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    currentlyWorking: Boolean(req.body.currentlyWorking),
    description: req.body.description,
    skills: Array.isArray(req.body.skills) ? req.body.skills : [],
  });

  const populated = await saveAndPopulate(profile);

  return res.status(201).json(new ApiResponse(201, { profile: populated }, 'Experience added'));
});

const updateExperience = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const experienceId = String(req.params.experienceId || '');

  const exists = profile.experience.some((item) => item._id.toString() === experienceId);
  if (!exists) {
    throw new ApiError(404, 'Experience entry not found');
  }

  profile.experience = updateSectionItemById(profile.experience, experienceId, req.body);

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Experience updated'));
});

const deleteExperience = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const experienceId = String(req.params.experienceId || '');

  const initialLength = profile.experience.length;
  profile.experience = removeSectionItemById(profile.experience, experienceId);

  if (profile.experience.length === initialLength) {
    throw new ApiError(404, 'Experience entry not found');
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Experience deleted'));
});

const addPortfolio = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));

  if (profile.portfolio.length >= 12) {
    throw new ApiError(400, 'Maximum 12 portfolio items are allowed');
  }

  profile.portfolio.push({
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    projectUrl: req.body.projectUrl,
    githubUrl: req.body.githubUrl,
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    completedAt: req.body.completedAt,
  });

  const populated = await saveAndPopulate(profile);

  return res.status(201).json(new ApiResponse(201, { profile: populated }, 'Portfolio item added'));
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const portfolioId = String(req.params.portfolioId || '');

  const exists = profile.portfolio.some((item) => item._id.toString() === portfolioId);
  if (!exists) {
    throw new ApiError(404, 'Portfolio item not found');
  }

  profile.portfolio = updateSectionItemById(profile.portfolio, portfolioId, req.body);

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Portfolio item updated'));
});

const deletePortfolio = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const portfolioId = String(req.params.portfolioId || '');

  const initialLength = profile.portfolio.length;
  profile.portfolio = removeSectionItemById(profile.portfolio, portfolioId);

  if (profile.portfolio.length === initialLength) {
    throw new ApiError(404, 'Portfolio item not found');
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Portfolio item deleted'));
});

const addCertification = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));

  profile.certifications.push({
    name: req.body.name,
    issuingOrganization: req.body.issuingOrganization,
    issueDate: req.body.issueDate,
    expiryDate: req.body.expiryDate,
    credentialId: req.body.credentialId,
    credentialUrl: req.body.credentialUrl,
  });

  const populated = await saveAndPopulate(profile);

  return res.status(201).json(new ApiResponse(201, { profile: populated }, 'Certification added'));
});

const updateCertification = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const certificationId = String(req.params.certificationId || '');

  const exists = profile.certifications.some((item) => item._id.toString() === certificationId);
  if (!exists) {
    throw new ApiError(404, 'Certification not found');
  }

  profile.certifications = updateSectionItemById(profile.certifications, certificationId, req.body);

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Certification updated'));
});

const deleteCertification = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const certificationId = String(req.params.certificationId || '');

  const initialLength = profile.certifications.length;
  profile.certifications = removeSectionItemById(profile.certifications, certificationId);

  if (profile.certifications.length === initialLength) {
    throw new ApiError(404, 'Certification not found');
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Certification deleted'));
});

const addLanguage = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));

  profile.languages.push({
    name: req.body.name,
    proficiency: req.body.proficiency,
  });

  const populated = await saveAndPopulate(profile);

  return res.status(201).json(new ApiResponse(201, { profile: populated }, 'Language added'));
});

const updateLanguage = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const languageId = String(req.params.languageId || '');

  const exists = profile.languages.some((item) => item._id.toString() === languageId);
  if (!exists) {
    throw new ApiError(404, 'Language not found');
  }

  profile.languages = updateSectionItemById(profile.languages, languageId, req.body);

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Language updated'));
});

const deleteLanguage = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  const languageId = String(req.params.languageId || '');

  const initialLength = profile.languages.length;
  profile.languages = removeSectionItemById(profile.languages, languageId);

  if (profile.languages.length === initialLength) {
    throw new ApiError(404, 'Language not found');
  }

  const populated = await saveAndPopulate(profile);

  return res.status(200).json(new ApiResponse(200, { profile: populated }, 'Language deleted'));
});

const buildSearchPipeline = ({
  q,
  skills,
  minRating,
  isAvailable,
  experienceLevel,
  minRate,
  maxRate,
  sort,
  skip,
  limit,
}) => {
  const baseMatch = {
    'settings.profileVisibility': 'public',
  };

  if (typeof minRating === 'number') {
    baseMatch.averageRating = { $gte: minRating };
  }

  if (typeof isAvailable === 'boolean') {
    baseMatch.isAvailable = isAvailable;
  }

  if (experienceLevel) {
    baseMatch.experienceLevel = experienceLevel;
  }

  if (typeof minRate === 'number' || typeof maxRate === 'number') {
    baseMatch.hourlyRate = {};
    if (typeof minRate === 'number') {
      baseMatch.hourlyRate.$gte = minRate;
    }
    if (typeof maxRate === 'number') {
      baseMatch.hourlyRate.$lte = maxRate;
    }
  }

  const andConditions = [baseMatch];

  if (Array.isArray(skills) && skills.length > 0) {
    andConditions.push({ skills: { $in: skills } });
  }

  const pipeline = [
    { $match: andConditions.length > 1 ? { $and: andConditions } : baseMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    { $match: { 'user.roles': 'freelancer' } },
  ];

  if (q) {
    const regex = new RegExp(q, 'i');
    pipeline.push({
      $match: {
        $or: [
          { tagline: regex },
          { about: regex },
          { skills: regex },
          { 'skillsDetailed.name': regex },
          { 'user.fullName': regex },
        ],
      },
    });
  }

  const sortStage =
    sort === 'rating'
      ? { averageRating: -1, totalReviews: -1 }
      : sort === 'newest'
        ? { createdAt: -1 }
        : sort === 'rate_low'
          ? { hourlyRate: 1, createdAt: -1 }
          : sort === 'rate_high'
            ? { hourlyRate: -1, createdAt: -1 }
            : { isPremium: -1, profileCompletionScore: -1, averageRating: -1, createdAt: -1 };

  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $project: {
      _id: 1,
      user: {
        _id: '$user._id',
        name: '$user.fullName',
        email: '$user.email',
        avatar: '$user.avatar.url',
      },
      tagline: 1,
      avatar: 1,
      location: 1,
      isAvailable: 1,
      responseTime: 1,
      hourlyRate: 1,
      experienceLevel: 1,
      skills: 1,
      averageRating: 1,
      totalReviews: 1,
      completedProjects: 1,
      profileCompletionScore: 1,
      isPremium: 1,
      premiumBadge: 1,
      createdAt: 1,
    },
  });

  pipeline.push({ $facet: { items: [{ $skip: skip }, { $limit: limit }], count: [{ $count: 'totalCount' }] } });

  return pipeline;
};

const ensureFreelancerProfiles = async () => {
  const freelancerUsers = await User.find({ roles: 'freelancer' }).select('_id').lean();

  if (!freelancerUsers.length) {
    return;
  }

  const freelancerUserIds = freelancerUsers.map((user) => user._id);
  const existingProfiles = await FreelancerProfile.find({ user: { $in: freelancerUserIds } })
    .select('user')
    .lean();

  const existingProfileUserIds = new Set(existingProfiles.map((profile) => String(profile.user)));
  const missingProfileDocs = freelancerUserIds
    .filter((userId) => !existingProfileUserIds.has(String(userId)))
    .map((userId) => ({ user: userId }));

  if (!missingProfileDocs.length) {
    return;
  }

  await FreelancerProfile.insertMany(missingProfileDocs, { ordered: false }).catch(() => null);
};

const searchFreelancers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const skills = String(req.query.skills || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : undefined;
  const isAvailable =
    req.query.isAvailable !== undefined ? String(req.query.isAvailable).toLowerCase() === 'true' : undefined;
  const experienceLevel = req.query.experienceLevel ? String(req.query.experienceLevel) : undefined;
  const minRate = req.query.minRate !== undefined ? Number(req.query.minRate) : undefined;
  const maxRate = req.query.maxRate !== undefined ? Number(req.query.maxRate) : undefined;
  const sort = String(req.query.sort || 'recommended');
  const page = Math.max(Number.parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit || '12'), 10), 1), 30);
  const skip = (page - 1) * limit;

  await ensureFreelancerProfiles();

  const pipeline = buildSearchPipeline({
    q,
    skills,
    minRating,
    isAvailable,
    experienceLevel,
    minRate,
    maxRate,
    sort,
    skip,
    limit,
  });

  const [result] = await FreelancerProfile.aggregate(pipeline);
  const freelancers = result?.items || [];
  const totalCount = result?.count?.[0]?.totalCount || 0;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        freelancers,
        totalCount,
        currentPage: page,
        totalPages,
      },
      'Freelancers fetched successfully',
    ),
  );
});

const getProfileCompletionTips = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(normalizeUserId(req.user));
  await profile.save();

  const tips = buildCompletionTips(profile);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        score: profile.profileCompletionScore,
        tips,
      },
      'Profile completion tips fetched successfully',
    ),
  );
});

export {
  addCertification,
  addEducation,
  addExperience,
  addLanguage,
  addPortfolio,
  deleteCertification,
  deleteEducation,
  deleteExperience,
  deleteLanguage,
  deletePortfolio,
  getMyProfile,
  getProfileByUrl,
  getProfileByUserId,
  getProfileCompletionTips,
  searchFreelancers,
  updateAbout,
  updateBasicInfo,
  updateCertification,
  updateEducation,
  updateExperience,
  updateLanguage,
  updateMujDetails,
  updatePortfolio,
  updateSettings,
  updateSkills,
  updateSocialLinks,
  uploadAvatar,
  uploadCoverImage,
};

export default {
  getMyProfile,
  getProfileByUserId,
  getProfileByUrl,
  updateBasicInfo,
  updateAbout,
  updateSkills,
  updateSocialLinks,
  updateSettings,
  updateMujDetails,
  uploadAvatar,
  uploadCoverImage,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addPortfolio,
  updatePortfolio,
  deletePortfolio,
  addCertification,
  updateCertification,
  deleteCertification,
  addLanguage,
  updateLanguage,
  deleteLanguage,
  searchFreelancers,
  getProfileCompletionTips,
};
