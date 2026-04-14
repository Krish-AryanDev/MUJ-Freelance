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

const sanitizeGigTitle = (title?: string): string => {
  if (!title) {
    return 'Untitled Gig';
  }

  return title
    .replace(/\s*\[seed[^\]]*\]\s*/gi, ' ')
    .replace(/\s*seed\s*\d[\d-]*\]?/gi, ' ')
    .replace(/\s+\d{10,}$/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const CATEGORY_GRADIENT: Record<string, string> = {
  WEB_DEVELOPMENT: 'from-white via-white to-[#eaf3ff]',
  MOBILE_DEVELOPMENT: 'from-white via-white to-[#f7f0ff]',
  UI_UX_DESIGN: 'from-white via-white to-[#fff3fa]',
  GRAPHIC_DESIGN: 'from-white via-white to-[#fff7e6]',
  CONTENT_WRITING: 'from-white via-white to-[#fffbe6]',
  VIDEO_EDITING: 'from-white via-white to-[#ffecec]',
  PHOTOGRAPHY: 'from-white via-white to-[#e6fcf7]',
  DIGITAL_MARKETING: 'from-white via-white to-[#eafcf1]',
  DATA_SCIENCE: 'from-white via-white to-[#e6fbfd]',
  MACHINE_LEARNING: 'from-white via-white to-[#f4f0ff]',
  CYBERSECURITY: 'from-white via-white to-[#f4f6fa]',
  CLOUD_COMPUTING: 'from-white via-white to-[#eaf8ff]',
  DEVOPS: 'from-white via-white to-[#f0f3ff]',
  BLOCKCHAIN: 'from-white via-white to-[#fffbe6]',
  GAME_DEVELOPMENT: 'from-white via-white to-[#fbeaff]',
  MUSIC_PRODUCTION: 'from-white via-white to-[#fff0f3]',
  TUTORING: 'from-white via-white to-[#eaf3ff]',
  TRANSLATION: 'from-white via-white to-[#e6fbee]',
  OTHER: 'from-white via-white to-[#f6f8fa]',
};

const DEFAULT_GRADIENT = 'from-white via-white to-[#edf1f4]';

const getCardGradient = (category: string): string => {
  return CATEGORY_GRADIENT[category] ?? DEFAULT_GRADIENT;
};

const CARD_THEMES = [
  {
    card: 'from-[#ffffff] via-[#f7f9ff] to-[#eef3ff]',
    media: 'bg-[#e9e4ff]',
    badge: 'border-[#cfc4ff] bg-[#f3efff] text-[#4c3f8f]',
  },
  {
    card: 'from-[#ffffff] via-[#f3fcf9] to-[#e6f9f4]',
    media: 'bg-[#d8f3ef]',
    badge: 'border-[#a8e7da] bg-[#e6f9f4] text-[#0f5f57]',
  },
  {
    card: 'from-[#ffffff] via-[#f5f9ff] to-[#ebf2ff]',
    media: 'bg-[#dfeaff]',
    badge: 'border-[#bfd4ff] bg-[#ebf2ff] text-[#1f4c98]',
  },
] as const;

const getCardTheme = (category?: string) => {
  const source = String(category || 'OTHER');
  const seed = source.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CARD_THEMES[seed % CARD_THEMES.length];
};

export default function GigCard({ gig }: GigCardProps) {
  const coverImage = gig.images?.[0]?.url || '';
  const startingPrice = getStartingPrice(gig.packages);
  const freelancerName = getFreelancerName(gig);
  const displayTitle = sanitizeGigTitle(gig.title);
  const gigIdOrSlug = gig.slug || gig.id || gig._id || '';
  const rating = typeof gig.averageRating === 'number' ? gig.averageRating : 0;
  const totalOrders = typeof gig.totalOrders === 'number' ? gig.totalOrders : 0;
  const totalReviews = typeof gig.totalReviews === 'number' ? gig.totalReviews : 0;
  const theme = getCardTheme(gig.category);
  const cardGradient = getCardGradient(gig.category || 'OTHER');

  return (
    <Card
      className={`h-full overflow-hidden rounded-[1.15rem] border border-[#d8deeb] bg-gradient-to-br ${cardGradient} p-0 shadow-[0_10px_24px_rgba(15,23,42,0.08)]`}
    >
      <Link href={`/gigs/${gigIdOrSlug}`} className="block h-full">
        <div className={`relative h-44 overflow-hidden rounded-t-[1.15rem] ${theme.media}`}>
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt={gig.title || 'Gig cover'} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#64748b]">No image available</div>
          )}
        </div>

        <div className="p-4">
          <CardHeader className="mb-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge className={`rounded-full border ${theme.badge}`}>{formatCategory(gig.category || 'OTHER')}</Badge>
              <span className="text-xs text-[#64748b]">{totalOrders} orders</span>
            </div>
            <CardTitle className="line-clamp-2 text-[2rem] font-black leading-[1.15] tracking-[-0.02em] text-[#0b1220]">{displayTitle}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-[#475569]">{truncateText(gig.description || '', 110)}</p>
            <div className="flex items-center gap-2 text-sm text-[#334155]">
              <Avatar src={gig.freelancer?.avatar?.url || gig.createdBy?.avatar?.url} fallback={freelancerName} size="sm" />
              <span>{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748b]">Rating {rating.toFixed(1)}</span>
              <span className="font-bold text-[#0b1220]">From Rs {startingPrice}</span>
            </div>
          </CardContent>

          <CardFooter className="mt-3 p-0">
            <span className="text-xs text-[#64748b]">{totalReviews} reviews</span>
          </CardFooter>
        </div>
      </Link>
    </Card>
  );
}
