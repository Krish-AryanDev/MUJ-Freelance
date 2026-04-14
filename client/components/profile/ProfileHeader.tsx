import Link from 'next/link';
import { Clock3, Eye, MapPin, MessageCircle, Pencil, Wallet } from 'lucide-react';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { classNames } from '../../utils/helpers';
import type { SocialLinks, UserRole } from '../../types/user.types';

interface ProfileHeaderProps {
  name: string;
  role?: UserRole;
  tagline?: string;
  location?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  responseTime?: string;
  hourlyRate?: number;
  socialLinks?: SocialLinks;
  profileViews?: number;
  completionScore?: number;
  premiumBadge?: 'none' | 'silver' | 'gold' | 'platinum';
  isOwnProfile?: boolean;
  joinedAt?: string;
  messageHref?: string;
  editProfileHref?: string;
  hireHref?: string;
  className?: string;
}

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

export default function ProfileHeader({
  name,
  role = 'client',
  tagline,
  location,
  avatarUrl,
  coverImageUrl,
  isVerified = false,
  isAvailable,
  responseTime,
  hourlyRate,
  socialLinks,
  profileViews,
  completionScore,
  premiumBadge,
  isOwnProfile = false,
  joinedAt,
  messageHref,
  editProfileHref,
  hireHref,
  className,
}: ProfileHeaderProps) {
  const joinedLabel = formatJoinedDate(joinedAt);
  const premiumVariant =
    premiumBadge === 'gold' || premiumBadge === 'platinum'
      ? 'warning'
      : premiumBadge === 'silver'
        ? 'info'
        : 'default';

  const visibleSocialLinks = [
    socialLinks?.linkedin,
    socialLinks?.github,
    socialLinks?.website,
    socialLinks?.twitter,
    socialLinks?.instagram,
  ].filter(Boolean) as string[];

  const formattedRate =
    typeof hourlyRate === 'number'
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(hourlyRate)
      : null;

  return (
    <section className={classNames('overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm', className)}>
      <div className="relative h-36 w-full bg-gradient-to-r from-orange-300 via-orange-200 to-amber-200">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImageUrl} alt={`${name} cover`} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              src={avatarUrl}
              fallback={name}
              alt={name}
              size="lg"
              className="h-20 w-20 border-4 border-white bg-orange-100 text-orange-800 shadow-md"
            />

            <div className="min-w-0 space-y-2 pt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold text-zinc-900">{name}</h1>
                <Badge variant={isVerified ? 'success' : 'warning'}>{isVerified ? 'Verified' : 'Unverified'}</Badge>
                <Badge variant="info" className="capitalize">
                  {role}
                </Badge>
                {premiumBadge && premiumBadge !== 'none' ? (
                  <Badge variant={premiumVariant} className="capitalize">
                    {premiumBadge}
                  </Badge>
                ) : null}
              </div>

              {tagline ? <p className="text-zinc-700">{tagline}</p> : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                {location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </span>
                ) : null}
                {joinedLabel ? <span>Joined {joinedLabel}</span> : null}
                {typeof profileViews === 'number' ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {profileViews} profile views
                  </span>
                ) : null}
                {responseTime ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {responseTime.replaceAll('_', ' ')}
                  </span>
                ) : null}
                {formattedRate ? (
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                    <Wallet className="h-3.5 w-3.5" />
                    {formattedRate}/hr
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {typeof isAvailable === 'boolean' ? (
                  <Badge variant={isAvailable ? 'success' : 'warning'}>
                    {isAvailable ? 'Available for work' : 'Currently unavailable'}
                  </Badge>
                ) : null}
                {isOwnProfile && typeof completionScore === 'number' ? (
                  <Badge variant="default">Completion {completionScore}%</Badge>
                ) : null}
              </div>

              {visibleSocialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {visibleSocialLinks.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-orange-300 hover:text-orange-700"
                    >
                      {new URL(url).hostname.replace('www.', '')}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-8">
            {!isOwnProfile && messageHref ? (
              <Link href={messageHref}>
                <Button variant="outline" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Message
                </Button>
              </Link>
            ) : null}

            {!isOwnProfile && hireHref ? (
              <Link href={hireHref}>
                <Button>Hire</Button>
              </Link>
            ) : null}

            {isOwnProfile && editProfileHref ? (
              <Link href={editProfileHref}>
                <Button leftIcon={<Pencil className="h-4 w-4" />}>Edit Profile</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
