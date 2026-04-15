/**
 * User and authentication related type contracts.
 */

import type { Id, ISODateString } from './api.types';

export type UserRole = 'client' | 'freelancer' | 'admin';

export type AccountStatus = 'pending_verification' | 'active' | 'suspended' | 'blocked';

export interface Avatar {
  url: string;
  publicId?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  behance?: string;
  dribbble?: string;
  website?: string;
  instagram?: string;
  portfolio?: string;
}

export interface SkillDetailed {
  _id?: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Education {
  _id?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  currentlyStudying: boolean;
  grade?: string;
  description?: string;
}

export interface Experience {
  _id?: string;
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
  skills?: string[];
}

export interface PortfolioItem {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  tags?: string[];
  completedAt?: string;
}

export interface Certification {
  _id?: string;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Language {
  _id?: string;
  name: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface MujDetails {
  enrollmentNo?: string;
  branch?: string;
  semester?: number;
  batch?: string;
  hostel?: string;
}

export interface ProfileSettings {
  showEmail: boolean;
  showPhone: boolean;
  showEarnings: boolean;
  profileVisibility: 'public' | 'muj_only' | 'private';
  allowMessages: boolean;
  showOnlineStatus: boolean;
}

export interface FreelancerProfile {
  _id?: string;
  user?: User;
  headline: string;
  bio: string;
  tagline?: string;
  about?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  profileUrl?: string;
  isAvailable?: boolean;
  responseTime?: 'within_an_hour' | 'within_a_few_hours' | 'within_a_day' | 'within_a_few_days';
  skills: string[];
  skillsDetailed?: SkillDetailed[];
  education?: Education[];
  experience?: Experience[];
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
  hourlyRate: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  languages: string[] | Language[];
  mujDetails?: MujDetails;
  settings?: ProfileSettings;
  totalProjects?: number;
  completedProjects?: number;
  totalEarnings: number;
  completedOrders: number;
  averageRating: number;
  totalReviews: number;
  profileViews?: number;
  profileCompletionScore?: number;
  isPremium?: boolean;
  premiumExpiresAt?: string;
  premiumBadge?: 'none' | 'silver' | 'gold' | 'platinum';
  createdAt?: string;
  updatedAt?: string;
  socialLinks?: SocialLinks;
}

export interface User {
  id: Id;
  _id?: string;
  fullName: string;
  name?: string;
  email: string;
  roles: UserRole[];
  role?: UserRole;
  isEmailVerified: boolean;
  isVerified?: boolean;
  accountStatus: AccountStatus;
  isBanned?: boolean;
  avatar?: Avatar;
  enrollmentNo?: string;
  branch?: string;
  semester?: number;
  freelancerProfile?: FreelancerProfile;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AuthTokensInfo {
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface AuthSession {
  user: User;
  tokensInfo: AuthTokensInfo;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  enrollmentNo: string;
  branch: string;
  semester: number;
  role: Exclude<UserRole, 'admin'>;
}

export interface RegisterResponse {
  userId: Id;
  email: string;
  otpSent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessTokenIssued: boolean;
  accessToken?: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatar?: Avatar;
  freelancerProfile?: Partial<FreelancerProfile>;
}

export interface ProfileCompletionTip {
  section: string;
  tip: string;
  points: number;
  completed: boolean;
}

export interface ProfileCompletion {
  score: number;
  tips: ProfileCompletionTip[];
}

export interface UpdateBasicInfoPayload {
  tagline?: string;
  location?: string;
  isAvailable?: boolean;
  responseTime?: FreelancerProfile['responseTime'];
  hourlyRate?: number;
  experienceLevel?: FreelancerProfile['experienceLevel'];
  profileUrl?: string;
  name?: string;
}

export interface UpdateAboutPayload {
  about: string;
}

export interface UpdateSkillsPayload {
  skills: string[];
  skillsDetailed: SkillDetailed[];
}

export interface UpdateSocialLinksPayload {
  socialLinks: SocialLinks;
}

export interface UpdateSettingsPayload {
  settings: Partial<ProfileSettings>;
}

export interface UpdateMujDetailsPayload {
  mujDetails: MujDetails;
}

export interface AddEducationPayload {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  currentlyStudying?: boolean;
  grade?: string;
  description?: string;
}

export interface AddExperiencePayload {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
  description?: string;
  skills?: string[];
}

export interface AddPortfolioPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  tags?: string[];
  completedAt?: string;
}

export interface AddCertificationPayload {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface AddLanguagePayload {
  name: string;
  proficiency: Language['proficiency'];
}

export interface FreelancerSearchParams {
  q?: string;
  skills?: string;
  minRating?: number;
  isAvailable?: boolean;
  experienceLevel?: string;
  minRate?: number;
  maxRate?: number;
  sort?: 'recommended' | 'rating' | 'newest' | 'rate_low' | 'rate_high';
  page?: number;
  limit?: number;
}

export interface FreelancerSearchResponse {
  freelancers: FreelancerProfile[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface FreelancerCard {
  _id: string;
  user: Pick<User, 'id' | '_id' | 'fullName' | 'name' | 'avatar' | 'email'>;
  tagline?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  isAvailable: boolean;
  responseTime?: FreelancerProfile['responseTime'];
  hourlyRate?: number;
  experienceLevel?: FreelancerProfile['experienceLevel'];
  skills: string[];
  averageRating: number;
  totalReviews: number;
  completedProjects: number;
  profileCompletionScore: number;
  isPremium: boolean;
  premiumBadge?: FreelancerProfile['premiumBadge'];
}
