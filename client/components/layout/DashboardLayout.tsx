import type { ReactNode } from 'react';

import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  mode?: 'client' | 'freelancer';
}

const dashboardItems = {
  client: [
    { label: 'Overview', href: '/dashboard/client' },
    { label: 'Projects', href: '/dashboard/client/projects' },
    { label: 'Orders', href: '/dashboard/client/orders' },
    { label: 'Payments', href: '/dashboard/client/payments' },
  ],
  freelancer: [
    { label: 'Overview', href: '/dashboard/freelancer' },
    { label: 'Orders', href: '/dashboard/freelancer/orders' },
    { label: 'Proposals', href: '/dashboard/freelancer/proposals' },
    { label: 'Earnings', href: '/dashboard/freelancer/earnings' },
  ],
} as const;

export default function DashboardLayout({ children, mode = 'client' }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fff8ef]">
      <Navbar />

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <Sidebar title="Dashboard" items={dashboardItems[mode]} />
        {mode === 'client' ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{children}</section>
        ) : (
          <div className="flex-1 w-full">{children}</div>
        )}
      </main>

      <Footer />
    </div>
  );
}
