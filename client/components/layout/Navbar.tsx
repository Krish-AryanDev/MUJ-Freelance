'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import { classNames } from '../../utils/helpers';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Gigs', href: '/gigs' },
  { label: 'Projects', href: '/projects' },
  { label: 'Messages', href: '/messages' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          MUJ Freelance
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-900">
              <Avatar src={user.avatar?.url} alt={user.fullName} fallback={user.fullName} size="sm" />
              <span className="hidden text-sm font-medium text-zinc-200 sm:inline">{user.fullName}</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={isLoading}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
            >
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
