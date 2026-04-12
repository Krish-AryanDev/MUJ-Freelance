'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';

import type { UserRole } from '../../types/user.types';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVerifiedEmail?: boolean;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireVerifiedEmail = false,
  allowedRoles,
  redirectTo = '/login',
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { initialized, isLoading, isAuthenticated, user } = useAuth();

  const isAuthorizedByRole = useMemo(() => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    return allowedRoles.some((role) => user.roles.includes(role));
  }, [allowedRoles, user]);

  const shouldBlockByAuth = requireAuth && !isAuthenticated;
  const shouldBlockByVerification = requireVerifiedEmail && !user?.isEmailVerified;
  const shouldBlockByRole = !isAuthorizedByRole;

  useEffect(() => {
    if (!initialized || isLoading) {
      return;
    }

    if (shouldBlockByAuth) {
      router.replace(redirectTo);
      return;
    }

    if (!shouldBlockByAuth && shouldBlockByVerification) {
      router.replace('/verify-email');
      return;
    }

    if (!shouldBlockByAuth && !shouldBlockByVerification && shouldBlockByRole) {
      router.replace('/');
    }
  }, [
    initialized,
    isLoading,
    shouldBlockByAuth,
    shouldBlockByVerification,
    shouldBlockByRole,
    router,
    redirectTo,
  ]);

  if (!initialized || isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-[120px] items-center justify-center text-sm opacity-70">Loading...</div>
      )
    );
  }

  if (shouldBlockByAuth || shouldBlockByVerification || shouldBlockByRole) {
    return (
      fallback ?? (
        <div className="flex min-h-[120px] items-center justify-center text-sm opacity-70">
          Redirecting...
        </div>
      )
    );
  }

  return <>{children}</>;
}
