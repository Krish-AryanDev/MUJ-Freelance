import type { AxiosResponse } from 'axios';

import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/api.types';
import type {
  AddCertificationPayload,
  AddEducationPayload,
  AddExperiencePayload,
  AddLanguagePayload,
  AddPortfolioPayload,
  FreelancerProfile,
  FreelancerSearchParams,
  FreelancerSearchResponse,
  ProfileCompletion,
  UpdateAboutPayload,
  UpdateBasicInfoPayload,
  UpdateMujDetailsPayload,
  UpdateSettingsPayload,
  UpdateSkillsPayload,
  UpdateSocialLinksPayload,
} from '../types/user.types';
import { buildQueryString, getErrorMessage } from '../utils/helpers';

interface ProfilePayload {
  profile: FreelancerProfile;
}

interface ProfileAndUserPayload extends ProfilePayload {
  user?: unknown;
}

const unwrapResponse = <TData>(response: AxiosResponse<ApiResponse<TData>>): TData => {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};

const getMyProfile = async (): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.get<ApiResponse<ProfilePayload>>('/profile/me');
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch your profile'));
  }
};

const getProfileByUserId = async (userId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.get<ApiResponse<ProfilePayload>>(`/profile/user/${userId}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch profile by user id'));
  }
};

const getProfileByUrl = async (profileUrl: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.get<ApiResponse<ProfilePayload>>(`/profile/${profileUrl}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch profile by URL'));
  }
};

const getProfileCompletionTips = async (): Promise<ProfileCompletion> => {
  try {
    const response = await apiClient.get<ApiResponse<ProfileCompletion>>('/profile/me/completion');
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch profile completion tips'));
  }
};

const searchFreelancers = async (params: FreelancerSearchParams): Promise<FreelancerSearchResponse> => {
  try {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiResponse<FreelancerSearchResponse>>(`/profile/search${queryString}`);
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to search freelancers'));
  }
};

const updateBasicInfo = async (payload: UpdateBasicInfoPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/basic', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update basic info'));
  }
};

const updateAbout = async (payload: UpdateAboutPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/about', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update about section'));
  }
};

const updateSkills = async (payload: UpdateSkillsPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/skills', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update skills'));
  }
};

const updateSocialLinks = async (payload: UpdateSocialLinksPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/social', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update social links'));
  }
};

const updateSettings = async (payload: UpdateSettingsPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/settings', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update profile settings'));
  }
};

const updateMujDetails = async (payload: UpdateMujDetailsPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>('/profile/me/muj', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update MUJ details'));
  }
};

const uploadAvatar = async (formData: FormData): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfileAndUserPayload>>('/profile/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to upload avatar'));
  }
};

const uploadCoverImage = async (formData: FormData): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to upload cover image'));
  }
};

const addEducation = async (payload: AddEducationPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/education', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add education'));
  }
};

const updateEducation = async (
  educationId: string,
  payload: Partial<AddEducationPayload>,
): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>(`/profile/me/education/${educationId}`, payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update education'));
  }
};

const deleteEducation = async (educationId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.delete<ApiResponse<ProfilePayload>>(`/profile/me/education/${educationId}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete education'));
  }
};

const addExperience = async (payload: AddExperiencePayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/experience', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add experience'));
  }
};

const updateExperience = async (
  experienceId: string,
  payload: Partial<AddExperiencePayload>,
): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>(`/profile/me/experience/${experienceId}`, payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update experience'));
  }
};

const deleteExperience = async (experienceId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.delete<ApiResponse<ProfilePayload>>(`/profile/me/experience/${experienceId}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete experience'));
  }
};

const addPortfolio = async (payload: AddPortfolioPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/portfolio', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add portfolio item'));
  }
};

const updatePortfolio = async (
  portfolioId: string,
  payload: Partial<AddPortfolioPayload>,
): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>(`/profile/me/portfolio/${portfolioId}`, payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update portfolio item'));
  }
};

const deletePortfolio = async (portfolioId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.delete<ApiResponse<ProfilePayload>>(`/profile/me/portfolio/${portfolioId}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete portfolio item'));
  }
};

const addCertification = async (payload: AddCertificationPayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/certifications', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add certification'));
  }
};

const updateCertification = async (
  certificationId: string,
  payload: Partial<AddCertificationPayload>,
): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>(
      `/profile/me/certifications/${certificationId}`,
      payload,
    );
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update certification'));
  }
};

const deleteCertification = async (certificationId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.delete<ApiResponse<ProfilePayload>>(
      `/profile/me/certifications/${certificationId}`,
    );
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete certification'));
  }
};

const addLanguage = async (payload: AddLanguagePayload): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.post<ApiResponse<ProfilePayload>>('/profile/me/languages', payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to add language'));
  }
};

const updateLanguage = async (
  languageId: string,
  payload: Partial<AddLanguagePayload>,
): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.put<ApiResponse<ProfilePayload>>(`/profile/me/languages/${languageId}`, payload);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to update language'));
  }
};

const deleteLanguage = async (languageId: string): Promise<FreelancerProfile> => {
  try {
    const response = await apiClient.delete<ApiResponse<ProfilePayload>>(`/profile/me/languages/${languageId}`);
    const data = unwrapResponse(response);
    return data.profile;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to delete language'));
  }
};

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

export const profileService = {
  getMyProfile,
  getProfileByUserId,
  getProfileByUrl,
  getProfileCompletionTips,
  searchFreelancers,
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
};

export default profileService;
