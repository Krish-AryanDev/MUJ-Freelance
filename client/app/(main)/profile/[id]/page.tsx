'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import PortfolioSection from '../../../../components/profile/PortfolioSection';
import ProfileHeader from '../../../../components/profile/ProfileHeader';
import ProfileStats from '../../../../components/profile/ProfileStats';
import ReviewsSection from '../../../../components/profile/ReviewsSection';
import SkillTags from '../../../../components/profile/SkillTags';
import ErrorState from '../../../../components/shared/ErrorState';
import Skeleton from '../../../../components/ui/Skeleton';
import { useAuth } from '../../../../hooks/useAuth';
import { userService } from '../../../../services/user.service';

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
    queryFn: () => userService.getUserProfile(userId),
    enabled: Boolean(userId),
  });

  const isOwnProfile = Boolean(loggedInUser?.id && loggedInUser.id === userId);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="h-28 rounded-xl" />
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
          title="User profile not found"
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
  const freelancerProfile = profile.freelancerProfile;
  const stats = profile.stats;

  const portfolioItems =
    (freelancerProfile as { portfolioItems?: Array<{ title: string; description?: string; projectUrl?: string; imageUrl?: string }> } | null)
      ?.portfolioItems?.map((item, index) => ({
        id: `${user.id}-portfolio-${index}`,
        title: item.title,
        description: item.description,
        projectUrl: item.projectUrl,
        imageUrl: item.imageUrl,
      })) ?? [];

  const reviewItems: Array<{
    id: string;
    reviewerName: string;
    reviewerAvatarUrl?: string;
    rating: number;
    comment?: string;
    createdAt?: string;
  }> = [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <ProfileHeader
        name={user.fullName}
        role={user.roles?.[0]}
        avatarUrl={user.avatar?.url}
        isVerified={user.isEmailVerified}
        headline={freelancerProfile?.headline}
        joinedAt={user.createdAt}
        location={isOwnProfile ? 'This is your profile' : undefined}
        editProfileHref={isOwnProfile ? '/dashboard/freelancer' : undefined}
        messageHref={!isOwnProfile ? `/messages` : undefined}
      />

      <ProfileStats
        completedOrders={freelancerProfile?.completedOrders ?? stats.ordersCompleted ?? 0}
        totalEarnings={freelancerProfile?.totalEarnings ?? 0}
        averageRating={freelancerProfile?.averageRating ?? 0}
        totalReviews={freelancerProfile?.totalReviews ?? stats.totalPublicReviews ?? 0}
      />

      <SkillTags skills={freelancerProfile?.skills ?? []} />

      <PortfolioSection items={portfolioItems} />

      <ReviewsSection reviews={reviewItems} />
    </div>
  );
}

export default function PublicProfilePage() {
  return <ProfilePageContent />;
}
