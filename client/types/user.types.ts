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
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface FreelancerProfile {
  headline: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  languages: string[];
  totalEarnings: number;
  completedOrders: number;
  averageRating: number;
  totalReviews: number;
  socialLinks?: SocialLinks;
}

export interface User {
  id: Id;
  fullName: string;
  email: string;
  roles: UserRole[];
  isEmailVerified: boolean;
  accountStatus: AccountStatus;
  avatar?: Avatar;
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
