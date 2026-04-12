'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import DashboardLayout from '../../components/layout/DashboardLayout';

interface DashboardRouteLayoutProps {
  children: ReactNode;
}

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  const pathname = usePathname();
  const mode = pathname.startsWith('/dashboard/freelancer') ? 'freelancer' : 'client';

  return <DashboardLayout mode={mode}>{children}</DashboardLayout>;
}
