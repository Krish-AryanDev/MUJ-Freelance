import Link from 'next/link';

import { GIG_CATEGORIES } from '../../constants/categories';
import { truncateText } from '../../utils/helpers';
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
    .replace(/\s*\[seed[^\]]*\]/gi, '')
    .replace(/\s+\d{10,}\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const getAvatarColorClass = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-indigo-500',
  ];
  const firstChar = name.trim().charCodeAt(0);
  const safeCode = Number.isFinite(firstChar) ? firstChar : 0;
  const index = safeCode % colors.length;
  return colors[index] ?? 'bg-blue-500';
};

const CATEGORY_GRADIENTS: Record<string, { gradient: string; emoji: string; label: string }> = {
  WEB_DEVELOPMENT: {
    gradient: 'from-blue-400 to-blue-600',
    emoji: '💻',
    label: 'Web Development',
  },
  MOBILE_DEVELOPMENT: {
    gradient: 'from-purple-400 to-purple-600',
    emoji: '📱',
    label: 'Mobile Development',
  },
  UI_UX_DESIGN: {
    gradient: 'from-pink-400 to-rose-500',
    emoji: '🎨',
    label: 'UI/UX Design',
  },
  GRAPHIC_DESIGN: {
    gradient: 'from-orange-400 to-orange-500',
    emoji: '✏️',
    label: 'Graphic Design',
  },
  CONTENT_WRITING: {
    gradient: 'from-yellow-400 to-amber-500',
    emoji: '✍️',
    label: 'Content Writing',
  },
  VIDEO_EDITING: {
    gradient: 'from-red-400 to-red-600',
    emoji: '🎬',
    label: 'Video Editing',
  },
  PHOTOGRAPHY: {
    gradient: 'from-teal-400 to-teal-600',
    emoji: '📷',
    label: 'Photography',
  },
  DIGITAL_MARKETING: {
    gradient: 'from-green-400 to-green-600',
    emoji: '📣',
    label: 'Digital Marketing',
  },
  DATA_SCIENCE: {
    gradient: 'from-cyan-400 to-cyan-600',
    emoji: '📊',
    label: 'Data Science',
  },
  MACHINE_LEARNING: {
    gradient: 'from-violet-400 to-violet-600',
    emoji: '🤖',
    label: 'Machine Learning',
  },
  CYBERSECURITY: {
    gradient: 'from-slate-500 to-slate-700',
    emoji: '🔒',
    label: 'Cybersecurity',
  },
  CLOUD_COMPUTING: {
    gradient: 'from-sky-400 to-sky-600',
    emoji: '☁️',
    label: 'Cloud Computing',
  },
  DEVOPS: {
    gradient: 'from-indigo-400 to-indigo-600',
    emoji: '⚙️',
    label: 'DevOps',
  },
  BLOCKCHAIN: {
    gradient: 'from-amber-400 to-amber-600',
    emoji: '⛓️',
    label: 'Blockchain',
  },
  GAME_DEVELOPMENT: {
    gradient: 'from-fuchsia-400 to-fuchsia-600',
    emoji: '🎮',
    label: 'Game Development',
  },
  MUSIC_PRODUCTION: {
    gradient: 'from-rose-400 to-rose-500',
    emoji: '🎵',
    label: 'Music Production',
  },
  ANIMATION: {
    gradient: 'from-lime-400 to-lime-600',
    emoji: '🎭',
    label: 'Animation',
  },
  TUTORING: {
    gradient: 'from-blue-300 to-indigo-500',
    emoji: '📚',
    label: 'Tutoring',
  },
  TRANSLATION: {
    gradient: 'from-emerald-400 to-emerald-600',
    emoji: '🌐',
    label: 'Translation',
  },
  OTHER: {
    gradient: 'from-gray-400 to-gray-600',
    emoji: '💼',
    label: 'Other',
  },
};

const DEFAULT_GRADIENT = {
  gradient: 'from-blue-400 to-indigo-500',
  emoji: '🛠️',
  label: 'Freelance Service',
};

const ACCENT_COLORS: Record<string, string> = {
  WEB_DEVELOPMENT: 'bg-blue-500',
  MOBILE_DEVELOPMENT: 'bg-purple-500',
  UI_UX_DESIGN: 'bg-pink-500',
  GRAPHIC_DESIGN: 'bg-orange-500',
  CONTENT_WRITING: 'bg-amber-500',
  VIDEO_EDITING: 'bg-red-500',
  PHOTOGRAPHY: 'bg-teal-500',
  DIGITAL_MARKETING: 'bg-green-500',
  DATA_SCIENCE: 'bg-cyan-500',
  MACHINE_LEARNING: 'bg-violet-500',
  CYBERSECURITY: 'bg-slate-600',
  CLOUD_COMPUTING: 'bg-sky-500',
  DEVOPS: 'bg-indigo-500',
  BLOCKCHAIN: 'bg-amber-600',
  GAME_DEVELOPMENT: 'bg-fuchsia-500',
  MUSIC_PRODUCTION: 'bg-rose-500',
  ANIMATION: 'bg-lime-500',
  TUTORING: 'bg-blue-400',
  TRANSLATION: 'bg-emerald-500',
  OTHER: 'bg-gray-500',
};

const BODY_GRADIENTS: Record<string, string> = {
  WEB_DEVELOPMENT: 'from-white via-white to-blue-50',
  MOBILE_DEVELOPMENT: 'from-white via-white to-violet-50',
  UI_UX_DESIGN: 'from-white via-white to-pink-50',
  GRAPHIC_DESIGN: 'from-white via-white to-orange-50',
  CONTENT_WRITING: 'from-white via-white to-amber-50',
  VIDEO_EDITING: 'from-white via-white to-red-50',
  PHOTOGRAPHY: 'from-white via-white to-teal-50',
  DIGITAL_MARKETING: 'from-white via-white to-green-50',
  DATA_SCIENCE: 'from-white via-white to-cyan-50',
  MACHINE_LEARNING: 'from-white via-white to-violet-50',
  CYBERSECURITY: 'from-white via-white to-slate-100',
  CLOUD_COMPUTING: 'from-white via-white to-sky-50',
  DEVOPS: 'from-white via-white to-indigo-50',
  BLOCKCHAIN: 'from-white via-white to-amber-50',
  GAME_DEVELOPMENT: 'from-white via-white to-fuchsia-50',
  MUSIC_PRODUCTION: 'from-white via-white to-rose-50',
  ANIMATION: 'from-white via-white to-lime-50',
  TUTORING: 'from-white via-white to-blue-50',
  TRANSLATION: 'from-white via-white to-emerald-50',
  OTHER: 'from-white via-white to-gray-50',
};

export default function GigCard({ gig }: GigCardProps) {
  const hasImage = Boolean(
    gig.images &&
      Array.isArray(gig.images) &&
      gig.images.length > 0 &&
      gig.images[0] &&
      typeof gig.images[0].url === 'string' &&
      gig.images[0].url.trim() !== '' &&
      gig.images[0].url.startsWith('http')
  );
  const startingPrice = getStartingPrice(gig.packages);
  const freelancerName = getFreelancerName(gig);
  const avatarUrl = gig.freelancer?.avatar?.url || gig.createdBy?.avatar?.url || '';
  const gigIdOrSlug = gig.slug || gig.id || gig._id || '';
  const rating = typeof gig.averageRating === 'number' ? gig.averageRating : 0;
  const totalOrders = typeof gig.totalOrders === 'number' ? gig.totalOrders : 0;
  const totalReviews = typeof gig.totalReviews === 'number' ? gig.totalReviews : 0;
  const categoryStyle = CATEGORY_GRADIENTS[gig.category || 'OTHER'] ?? DEFAULT_GRADIENT;
  const accentColor = ACCENT_COLORS[gig.category || 'OTHER'] ?? 'bg-blue-500';
  const bodyGradient = BODY_GRADIENTS[gig.category || 'OTHER'] ?? 'from-white via-white to-blue-50';
  const cleanTitle = sanitizeGigTitle(gig.title);
  const avatarColorClass = getAvatarColorClass(gig.freelancer?.name || freelancerName);

  return (
    <Card
      className="h-full overflow-hidden rounded-[1.15rem] border border-[#d8deeb] p-0 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <Link href={`/gigs/${gigIdOrSlug}`} className="block h-full">
        <div className={`h-1 w-full ${accentColor}`} />

        {hasImage ? (
          <div className="relative h-40 w-full overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gig.images?.[0]?.url}
              alt={gig.title || 'Gig cover'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div
            className={`relative flex h-40 w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${categoryStyle.gradient}`}
          >
            <div className="absolute right-2 top-2 h-16 w-16 rounded-full bg-white opacity-10" />
            <div className="absolute bottom-2 left-2 h-20 w-20 rounded-full bg-white opacity-10" />
            <span className="z-10 mb-2 text-5xl drop-shadow">{categoryStyle.emoji}</span>
            <span className="z-10 text-xs font-semibold uppercase tracking-widest text-white opacity-80">
              {categoryStyle.label}
            </span>
          </div>
        )}

        <div className={`animate-card-body-gradient bg-gradient-to-b ${bodyGradient} p-3`}>
          <CardHeader className="mb-1.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge className="rounded-full border border-orange-100 bg-orange-50 text-orange-700">
                {formatCategory(gig.category || 'OTHER')}
              </Badge>
              <span className="text-xs text-[#64748b]">{totalOrders} orders</span>
            </div>
            <CardTitle className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
              {cleanTitle}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <p className="line-clamp-3 text-sm leading-relaxed text-[#475569]">{truncateText(gig.description || '', 86)}</p>
            <div className="flex items-center gap-2 text-sm text-[#334155]">
              <div
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColorClass}`}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={freelancerName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span>{(gig.freelancer?.name || freelancerName)?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </div>
              <span>{freelancerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748b]">Rating {rating.toFixed(1)}</span>
              <span className="font-bold text-[#0b1220]">From Rs {startingPrice}</span>
            </div>
          </CardContent>

          <CardFooter className="mt-2 p-0">
            <span className="text-xs text-[#64748b]">{totalReviews} reviews</span>
          </CardFooter>
        </div>
      </Link>
    </Card>
  );
}
