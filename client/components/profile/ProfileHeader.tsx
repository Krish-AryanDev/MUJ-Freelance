import Link from 'next/link';

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { classNames } from '../../utils/helpers';
import type { UserRole } from '../../types/user.types';

interface ProfileHeaderProps {
  name: string;
  role?: UserRole;
  headline?: string;
  location?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  joinedAt?: string;
  messageHref?: string;
  editProfileHref?: string;
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
  headline,
  location,
  avatarUrl,
  isVerified = false,
  joinedAt,
  messageHref,
  editProfileHref,
  className,
}: ProfileHeaderProps) {
  const joinedLabel = formatJoinedDate(joinedAt);

  return (
    <section className={classNames('rounded-xl border border-zinc-200 bg-white p-6 shadow-sm', className)}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar src={avatarUrl} fallback={name} alt={name} size="lg" />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-900">{name}</h1>
              <Badge variant={isVerified ? 'success' : 'warning'}>
                {isVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <Badge variant="info" className="capitalize">
                {role}
              </Badge>
            </div>

            {headline ? <p className="text-zinc-700">{headline}</p> : null}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
              {location ? <span>{location}</span> : null}
              {joinedLabel ? <span>Joined {joinedLabel}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {messageHref ? (
            <Link href={messageHref}>
              <Button variant="outline">Message</Button>
            </Link>
          ) : null}

          {editProfileHref ? (
            <Link href={editProfileHref}>
              <Button>Edit Profile</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
