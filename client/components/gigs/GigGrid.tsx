import EmptyState from '../shared/EmptyState';
import Skeleton from '../ui/Skeleton';
import GigCard from './GigCard';

interface GigGridProps {
  gigs: Array<{
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
  }>;
  isLoading?: boolean;
}

export default function GigGrid({ gigs, isLoading = false }: GigGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={`gig-skeleton-${index}`} className="h-80 rounded-xl" />
        ))}
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <EmptyState
        title="No gigs found"
        description="Try changing filters or search terms to find more gigs."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {gigs.map((gig, index) => (
        <GigCard key={gig.id || gig._id || gig.slug || `${gig.title || 'gig'}-${index}`} gig={gig} />
      ))}
    </div>
  );
}
