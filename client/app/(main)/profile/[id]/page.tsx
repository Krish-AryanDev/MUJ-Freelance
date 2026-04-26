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

const resolvePrimaryRole = (role?: string, roles?: string[]): string => {
  const normalizedRoles = (roles || []).map((item) => item.toLowerCase());

  if (normalizedRoles.includes('admin')) {
    return 'admin';
  }

  if (role && role.trim()) {
    return role;
  }

  if (roles && roles.length > 0) {
    return roles[0];
  }

  return 'client';
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
      <div className="w-full space-y-4 px-0 py-8">
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
      <div className="w-full px-0 py-12">
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
  const primaryRole = resolvePrimaryRole(user?.role, userRoles);
  const isVerifiedUser = Boolean(user?.isVerified || user?.isEmailVerified);
  const isFreelancer = userRoles.includes('freelancer') || user?.role === 'freelancer';
  const joinedLabel = formatJoinedDate(profile.createdAt || user?.createdAt);

  const languageItems: Array<Language> = (profile.languages || []).map((item) => {
    if (typeof item === 'string') {
      return { name: item, proficiency: 'conversational' };
    }

    return item;
  });

  const reviewsPayload = reviewsQuery.data?.success ? reviewsQuery.data.data : defaultReviewsPayload;
  const displayedCompletedProjects = profile.completedProjects || profile.completedOrders || 0;
  const displayedTotalReviews = reviewsPayload.totalReviews || profile.totalReviews || 0;
  const displayedAverageRating =
    reviewsPayload.totalReviews > 0 ? reviewsPayload.averageRating : (profile.averageRating || 0);

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

      <div className="relative w-full space-y-5 px-0 pb-6">
        <section className="overflow-hidden rounded-none border-x-0 border-t-0 border-zinc-200/80 bg-white shadow-sm">
          <div className="relative h-40 bg-gradient-to-r from-zinc-100 via-white to-orange-100 sm:h-44">
            {profile.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.coverImage} alt={`${normalizedName} cover`} className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
          </div>

          <div className="grid gap-6 px-4 pb-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:px-8 lg:pb-8">
            <div className="-mt-14 space-y-4 sm:-mt-16">
              <Avatar
                src={profile.avatar || user?.avatar?.url}
                fallback={normalizedName}
                alt={normalizedName}
                size="lg"
                className="h-20 w-20 border-4 border-white bg-zinc-100 text-zinc-800 shadow-md"
              />

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Hello There</p>
                <h1 className="text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl">
                  I&apos;m <span className="text-orange-500">{normalizedName}</span>
                </h1>
                <p className="text-sm text-zinc-700">{profile.tagline || profile.headline || 'No tagline added yet.'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isVerifiedUser ? 'success' : 'warning'}>
                  {isVerifiedUser ? 'Verified' : 'Unverified'}
                </Badge>
                <Badge variant="info" className="capitalize">
                  {primaryRole}
                </Badge>
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

              <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
                {profile.location ? (
                  <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    {profile.location}
                  </div>
                ) : null}
                {joinedLabel ? <div className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">Joined {joinedLabel}</div> : null}
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                  <Eye className="h-3.5 w-3.5 text-orange-500" />
                  {profile.profileViews || 0} profile views
                </div>
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-orange-500" />
                  {formatResponseTime(profile.responseTime)}
                </div>
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-700">
                  <Wallet className="h-3.5 w-3.5 text-orange-500" />
                  {profile.hourlyRate ? `INR ${profile.hourlyRate}/hr` : 'Rate not set'}
                </div>
                {profile.settings?.showEmail && user?.email ? (
                  <div className="inline-flex w-fit items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
                    <Mail className="h-3.5 w-3.5 text-orange-500" />
                    {user.email}
                  </div>
                ) : null}
              </div>

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
                        className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-orange-300"
                      >
                        {getSocialHostname(urlValue)}
                      </a>
                    ))}
                </div>
              ) : null}
            </div>

            <div className="w-full space-y-2.5 lg:justify-self-end lg:pb-2 lg:pl-2">
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

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Profile Snapshot</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-xl bg-white p-2">
                    <p className="text-base font-semibold text-zinc-900">{displayedCompletedProjects}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Projects</p>
                  </div>
                  <div className="rounded-xl bg-white p-2">
                    <p className="text-base font-semibold text-zinc-900">{displayedTotalReviews}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Reviews</p>
                  </div>
                  <div className="rounded-xl bg-white p-2">
                    <p className="text-base font-semibold text-zinc-900">{displayedAverageRating.toFixed(1)}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <nav className="scrollbar-hide overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white px-2 py-2 shadow-sm">
          <div className="flex min-w-max items-center gap-2">
            {[
              ['about', 'About'],
              ['skills', 'Skills'],
              ['experience', 'Experience'],
              ['education', 'Education'],
              ['portfolio', 'Portfolio'],
              ['certifications', 'Certifications'],
              ['languages', 'Languages'],
              ['reviews', 'Reviews'],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold tracking-wide text-zinc-700 transition hover:border-orange-300 hover:text-orange-600"
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-4">
          <Card id="about" className="border-zinc-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                {profile.about || profile.bio || 'No about section added yet.'}
              </p>
            </CardContent>
          </Card>

          <Card id="skills" className="border-zinc-200/80 shadow-sm">
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

          <Card id="experience" className="border-zinc-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" /> Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {experienceItems.length === 0 ? <p className="text-sm text-zinc-500">No experience added yet.</p> : null}
              {experienceItems.slice(0, 3).map((item) => (
                <div key={item._id || `${item.title}-${item.company}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">{item.title}</p>
                  <p className="text-sm text-zinc-700">{item.company}</p>
                  <p className="text-xs text-zinc-500">
                    {(item.startDate || '').slice(0, 10) || '-'} - {item.currentlyWorking ? 'Present' : (item.endDate || '').slice(0, 10) || '-'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="education" className="border-zinc-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-orange-600" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {educationItems.length === 0 ? <p className="text-sm text-zinc-500">No education added yet.</p> : null}
              {educationItems.slice(0, 3).map((item) => (
                <div key={item._id || item.institution} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">{item.institution}</p>
                  <p className="text-sm text-zinc-700">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ')}</p>
                  <p className="text-xs text-zinc-500">
                    {item.startYear || '-'} - {item.currentlyStudying ? 'Present' : item.endYear || '-'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="portfolio" className="border-zinc-200/80 shadow-sm">
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
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                    >
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPortfolioPreview({ src: item.imageUrl || '', alt: item.title })}
                          className="relative block h-36 w-full"
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
                        <div className="flex h-36 items-center justify-center bg-zinc-100 text-xs text-zinc-500">
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

          <Card id="certifications" className="border-zinc-200/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {certificationItems.length === 0 ? <p className="text-sm text-zinc-500">No certifications added yet.</p> : null}
              {certificationItems.slice(0, 4).map((item) => (
                <div key={item._id || item.name} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-900">{item.name}</p>
                  <p className="text-sm text-zinc-700">{item.issuingOrganization || 'Issuer not provided'}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="languages" className="border-zinc-200/80 shadow-sm">
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

          <Card id="reviews" className="border-zinc-200/80 shadow-sm">
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
