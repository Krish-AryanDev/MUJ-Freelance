import express from 'express';

import {
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
} from '../controllers/profile.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js';
import { imageUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Public routes
router.get('/search', searchFreelancers);
router.get('/user/:userId', optionalAuth, getProfileByUserId);

// Protected routes
router.get('/me', requireAuth, getMyProfile);
router.get('/me/completion', requireAuth, getProfileCompletionTips);
router.put('/me/basic', requireAuth, updateBasicInfo);
router.put('/me/about', requireAuth, updateAbout);
router.put('/me/skills', requireAuth, updateSkills);
router.put('/me/social', requireAuth, updateSocialLinks);
router.put('/me/settings', requireAuth, updateSettings);
router.put('/me/muj', requireAuth, updateMujDetails);
router.post('/me/avatar', requireAuth, imageUpload.single('avatar'), uploadAvatar);
router.post('/me/cover', requireAuth, imageUpload.single('cover'), uploadCoverImage);

router.post('/me/education', requireAuth, addEducation);
router.put('/me/education/:educationId', requireAuth, updateEducation);
router.delete('/me/education/:educationId', requireAuth, deleteEducation);

router.post('/me/experience', requireAuth, addExperience);
router.put('/me/experience/:experienceId', requireAuth, updateExperience);
router.delete('/me/experience/:experienceId', requireAuth, deleteExperience);

router.post('/me/portfolio', requireAuth, addPortfolio);
router.put('/me/portfolio/:portfolioId', requireAuth, updatePortfolio);
router.delete('/me/portfolio/:portfolioId', requireAuth, deletePortfolio);

router.post('/me/certifications', requireAuth, addCertification);
router.put('/me/certifications/:certificationId', requireAuth, updateCertification);
router.delete('/me/certifications/:certificationId', requireAuth, deleteCertification);

router.post('/me/languages', requireAuth, addLanguage);
router.put('/me/languages/:languageId', requireAuth, updateLanguage);
router.delete('/me/languages/:languageId', requireAuth, deleteLanguage);

// Keep parameterized catch-all route last.
router.get('/:profileUrl', optionalAuth, getProfileByUrl);

export default router;
