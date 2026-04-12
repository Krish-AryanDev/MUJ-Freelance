/**
 * Gig domain models used for listing, details and management.
 */

import type { Id, ISODateString } from './api.types';
import type { User } from './user.types';

export type GigStatus = 'active' | 'draft' | 'published' | 'paused' | 'archived';

export type GigCategory =
  | 'WEB_DEVELOPMENT'
  | 'APP_DEVELOPMENT'
  | 'UI_UX_DESIGN'
  | 'GRAPHIC_DESIGN'
  | 'VIDEO_EDITING'
  | 'CONTENT_WRITING'
  | 'DIGITAL_MARKETING'
  | 'DATA_ANALYTICS'
  | 'PHOTOGRAPHY'
  | 'AI_ML'
  | 'TUTORING'
  | 'ASSIGNMENT_HELP'
  | 'RESUME_PORTFOLIO'
  | 'OTHER';

export type GigPackageTier = 'basic' | 'standard' | 'premium';

export interface GigImage {
  url: string;
  publicId: string;
}

export interface GigPackage {
  tier: GigPackageTier;
  title: string;
  description: string;
  deliveryDays: number;
  revisions: number;
  price: number;
  features: string[];
}

export interface GigFaq {
  question: string;
  answer: string;
}

export interface Gig {
  id: Id;
  title: string;
  slug: string;
  description: string;
  category: GigCategory;
  subcategory?: string;
  tags: string[];
  packages: [GigPackage, GigPackage, GigPackage];
  images: GigImage[];
  faqs: GigFaq[];
  status: GigStatus;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  totalOrders: number;
  createdBy: Pick<User, 'id' | 'fullName' | 'avatar'>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface GigFilters {
  category?: GigCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  deliveryDaysMax?: number;
  search?: string;
  sortBy?: 'relevance' | 'newest' | 'price_low_to_high' | 'price_high_to_low' | 'rating';
}

export interface CreateGigRequest {
  title: string;
  description: string;
  category: GigCategory;
  subcategory?: string;
  tags: string[];
  packages: [GigPackage, GigPackage, GigPackage];
  images: GigImage[];
  faqs?: GigFaq[];
  status?: GigStatus;
}

export interface UpdateGigRequest extends Partial<CreateGigRequest> {
  status?: GigStatus;
}
