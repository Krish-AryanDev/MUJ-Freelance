import type { UserRole } from '../types/user.types';

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
}

export const ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
} as const;

export const PUBLIC_REGISTRATION_ROLES: ReadonlyArray<Exclude<UserRole, 'admin'>> = [
  ROLES.CLIENT,
  ROLES.FREELANCER,
] as const;

export const ROLE_OPTIONS: ReadonlyArray<RoleOption> = [
  {
    value: ROLES.CLIENT,
    label: 'Client',
    description: 'Post projects, hire freelancers, and manage orders.',
  },
  {
    value: ROLES.FREELANCER,
    label: 'Freelancer',
    description: 'Create gigs, send proposals, and deliver work.',
  },
  {
    value: ROLES.ADMIN,
    label: 'Admin',
    description: 'Moderate users, gigs, orders, and platform disputes.',
  },
] as const;

export const ROLE_VALUES: ReadonlyArray<UserRole> = [
  ROLES.CLIENT,
  ROLES.FREELANCER,
  ROLES.ADMIN,
] as const;

export const isUserRole = (value: string): value is UserRole =>
  ROLE_VALUES.includes(value as UserRole);
