'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Briefcase,
  Clock3,
  ExternalLink,
  Eye,
  Github,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Star,
  Wallet,
} from 'lucide-react';

import RatingBreakdown from '../../../../components/reviews/RatingBreakdown';
import ReviewCard from '../../../../components/reviews/ReviewCard';
import ErrorState from '../../../../components/shared/ErrorState';
import EmptyState from '../../../../components/shared/EmptyState';
import Avatar from '../../../../components/ui/Avatar';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import Skeleton from '../../../../components/ui/Skeleton';
import { useAuth } from '../../../../hooks/useAuth';
import { reviewService } from '../../../../services/review.service';
import { getProfileByUserId } from '../../../../services/profile.service';
import type { ReviewFilters, UserReviewsResponse } from '../../../../types/review.types';
import type { Language } from '../../../../types/user.types';
import { classNames, truncateText } from '../../../../utils/helpers';

const formatJoinedDate = (dateValue?: string): string | null => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
};

const formatResponseTime = (value?: string): string => {
  if (!value) {
    return 'Not set';
  }
  return value.replaceAll('_', ' ');
};

const getSocialHostname = (urlValue: string): string => {
  try {
    return new URL(urlValue).hostname.replace('www.', '');
  } catch (_error) {
    return urlValue;
  }
};

const isLevel = (value: string): value is 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  return ['beginner', 'intermediate', 'advanced', 'expert'].includes(value);
};

const levelStyleMap: Record<'beginner' | 'intermediate' | 'advanced' | 'expert', string> = {
  beginner: 'border-blue-200 bg-blue-50 text-blue-700',
  intermediate: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  advanced: 'border-orange-200 bg-orange-50 text-orange-700',
  expert: 'border-violet-200 bg-violet-50 text-violet-700',
};

const defaultReviewsPayload: UserReviewsResponse = {
  reviews: [],
  totalReviews: 0,
  averageRating: 0,
  ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  currentPage: 1,
  totalPages: 1,
};

function ProfilePageContent() {
  const params = useParams<{ id: string }>();
  const { user: loggedInUser } = useAuth();
  const userId = String(params?.id || '');
  const [portfolioPreview, setPortfolioPreview] = useState<{ src: string; alt: string } | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSort, setReviewsSort] = useState<ReviewFilters['sort']>('recent');

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

  const reviewsQuery = useQuery({
    queryKey: ['user-reviews', userId, reviewsPage, reviewsSort],
    queryFn: () =>
      reviewService.getUserReviews(userId, {
        page: reviewsPage,
        limit: 5,
        sort: reviewsSort,
      }),
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

  const normalizedName = user?.name || user?.fullName || 'Freelancer';
  const userRoles = user?.roles || [];
  const isFreelancer = userRoles.includes('freelancer') || user?.role === 'freelancer';
  const joinedLabel = formatJoinedDate(profile.createdAt || user?.createdAt);

  const languageItems: Array<Language> = (profile.languages || []).map((item) => {
    if (typeof item === 'string') {
      return { name: item, proficiency: 'conversational' };
    }

    return item;
  });

  const reviewsPayload = reviewsQuery.data?.success ? reviewsQuery.data.data : defaultReviewsPayload;

  const detailedSkills = (profile.skillsDetailed || []).filter(
    (skill): skill is { name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' } =>
      Boolean(skill.name?.trim()) && isLevel(skill.level),
  );

  const groupedSkills = detailedSkills.reduce<
    Record<string, Array<{ name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }>>
  >((acc, skill) => {
    if (!acc[skill.level]) {
      acc[skill.level] = [];
    }
    acc[skill.level].push(skill);
    return acc;
  }, {});

  return (
    <div className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-orange-100/80 via-amber-50/30 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-16 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-zinc-200/80 shadow-sm">
          <div className="relative h-24 w-full bg-gradient-to-r from-zinc-100 via-white to-orange-100">
            {profile.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.coverImage} alt={`${normalizedName} cover`} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <CardContent className="-mt-8 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={profile.avatar || user?.avatar?.url}
                    fallback={normalizedName}
                    alt={normalizedName}
                    size="lg"
                    className="h-16 w-16 border-4 border-white shadow"
                  />

                  <div className="min-w-0 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-2xl font-semibold text-zinc-900">{normalizedName}</h1>
                      <Badge variant={(user?.isVerified ?? user?.isEmailVerified) ? 'success' : 'warning'}>
                        {(user?.isVerified ?? user?.isEmailVerified) ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Badge variant="info" className="capitalize">
                        {user?.role || user?.roles?.[0] || 'client'}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-zinc-700">{profile.tagline || profile.headline || 'No tagline added yet.'}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      {profile.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {profile.location}
                        </span>
                      ) : null}
                      {joinedLabel ? <span>Joined {joinedLabel}</span> : null}
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {profile.profileViews || 0} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatResponseTime(profile.responseTime)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                        <Wallet className="h-3.5 w-3.5" />
                        {profile.hourlyRate ? `INR ${profile.hourlyRate}/hr` : 'Rate not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {typeof profile.isAvailable === 'boolean' ? (
                    <Badge variant={profile.isAvailable ? 'success' : 'warning'}>
                      {profile.isAvailable ? 'Available for work' : 'Currently unavailable'}
                    </Badge>
                  ) : null}
                  {isOwnProfile ? <Badge variant="default">Completion {profile.profileCompletionScore || 0}%</Badge> : null}
                  {profile.isPremium ? (
                    <Badge variant="warning" className="capitalize">
                      <Star className="mr-1 h-3.5 w-3.5" /> Premium {profile.premiumBadge || 'member'}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[250px]">
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
                    <Button className="w-full" leftIcon={<Pencil className="h-4 w-4" />}>
                      Edit Profile
                    </Button>
                  </Link>
                )}

                {profile.settings?.showEmail && user?.email ? (
                  <p className="inline-flex items-center gap-1 text-xs text-zinc-600">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </p>
                ) : null}

                {profile.socialLinks ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.values(profile.socialLinks)
                      .filter((value): value is string => Boolean(value))
                      .map((urlValue) => (
                        <a
                          key={urlValue}
                          href={urlValue}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-700 transition hover:border-orange-300"
                        >
                          {getSocialHostname(urlValue)}
                        </a>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Completed Projects', value: profile.completedProjects || 0 },
            { label: 'Total Reviews', value: profile.totalReviews || 0 },
            { label: 'Average Rating', value: (profile.averageRating || 0).toFixed(1), hint: 'Out of 5.0' },
            { label: 'Profile Views', value: profile.profileViews || 0 },
          ].map((stat) => (
            <Card key={stat.label} className="border-zinc-200/80 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{stat.value}</p>
                {stat.hint ? <p className="mt-0.5 text-xs text-zinc-500">{stat.hint}</p> : null}
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="space-y-4">
            <Card className="border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                  {profile.about || profile.bio || 'No about section added yet.'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {detailedSkills.length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(groupedSkills).map(([level, skills]) => (
                      <div key={level}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">{level}</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span
                              key={`${skill.name}-${skill.level}`}
                              className={classNames(
                                'rounded-full border px-2.5 py-1 text-xs font-medium',
                                levelStyleMap[skill.level],
                              )}
                            >
                              {skill.name} <span className="capitalize opacity-80">{skill.level}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (profile.skills || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills || []).map((skill) => (
                      <Badge key={skill} variant="default" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-zinc-200/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-orange-600" /> Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {experienceItems.length === 0 ? <p className="text-sm text-zinc-500">No experience added yet.</p> : null}
                  {experienceItems.slice(0, 3).map((item) => (
                    <div key={item._id || `${item.title}-${item.company}`} className="border-l-2 border-orange-200 pl-3">
                      <p className="font-semibold text-zinc-900">{item.title}</p>
                      <p className="text-sm text-zinc-700">{item.company}</p>
                      <p className="text-xs text-zinc-500">
                        {(item.startDate || '').slice(0, 10) || '-'} - {item.currentlyWorking ? 'Present' : (item.endDate || '').slice(0, 10) || '-'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-zinc-200/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-orange-600" /> Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {educationItems.length === 0 ? <p className="text-sm text-zinc-500">No education added yet.</p> : null}
                  {educationItems.slice(0, 3).map((item) => (
                    <div key={item._id || item.institution} className="border-l-2 border-orange-200 pl-3">
                      <p className="font-semibold text-zinc-900">{item.institution}</p>
                      <p className="text-sm text-zinc-700">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ')}</p>
                      <p className="text-xs text-zinc-500">
                        {item.startYear || '-'} - {item.currentlyStudying ? 'Present' : item.endYear || '-'}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioItems.length === 0 ? (
                  <p className="text-sm text-zinc-500">No portfolio projects added yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {portfolioItems.slice(0, 6).map((item) => (
                      <article
                        key={item._id || item.title}
                        className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
                      >
                        {item.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPortfolioPreview({ src: item.imageUrl || '', alt: item.title })}
                            className="relative block h-28 w-full"
                          >
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 100vw, 360px"
                              className="object-cover"
                            />
                          </button>
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-zinc-100 text-xs text-zinc-500">
                            No preview image
                          </div>
                        )}
                        <div className="space-y-2 p-3">
                          <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                          {item.description ? (
                            <p className="text-xs leading-5 text-zinc-600">{truncateText(item.description, 90)}</p>
                          ) : null}
                          <div className="flex items-center gap-3 text-xs">
                            {item.projectUrl ? (
                              <a href={item.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                <ExternalLink className="h-3 w-3" /> Project
                              </a>
                            ) : null}
                            {item.githubUrl ? (
                              <a href={item.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-700 hover:underline">
                                <Github className="h-3 w-3" /> GitHub
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-zinc-200/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {certificationItems.length === 0 ? <p className="text-sm text-zinc-500">No certifications added yet.</p> : null}
                  {certificationItems.slice(0, 4).map((item) => (
                    <div key={item._id || item.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-sm text-zinc-700">{item.issuingOrganization || 'Issuer not provided'}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-zinc-200/80 shadow-sm">
                <CardHeader className="pb-2">
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
            </div>

            <Card className="border-zinc-200/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Reviews</CardTitle>
                  <select
                    value={reviewsSort}
                    onChange={(event) => {
                      setReviewsSort(event.target.value as ReviewFilters['sort']);
                      setReviewsPage(1);
                    }}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <RatingBreakdown
                  breakdown={reviewsPayload.ratingBreakdown}
                  totalReviews={reviewsPayload.totalReviews}
                  averageRating={reviewsPayload.averageRating}
                />

                <div className="mt-4 space-y-3">
                  {reviewsQuery.isLoading ? (
                    <>
                      <Skeleton className="h-24 rounded-lg" />
                      <Skeleton className="h-24 rounded-lg" />
                    </>
                  ) : null}

                  {reviewsQuery.isError ? (
                    <ErrorState
                      title="Unable to load reviews"
                      message={reviewsQuery.error instanceof Error ? reviewsQuery.error.message : 'Please try again.'}
                      onRetry={() => {
                        void reviewsQuery.refetch();
                      }}
                    />
                  ) : null}

                  {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length === 0 ? (
                    <EmptyState title="No reviews yet" description="No reviews yet." />
                  ) : null}

                  {!reviewsQuery.isLoading && !reviewsQuery.isError && reviewsPayload.reviews.length > 0 ? (
                    <>
                      {reviewsPayload.reviews.map((review) => (
                        <ReviewCard key={review._id} review={review} showGigTitle />
                      ))}

                      <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                          onClick={() => setReviewsPage((prev) => Math.max(prev - 1, 1))}
                          disabled={reviewsPayload.currentPage <= 1}
                        >
                          Previous
                        </button>

                        <span className="text-xs text-zinc-600">
                          Page {reviewsPayload.currentPage} of {reviewsPayload.totalPages}
                        </span>

                        <button
                          type="button"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                          onClick={() => setReviewsPage((prev) => Math.min(prev + 1, reviewsPayload.totalPages))}
                          disabled={reviewsPayload.currentPage >= reviewsPayload.totalPages}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>

      {portfolioPreview ? (
        <button
          type="button"
          onClick={() => setPortfolioPreview(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6"
        >
          <Image
            src={portfolioPreview.src}
            alt={portfolioPreview.alt}
            width={1600}
            height={900}
            unoptimized
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        </button>
      ) : null}
    </div>
  );
}

export default function PublicProfilePage() {
  return <ProfilePageContent />;
}
