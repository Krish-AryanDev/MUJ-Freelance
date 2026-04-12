import type { GigCategory } from '../types/gig.types';

export interface CategoryOption {
  value: GigCategory;
  label: string;
  description: string;
}

export const GIG_CATEGORIES: ReadonlyArray<CategoryOption> = [
  {
    value: 'WEB_DEVELOPMENT',
    label: 'Web Development',
    description: 'Web apps, landing pages, full-stack websites.',
  },
  {
    value: 'APP_DEVELOPMENT',
    label: 'App Development',
    description: 'Android, iOS, and cross-platform mobile app work.',
  },
  {
    value: 'UI_UX_DESIGN',
    label: 'UI/UX Design',
    description: 'Figma designs, wireframes, and user experience audits.',
  },
  {
    value: 'GRAPHIC_DESIGN',
    label: 'Graphic Design',
    description: 'Branding, social creatives, posters, and visual assets.',
  },
  {
    value: 'VIDEO_EDITING',
    label: 'Video Editing',
    description: 'YouTube reels, short-form edits, and post-production.',
  },
  {
    value: 'CONTENT_WRITING',
    label: 'Content Writing',
    description: 'Blogs, technical writing, and copywriting.',
  },
  {
    value: 'DIGITAL_MARKETING',
    label: 'Digital Marketing',
    description: 'SEO, social growth, and campaign strategy.',
  },
  {
    value: 'DATA_ANALYTICS',
    label: 'Data Analytics',
    description: 'Dashboards, analytics reports, and data insights.',
  },
  {
    value: 'PHOTOGRAPHY',
    label: 'Photography',
    description: 'Product shoots, portraits, and event photography services.',
  },
  {
    value: 'AI_ML',
    label: 'AI / ML',
    description: 'Model building, AI integrations, and data-driven solutions.',
  },
  {
    value: 'TUTORING',
    label: 'Tutoring',
    description: 'Peer tutoring, subject mentoring, and exam prep.',
  },
  {
    value: 'ASSIGNMENT_HELP',
    label: 'Assignment Help',
    description: 'Academic assignment support and concept guidance.',
  },
  {
    value: 'RESUME_PORTFOLIO',
    label: 'Resume & Portfolio',
    description: 'Resume optimization and portfolio website support.',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other freelance services not listed above.',
  },
] as const;

export const GIG_CATEGORY_VALUES: ReadonlyArray<GigCategory> = GIG_CATEGORIES.map(
  (category) => category.value,
);

export const isGigCategory = (value: string): value is GigCategory =>
  GIG_CATEGORY_VALUES.includes(value as GigCategory);
