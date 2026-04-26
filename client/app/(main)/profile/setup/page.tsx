'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CircleCheckBig,
  FileBadge,
  Globe,
  GraduationCap,
  Languages,
  School,
  Settings,
  Sparkles,
  UserCircle2,
  Wrench,
} from 'lucide-react';

import AboutForm from '@/components/profile/setup/AboutForm';
import BasicInfoForm from '@/components/profile/setup/BasicInfoForm';
import CertificationsForm from '@/components/profile/setup/CertificationsForm';
import EducationForm from '@/components/profile/setup/EducationForm';
import ExperienceForm from '@/components/profile/setup/ExperienceForm';
import LanguagesForm from '@/components/profile/setup/LanguagesForm';
import MujDetailsForm from '@/components/profile/setup/MujDetailsForm';
import PortfolioForm from '@/components/profile/setup/PortfolioForm';
import SkillsForm from '@/components/profile/setup/SkillsForm';
import SocialLinksForm from '@/components/profile/setup/SocialLinksForm';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface SetupStep {
  id: string;
  title: string;
  points: number;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: SetupStep[] = [
  { id: 'basic', title: 'Basic Info', points: 20, icon: UserCircle2 },
  { id: 'about', title: 'About Me', points: 15, icon: BookOpen },
  { id: 'skills', title: 'Skills', points: 10, icon: Wrench },
  { id: 'education', title: 'Education', points: 15, icon: GraduationCap },
  { id: 'experience', title: 'Experience', points: 10, icon: Briefcase },
  { id: 'portfolio', title: 'Portfolio', points: 15, icon: Building2 },
  { id: 'certifications', title: 'Certifications', points: 5, icon: FileBadge },
  { id: 'languages', title: 'Languages', points: 3, icon: Languages },
  { id: 'social', title: 'Social Links', points: 10, icon: Globe },
  { id: 'muj', title: 'MUJ Details', points: 5, icon: School },
  { id: 'settings', title: 'Settings', points: 2, icon: Settings },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { isAuthenticated, initialized, isLoading: isAuthLoading } = useAuth();
  const {
    profile,
    completion,
    isLoading,
    mutationState,
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
    deleteLanguage,
  } = useProfile();

  const [activeStepId, setActiveStepId] = useState<string>('basic');

  useEffect(() => {
    if (initialized && !isAuthLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [initialized, isAuthLoading, isAuthenticated, router]);

  const score = completion?.score || profile?.profileCompletionScore || 0;

  const completedStepSet = useMemo(() => {
    const set = new Set<string>();

    if (profile?.tagline || profile?.avatar || profile?.hourlyRate) {
      set.add('basic');
    }
    if (profile?.about) {
      set.add('about');
    }
    if ((profile?.skills || []).length >= 3) {
      set.add('skills');
    }
    if ((profile?.education || []).length > 0) {
      set.add('education');
    }
    if ((profile?.experience || []).length > 0) {
      set.add('experience');
    }
    if ((profile?.portfolio || []).length > 0) {
      set.add('portfolio');
    }
    if ((profile?.certifications || []).length > 0) {
      set.add('certifications');
    }
    if ((profile?.languages || []).length > 0) {
      set.add('languages');
    }
    if (profile?.socialLinks?.linkedin || profile?.socialLinks?.github) {
      set.add('social');
    }
    if (profile?.mujDetails?.enrollmentNo || profile?.mujDetails?.branch) {
      set.add('muj');
    }
    if (profile?.settings) {
      set.add('settings');
    }

    return set;
  }, [profile]);

  const activeStepIndex = steps.findIndex((step) => step.id === activeStepId);

  const goToPrevStep = () => {
    if (activeStepIndex <= 0) {
      return;
    }

    setActiveStepId(steps[activeStepIndex - 1].id);
  };

  const goToNextStep = () => {
    if (activeStepIndex >= steps.length - 1) {
      return;
    }

    setActiveStepId(steps[activeStepIndex + 1].id);
  };

  const jumpToStep = (stepId: string) => {
    if (!steps.some((step) => step.id === stepId)) {
      return;
    }

    setActiveStepId(stepId);
  };

  const activeStep = steps[activeStepIndex] || steps[0];

  if (initialized && !isAuthLoading && !isAuthenticated) {
    return null;
  }

  const renderActiveSection = () => {
    if (!profile) {
      return null;
    }

    switch (activeStepId) {
      case 'basic':
        return (
          <BasicInfoForm
            initialValues={profile}
            isSaving={mutationState.isSaving}
            onSave={updateBasicInfo}
            onUploadAvatar={uploadAvatar}
            onUploadCoverImage={uploadCoverImage}
          />
        );
      case 'about':
        return <AboutForm initialAbout={profile.about || profile.bio || ''} isSaving={mutationState.isSaving} onSave={updateAbout} />;
      case 'skills':
        return (
          <SkillsForm
            initialSkills={profile.skillsDetailed || (profile.skills || []).map((name) => ({ name, level: 'intermediate' }))}
            isSaving={mutationState.isSaving}
            onSave={updateSkills}
          />
        );
      case 'education':
        return (
          <EducationForm
            items={profile.education || []}
            isSaving={mutationState.isSaving}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onDelete={deleteEducation}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            items={profile.experience || []}
            isSaving={mutationState.isSaving}
            onAdd={addExperience}
            onUpdate={updateExperience}
            onDelete={deleteExperience}
          />
        );
      case 'portfolio':
        return (
          <PortfolioForm
            items={profile.portfolio || []}
            isSaving={mutationState.isSaving}
            onAdd={addPortfolio}
            onUpdate={updatePortfolio}
            onDelete={deletePortfolio}
          />
        );
      case 'certifications':
        return (
          <CertificationsForm
            items={profile.certifications || []}
            isSaving={mutationState.isSaving}
            onAdd={addCertification}
            onUpdate={updateCertification}
            onDelete={deleteCertification}
          />
        );
      case 'languages':
        {
          const languageItems = (profile.languages || []).map((item) => {
            if (typeof item === 'string') {
              return { name: item, proficiency: 'conversational' as const };
            }

            return item;
          });

        return (
          <LanguagesForm
            items={languageItems}
            isSaving={mutationState.isSaving}
            onAdd={addLanguage}
            onDelete={deleteLanguage}
          />
        );
        }
      case 'social':
        return (
          <SocialLinksForm
            initialValues={profile.socialLinks}
            isSaving={mutationState.isSaving}
            onSave={updateSocialLinks}
          />
        );
      case 'muj':
        return (
          <MujDetailsForm
            initialValues={profile.mujDetails}
            isSaving={mutationState.isSaving}
            onSave={updateMujDetails}
          />
        );
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Control visibility and communication preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                <span>Show email publicly</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={Boolean(profile.settings?.showEmail)}
                  onChange={(event) => {
                    void updateSettings({ settings: { showEmail: event.target.checked } });
                  }}
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                <span>Allow messages</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={profile.settings?.allowMessages ?? true}
                  onChange={(event) => {
                    void updateSettings({ settings: { allowMessages: event.target.checked } });
                  }}
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 text-sm">
                <span>Show online status</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  defaultChecked={profile.settings?.showOnlineStatus ?? true}
                  onChange={(event) => {
                    void updateSettings({ settings: { showOnlineStatus: event.target.checked } });
                  }}
                />
              </label>

              <Select
                label="Profile Visibility"
                defaultValue={profile.settings?.profileVisibility || 'public'}
                options={[
                  { label: 'Public', value: 'public' },
                  { label: 'MUJ Only', value: 'muj_only' },
                  { label: 'Private', value: 'private' },
                ]}
                onChange={(event) => {
                  void updateSettings({
                    settings: {
                      profileVisibility: event.target.value as 'public' | 'muj_only' | 'private',
                    },
                  });
                }}
              />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-orange-50 via-white to-zinc-50">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="absolute right-6 top-28 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:grid lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-4 lg:px-8 lg:py-8">
        <aside className="hidden h-full self-start space-y-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-sm backdrop-blur lg:block">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Complete Your Profile</h1>
            <p className="text-sm text-zinc-600">Your profile is {score}% complete</p>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${score}%` }} />
          </div>

          <div className="space-y-1">
            {steps.map((step, index) => {
              const isActive = step.id === activeStepId;
              const completed = completedStepSet.has(step.id);
              const Icon = step.icon;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-orange-300 bg-orange-50'
                      : completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <Icon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-800">{step.title}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-zinc-500">
                    {completed ? <CircleCheckBig className="h-4 w-4 text-green-600" /> : null}
                    +{step.points}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="w-full min-w-0 self-start lg:self-stretch">
          <section className="space-y-4 lg:pt-0">
            <Card className="border-zinc-200 bg-white shadow-sm lg:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Complete Your Profile</CardTitle>
                <CardDescription>Your profile is {score}% complete</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="space-y-2 text-sm font-medium text-zinc-800">
                  <span>Jump to section</span>
                  <select
                    value={activeStepId}
                    onChange={(event) => {
                      jumpToStep(event.target.value);
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  >
                    {steps.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.title} (+{step.points})
                      </option>
                    ))}
                  </select>
                </label>
              </CardContent>
            </Card>

            {isLoading || !profile ? (
              <div className="space-y-3">
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-[420px] rounded-xl" />
              </div>
            ) : (
              <>
                <div className="w-full">
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-orange-600" />
                        {activeStep.title}
                      </CardTitle>
                      <CardDescription>
                        Step {activeStepIndex + 1} of {steps.length}. This section adds up to {activeStep.points} points.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                {renderActiveSection()}

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <Button variant="outline" onClick={goToPrevStep} disabled={activeStepIndex <= 0}>
                    Previous Step
                  </Button>

                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-zinc-600">Keep going, you are making your profile stronger.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={goToNextStep} disabled={activeStepIndex >= steps.length - 1}>
                      Next Step
                    </Button>
                    {score > 50 ? (
                      <Button
                        onClick={() => {
                          router.push(`/profile/${profile.user?.id || profile.user?._id}`);
                        }}
                      >
                        View My Profile
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            )}
            </section>
        </div>
      </div>
    </div>
  );
}
