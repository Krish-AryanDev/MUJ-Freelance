'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Briefcase, GraduationCap, Mail, MessageCircle, Star } from 'lucide-react';

import PortfolioSection from '../../../../components/profile/PortfolioSection';
import ProfileHeader from '../../../../components/profile/ProfileHeader';
import ProfileStats from '../../../../components/profile/ProfileStats';
import ReviewsSection from '../../../../components/profile/ReviewsSection';
import SkillTags from '../../../../components/profile/SkillTags';
import ErrorState from '../../../../components/shared/ErrorState';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import Skeleton from '../../../../components/ui/Skeleton';
import { useAuth } from '../../../../hooks/useAuth';
import { getProfileByUserId } from '../../../../services/profile.service';

function ProfilePageContent() {
  const params = useParams<{ id: string }>();
  const { user: loggedInUser } = useAuth();
  const userId = String(params?.id || '');

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfileByUserId(userId),
    enabled: Boolean(userId),
  });

  const profileUserId = profile?.user?.id || profile?.user?._id;
  const loggedUserId = loggedInUser?.id || loggedInUser?._id;
  const isOwnProfile = Boolean(loggedUserId && profileUserId && loggedUserId === profileUserId);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    const message = error instanceof Error ? error.message : 'User not found';

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState
          title="Profile not found"
          message={message}
          retryLabel="Retry"
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const user = profile.user;

  const portfolioItems = profile.portfolio || [];
  const experienceItems = profile.experience || [];
  const educationItems = profile.education || [];
  const certificationItems = profile.certifications || [];
  const languageItems = (profile.languages || []).map((item) => {
    if (typeof item === 'string') {
      return { name: item, proficiency: 'conversational' as const };
    }

    return item;
  });

  const normalizedName = user?.name || user?.fullName || 'Freelancer';
  const userRoles = user?.roles || [];
  const isFreelancer = userRoles.includes('freelancer') || user?.role === 'freelancer';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader
        name={normalizedName}
        role={user?.role || user?.roles?.[0]}
        avatarUrl={profile.avatar || user?.avatar?.url}
        coverImageUrl={profile.coverImage}
        isVerified={user?.isVerified ?? user?.isEmailVerified}
        isAvailable={profile.isAvailable}
        responseTime={profile.responseTime}
        hourlyRate={profile.hourlyRate}
        socialLinks={profile.socialLinks}
        profileViews={profile.profileViews}
        completionScore={profile.profileCompletionScore}
        premiumBadge={profile.premiumBadge}
        isOwnProfile={isOwnProfile}
        tagline={profile.tagline || profile.headline}
        joinedAt={profile.createdAt || user?.createdAt}
        location={profile.location}
        editProfileHref={isOwnProfile ? '/profile/setup' : undefined}
        messageHref={!isOwnProfile ? `/messages` : undefined}
        hireHref={!isOwnProfile && isFreelancer ? '/projects' : undefined}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <ProfileStats
            completedProjects={profile.completedProjects || 0}
            totalReviews={profile.totalReviews || 0}
            averageRating={profile.averageRating || 0}
            profileViews={profile.profileViews || 0}
          />

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                {profile.about || profile.bio || 'No about section added yet.'}
              </p>
            </CardContent>
          </Card>

          <SkillTags skills={profile.skills || []} skillsDetailed={profile.skillsDetailed || []} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" /> Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {experienceItems.length === 0 ? <p className="text-sm text-zinc-500">No experience added yet.</p> : null}
              {experienceItems.map((item) => (
                <div key={item._id || `${item.title}-${item.company}`} className="border-l-2 border-orange-200 pl-4">
                  <p className="font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-700">{item.company}</p>
                  <p className="text-xs text-zinc-500">
                    {(item.startDate || '').slice(0, 10) || '-'} - {item.currentlyWorking ? 'Present' : (item.endDate || '').slice(0, 10) || '-'}
                  </p>
                  {item.description ? <p className="mt-1 text-sm text-zinc-600">{item.description}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-orange-600" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {educationItems.length === 0 ? <p className="text-sm text-zinc-500">No education added yet.</p> : null}
              {educationItems.map((item) => (
                <div key={item._id || item.institution} className="border-l-2 border-orange-200 pl-4">
                  <p className="font-semibold text-zinc-900">{item.institution}</p>
                  <p className="text-sm text-zinc-700">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ')}</p>
                  <p className="text-xs text-zinc-500">
                    {item.startYear || '-'} - {item.currentlyStudying ? 'Present' : item.endYear || '-'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <PortfolioSection items={portfolioItems} />

          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {certificationItems.length === 0 ? <p className="text-sm text-zinc-500">No certifications added yet.</p> : null}
              {certificationItems.map((item) => (
                <div key={item._id || item.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">{item.name}</p>
                  <p className="text-sm text-zinc-700">{item.issuingOrganization || 'Issuer not provided'}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              {languageItems.length === 0 ? <p className="text-sm text-zinc-500">No languages added yet.</p> : null}
              <div className="flex flex-wrap gap-2">
                {languageItems.map((item) => (
                  <Badge key={item._id || item.name} variant="info" className="capitalize">
                    {item.name} • {item.proficiency}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <ReviewsSection userId={profileUserId} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-zinc-700">Hourly Rate: {profile.hourlyRate ? `INR ${profile.hourlyRate}/hr` : 'Not set'}</p>
              <p className="text-zinc-700">Availability: {profile.isAvailable ? 'Available' : 'Unavailable'}</p>
              <p className="text-zinc-700">
                Response: {profile.responseTime ? profile.responseTime.replaceAll('_', ' ') : 'Not set'}
              </p>

              {!isOwnProfile ? (
                <div className="flex gap-2">
                  <Link href="/messages" className="flex-1">
                    <Button className="w-full" leftIcon={<MessageCircle className="h-4 w-4" />}>
                      Message
                    </Button>
                  </Link>
                  {isFreelancer ? (
                    <Link href="/projects" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Hire
                      </Button>
                    </Link>
                  ) : null}
                </div>
              ) : (
                <Link href="/profile/setup">
                  <Button className="w-full">Edit Profile</Button>
                </Link>
              )}

              {profile.mujDetails ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
                  <p className="font-semibold text-zinc-800">MUJ Details</p>
                  <p>{profile.mujDetails.branch || 'Branch not set'}</p>
                  <p>Semester {profile.mujDetails.semester || '-'}</p>
                  <p>{profile.mujDetails.batch || 'Batch not set'}</p>
                </div>
              ) : null}

              {profile.socialLinks ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.socialLinks)
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <a key={key} href={String(value)} target="_blank" rel="noreferrer" className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:border-orange-300">
                        {key}
                      </a>
                    ))}
                </div>
              ) : null}

              {profile.isPremium ? (
                <Badge variant="warning" className="inline-flex">
                  <Star className="mr-1 h-3.5 w-3.5" /> Premium {profile.premiumBadge || 'Member'}
                </Badge>
              ) : null}

              {profile.settings?.showEmail && user?.email ? (
                <p className="inline-flex items-center gap-1 text-zinc-700">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  return <ProfilePageContent />;
}
