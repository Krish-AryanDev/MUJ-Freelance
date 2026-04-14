'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

interface DashboardRouteLayoutProps {
  children: ReactNode;
}

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialized, isLoading, isAuthenticated, user } = useAuth();
  const roles = user?.roles ?? [];

  useEffect(() => {
    if (!initialized || isLoading) {
      return;
    }

    if (!isAuthenticated || roles.length === 0) {
      router.replace('/login');
      return;
    }

    if (pathname === '/dashboard') {
      if (roles.includes('freelancer')) {
        router.replace('/dashboard/freelancer');
      } else if (roles.includes('client')) {
        router.replace('/dashboard/client');
      } else {
        router.replace('/login');
      }
      return;
    }

    if (pathname.startsWith('/dashboard/client') && !roles.includes('client')) {
      if (roles.includes('freelancer')) {
        router.replace('/dashboard/freelancer');
      } else {
        router.replace('/login');
      }
      return;
    }

    if (pathname.startsWith('/dashboard/freelancer') && !roles.includes('freelancer')) {
      if (roles.includes('client')) {
        router.replace('/dashboard/client');
      } else {
        router.replace('/login');
      }
    }
  }, [initialized, isAuthenticated, isLoading, pathname, roles, router]);

  if (!initialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Spinner className="text-zinc-600" />
          Checking dashboard access...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || roles.length === 0) {
    return null;
  }

  if (pathname.startsWith('/dashboard/client') && !roles.includes('client')) {
    return null;
  }

  if (pathname.startsWith('/dashboard/freelancer') && !roles.includes('freelancer')) {
    return null;
  }

  const mode = pathname.startsWith('/dashboard/freelancer') ? 'freelancer' : 'client';

  return <DashboardLayout mode={mode}>{children}</DashboardLayout>;
}
