"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { LogOut, Menu, ShieldCheck, X } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { classNames } from '@/utils/helpers';

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
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, initialized, isAuthenticated, isAdmin, logout } = useAuth();

  const activePageTitle = useMemo(() => {
    const match = adminItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return match?.label || 'Admin Panel';
  }, [pathname]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 text-zinc-600">
        Loading admin dashboard...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">Access denied</p>
          <p className="mt-2 text-sm text-zinc-600">Only admin users can access this panel.</p>
          <button
            type="button"
            className="mt-4 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={() => router.push('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-zinc-700" />
              <div>
                <p className="text-sm font-semibold text-zinc-900">Admin Panel</p>
                <p className="text-xs text-zinc-500">{activePageTitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-900">{user?.fullName}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div
          className={classNames(
            'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden',
            isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <aside
          className={classNames(
            'fixed left-0 top-0 z-50 h-full w-72 border-r border-zinc-200 bg-white p-5 transition-transform lg:sticky lg:top-20 lg:z-10 lg:h-[calc(100vh-6.5rem)] lg:w-64 lg:rounded-xl lg:border lg:p-4',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-base font-semibold text-zinc-900">Navigation</p>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {adminItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={classNames(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">{children}</section>
        </main>
      </div>
    </div>
  );
}
