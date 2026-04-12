import Link from 'next/link';

import { GIG_CATEGORIES } from '../../constants/categories';
import { truncateText } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';

interface GigCardProps {
  gig: {
    id?: string;
    _id?: string;
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    packages?: Array<{ price?: number }>;
    images?: Array<{ url?: string }>;
    freelancer?: {
      fullName?: string;
      name?: string;
      avatar?: { url?: string };
    };
    createdBy?: {
      fullName?: string;
      name?: string;
      avatar?: { url?: string };
    };
    averageRating?: number;
    totalReviews?: number;
    totalOrders?: number;
  };
}

const formatCategory = (category: string): string => {
  const match = GIG_CATEGORIES.find((item) => item.value === category);
  return match?.label ?? category.replaceAll('_', ' ');
};

const getStartingPrice = (packages: Array<{ price?: number }> | undefined): number => {
  if (!packages || packages.length === 0) {
    return 0;
  }

  const firstPrice = packages[0]?.price;
  if (typeof firstPrice === 'number') {
    return firstPrice;
  }

  const prices = packages
    .map((pkg) => pkg.price)
    .filter((price): price is number => typeof price === 'number');

  if (prices.length === 0) {
    return 0;
  }

  return Math.min(...prices);
};

const getFreelancerName = (gig: GigCardProps['gig']): string => {
  return gig.freelancer?.fullName || gig.freelancer?.name || gig.createdBy?.fullName || gig.createdBy?.name || 'Freelancer';
};

export default function GigCard({ gig }: GigCardProps) {
  const coverImage = gig.images?.[0]?.url || '';
  const startingPrice = getStartingPrice(gig.packages);
  const freelancerName = getFreelancerName(gig);
  const gigIdOrSlug = gig.slug || gig.id || gig._id || '';
  const rating = typeof gig.averageRating === 'number' ? gig.averageRating : 0;
  const totalOrders = typeof gig.totalOrders === 'number' ? gig.totalOrders : 0;
  const totalReviews = typeof gig.totalReviews === 'number' ? gig.totalReviews : 0;

  return (
    <Card className="h-full p-0">
      <Link href={`/gigs/${gigIdOrSlug}`} className="block h-full">
        <div className="relative h-44 overflow-hidden rounded-t-xl bg-zinc-100">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt={gig.title || 'Gig cover'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">No image available</div>
          )}
        </div>

        <div className="p-4">
          <CardHeader className="mb-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge>{formatCategory(gig.category || 'OTHER')}</Badge>
              <span className="text-xs text-zinc-500">{totalOrders} orders</span>
            </div>
            <CardTitle className="line-clamp-2 text-base">{gig.title || 'Untitled Gig'}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-zinc-600">{truncateText(gig.description || '', 110)}</p>
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <Avatar src={gig.freelancer?.avatar?.url || gig.createdBy?.avatar?.url} fallback={freelancerName} size="sm" />
              <span>{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Rating {rating.toFixed(1)}</span>
              <span className="font-semibold text-zinc-900">From Rs {startingPrice}</span>
            </div>
          </CardContent>

          <CardFooter className="mt-3 p-0">
            <span className="text-xs text-zinc-500">{totalReviews} reviews</span>
          </CardFooter>
        </div>
      </Link>
    </Card>
  );
}
