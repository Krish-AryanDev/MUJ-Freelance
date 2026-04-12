import type { ReactNode } from 'react';

import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Gigs', href: '/admin/gigs' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Disputes', href: '/admin/disputes' },
  { label: 'Withdrawals', href: '/admin/withdrawals' },
  { label: 'Analytics', href: '/admin/analytics' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <Sidebar title="Admin Panel" items={adminItems} />
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">{children}</section>
      </main>

      <Footer />
    </div>
  );
}
