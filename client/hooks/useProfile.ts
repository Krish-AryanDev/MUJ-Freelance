'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

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
  getProfileCompletionTips,
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
} from '../services/profile.service';
import type {
  AddCertificationPayload,
  AddEducationPayload,
  AddExperiencePayload,
  AddLanguagePayload,
  AddPortfolioPayload,
  UpdateAboutPayload,
  UpdateBasicInfoPayload,
  UpdateMujDetailsPayload,
  UpdateSettingsPayload,
  UpdateSkillsPayload,
  UpdateSocialLinksPayload,
} from '../types/user.types';

const PROFILE_QUERY_KEY = ['profile', 'me'];
const PROFILE_COMPLETION_QUERY_KEY = ['profile', 'completion'];

export const useProfile = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
  });

  const completionQuery = useQuery({
    queryKey: PROFILE_COMPLETION_QUERY_KEY,
    queryFn: getProfileCompletionTips,
  });

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: PROFILE_COMPLETION_QUERY_KEY });
  };

  const createMutation = <TVars,>(
    mutationFn: (variables: TVars) => Promise<unknown>,
    successMessage: string,
    errorFallback: string,
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: async () => {
        toast.success(successMessage);
        await invalidateProfile();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : errorFallback);
      },
    });
  };

  const updateBasicInfoMutation = createMutation<UpdateBasicInfoPayload>(
    updateBasicInfo,
    'Basic information updated',
    'Failed to update basic information',
  );

  const updateAboutMutation = createMutation<UpdateAboutPayload>(
    updateAbout,
    'About section updated',
    'Failed to update about section',
  );

  const updateSkillsMutation = createMutation<UpdateSkillsPayload>(
    updateSkills,
    'Skills updated',
    'Failed to update skills',
  );

  const updateSocialLinksMutation = createMutation<UpdateSocialLinksPayload>(
    updateSocialLinks,
    'Social links updated',
    'Failed to update social links',
  );

  const updateSettingsMutation = createMutation<UpdateSettingsPayload>(
    updateSettings,
    'Settings updated',
    'Failed to update settings',
  );

  const updateMujDetailsMutation = createMutation<UpdateMujDetailsPayload>(
    updateMujDetails,
    'MUJ details updated',
    'Failed to update MUJ details',
  );

  const uploadAvatarMutation = createMutation<FormData>(
    uploadAvatar,
    'Avatar uploaded',
    'Failed to upload avatar',
  );

  const uploadCoverMutation = createMutation<FormData>(
    uploadCoverImage,
    'Cover image uploaded',
    'Failed to upload cover image',
  );

  const addEducationMutation = createMutation<AddEducationPayload>(
    addEducation,
    'Education added',
    'Failed to add education',
  );

  const updateEducationMutation = createMutation<{ educationId: string; payload: Partial<AddEducationPayload> }>(
    ({ educationId, payload }) => updateEducation(educationId, payload),
    'Education updated',
    'Failed to update education',
  );

  const deleteEducationMutation = createMutation<string>(
    deleteEducation,
    'Education deleted',
    'Failed to delete education',
  );

  const addExperienceMutation = createMutation<AddExperiencePayload>(
    addExperience,
    'Experience added',
    'Failed to add experience',
  );

  const updateExperienceMutation = createMutation<{ experienceId: string; payload: Partial<AddExperiencePayload> }>(
    ({ experienceId, payload }) => updateExperience(experienceId, payload),
    'Experience updated',
    'Failed to update experience',
  );

  const deleteExperienceMutation = createMutation<string>(
    deleteExperience,
    'Experience deleted',
    'Failed to delete experience',
  );

  const addPortfolioMutation = createMutation<AddPortfolioPayload>(
    addPortfolio,
    'Portfolio item added',
    'Failed to add portfolio item',
  );

  const updatePortfolioMutation = createMutation<{ portfolioId: string; payload: Partial<AddPortfolioPayload> }>(
    ({ portfolioId, payload }) => updatePortfolio(portfolioId, payload),
    'Portfolio item updated',
    'Failed to update portfolio item',
  );

  const deletePortfolioMutation = createMutation<string>(
    deletePortfolio,
    'Portfolio item deleted',
    'Failed to delete portfolio item',
  );

  const addCertificationMutation = createMutation<AddCertificationPayload>(
    addCertification,
    'Certification added',
    'Failed to add certification',
  );

  const updateCertificationMutation = createMutation<{
    certificationId: string;
    payload: Partial<AddCertificationPayload>;
  }>(
    ({ certificationId, payload }) => updateCertification(certificationId, payload),
    'Certification updated',
    'Failed to update certification',
  );

  const deleteCertificationMutation = createMutation<string>(
    deleteCertification,
    'Certification deleted',
    'Failed to delete certification',
  );

  const addLanguageMutation = createMutation<AddLanguagePayload>(
    addLanguage,
    'Language added',
    'Failed to add language',
  );

  const updateLanguageMutation = createMutation<{ languageId: string; payload: Partial<AddLanguagePayload> }>(
    ({ languageId, payload }) => updateLanguage(languageId, payload),
    'Language updated',
    'Failed to update language',
  );

  const deleteLanguageMutation = createMutation<string>(
    deleteLanguage,
    'Language deleted',
    'Failed to delete language',
  );

  return {
    profile: profileQuery.data,
    completion: completionQuery.data,
    isLoading: profileQuery.isLoading || completionQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,

    updateBasicInfo: async (payload: UpdateBasicInfoPayload) => {
      await updateBasicInfoMutation.mutateAsync(payload);
    },
    updateAbout: async (payload: UpdateAboutPayload) => {
      await updateAboutMutation.mutateAsync(payload);
    },
    updateSkills: async (payload: UpdateSkillsPayload) => {
      await updateSkillsMutation.mutateAsync(payload);
    },
    updateSocialLinks: async (payload: UpdateSocialLinksPayload) => {
      await updateSocialLinksMutation.mutateAsync(payload);
    },
    updateSettings: async (payload: UpdateSettingsPayload) => {
      await updateSettingsMutation.mutateAsync(payload);
    },
    updateMujDetails: async (payload: UpdateMujDetailsPayload) => {
      await updateMujDetailsMutation.mutateAsync(payload);
    },
    uploadAvatar: async (payload: FormData) => {
      await uploadAvatarMutation.mutateAsync(payload);
    },
    uploadCoverImage: async (payload: FormData) => {
      await uploadCoverMutation.mutateAsync(payload);
    },

    addEducation: async (payload: AddEducationPayload) => {
      await addEducationMutation.mutateAsync(payload);
    },
    updateEducation: async (payload: { educationId: string; payload: Partial<AddEducationPayload> }) => {
      await updateEducationMutation.mutateAsync(payload);
    },
    deleteEducation: async (educationId: string) => {
      await deleteEducationMutation.mutateAsync(educationId);
    },

    addExperience: async (payload: AddExperiencePayload) => {
      await addExperienceMutation.mutateAsync(payload);
    },
    updateExperience: async (payload: { experienceId: string; payload: Partial<AddExperiencePayload> }) => {
      await updateExperienceMutation.mutateAsync(payload);
    },
    deleteExperience: async (experienceId: string) => {
      await deleteExperienceMutation.mutateAsync(experienceId);
    },

    addPortfolio: async (payload: AddPortfolioPayload) => {
      await addPortfolioMutation.mutateAsync(payload);
    },
    updatePortfolio: async (payload: { portfolioId: string; payload: Partial<AddPortfolioPayload> }) => {
      await updatePortfolioMutation.mutateAsync(payload);
    },
    deletePortfolio: async (portfolioId: string) => {
      await deletePortfolioMutation.mutateAsync(portfolioId);
    },

    addCertification: async (payload: AddCertificationPayload) => {
      await addCertificationMutation.mutateAsync(payload);
    },
    updateCertification: async (payload: {
      certificationId: string;
      payload: Partial<AddCertificationPayload>;
    }) => {
      await updateCertificationMutation.mutateAsync(payload);
    },
    deleteCertification: async (certificationId: string) => {
      await deleteCertificationMutation.mutateAsync(certificationId);
    },

    addLanguage: async (payload: AddLanguagePayload) => {
      await addLanguageMutation.mutateAsync(payload);
    },
    updateLanguage: async (payload: { languageId: string; payload: Partial<AddLanguagePayload> }) => {
      await updateLanguageMutation.mutateAsync(payload);
    },
    deleteLanguage: async (languageId: string) => {
      await deleteLanguageMutation.mutateAsync(languageId);
    },

    mutationState: {
      isSaving:
        updateBasicInfoMutation.isPending ||
        updateAboutMutation.isPending ||
        updateSkillsMutation.isPending ||
        updateSocialLinksMutation.isPending ||
        updateSettingsMutation.isPending ||
        updateMujDetailsMutation.isPending ||
        uploadAvatarMutation.isPending ||
        uploadCoverMutation.isPending,
    },
  };
};

export default useProfile;
