'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/message.service';
import { getProfileCompletionTips } from '../../services/profile.service';
import Avatar from '../ui/Avatar';
import NotificationBell from '../notifications/NotificationBell';
import { classNames, isServiceUnavailableError } from '../../utils/helpers';

const discoverNavItems = [
  { label: 'Home', href: '/' },
  { label: 'Freelancers', href: '/freelancers' },
  { label: 'Projects', href: '/projects' },
] as const;

const isLinkActive = (pathname: string, href: string): boolean => {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, initialized, logout, isLoading } = useAuth();
  const { isConnected } = useSocket();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);

  const hasClientRole = Boolean(user?.roles?.includes('client'));
  const hasFreelancerRole = Boolean(user?.roles?.includes('freelancer'));
  const isAdmin = Boolean(user?.roles?.includes('admin'));
  const dashboardHref = hasFreelancerRole ? '/dashboard/freelancer' : '/dashboard/client';
  const userInitial = (user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const canFetchProtectedData = Boolean(initialized && isAuthenticated && !isLoading && user?.id);

  const unreadQuery = useQuery({
    queryKey: ['messages', 'unread-count', user?.id || ''],
    queryFn: messageService.getUnreadCount,
    enabled: canFetchProtectedData,
    staleTime: 15000,
    retry: (failureCount, error) => {
      if (isServiceUnavailableError(error)) {
        return false;
      }

      return failureCount < 2;
    },
    refetchInterval: (query) => {
      if (isServiceUnavailableError(query.state.error)) {
        return false;
      }

      return isConnected ? 45000 : 25000;
    },
    refetchOnWindowFocus: false,
  });

  const unreadCount = unreadQuery.data?.success ? unreadQuery.data.data.count : 0;

  const profileCompletionQuery = useQuery({
    queryKey: ['profile', 'completion', user?.id || ''],
    queryFn: getProfileCompletionTips,
    enabled: canFetchProtectedData,
    retry: (failureCount, error) => {
      if (isServiceUnavailableError(error)) {
        return false;
      }

      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });

  const completionScore = profileCompletionQuery.data?.score || 0;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!profileRef.current) {
        return;
      }

      const target = event.target as Node;
      if (!profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const roleBadgeLabel = useMemo(() => {
    if (isAdmin) {
      return 'Admin';
    }

    if (hasFreelancerRole && hasClientRole) {
      return 'Client + Freelancer';
    }

    if (hasFreelancerRole) {
      return 'Freelancer';
    }

    return 'Client';
  }, [hasClientRole, hasFreelancerRole, isAdmin]);

  const closeAllMenus = () => {
    setIsProfileOpen(false);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    closeAllMenus();

    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  const renderMessageIcon = () => {
    if (!isAuthenticated) {
      return null;
    }

    const active = isLinkActive(pathname, '/messages');

    return (
      <Link
        href="/messages"
        aria-label="Messages"
        onClick={closeAllMenus}
        className={classNames(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          active
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
        )}
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Link>
    );
  };

  const profileMenuItems = [
    {
      label: 'My Profile',
      href: user ? `/profile/${user.id}` : '/login',
      icon: User,
      show: true,
    },
    {
      label: 'Dashboard',
      href: dashboardHref,
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: completionScore < 100 ? `Setup Profile (${completionScore}%)` : 'Setup Profile',
      href: '/profile/setup',
      icon: User,
      show: true,
    },
    {
      label: 'My Orders',
      href: '/dashboard/client/orders',
      icon: ShoppingCart,
      show: hasClientRole,
    },
    {
      label: 'Work Orders',
      href: '/dashboard/freelancer/orders',
      icon: BriefcaseBusiness,
      show: hasFreelancerRole,
    },
    {
      label: 'Admin Panel',
      href: '/admin',
      icon: ShieldCheck,
      show: isAdmin,
    },
  ];

  return (
    <>
      <header
        className={classNames(
          'fixed top-0 z-50 w-full bg-zinc-950/95 backdrop-blur transition-all duration-300',
          isScrolled ? 'border-b border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.28)]' : 'border-b border-transparent shadow-none',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center">
            <Link href="/" onClick={closeAllMenus} className="inline-flex items-center gap-2.5 rounded-lg px-1 py-1">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#fb923c] text-sm font-bold text-[#0b1220]">
                MF
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-extrabold tracking-wide text-white">MUJ</span>
                <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#fb923c]">FREELANCE</span>
              </span>
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {discoverNavItems.map((item) => {
              const active = isLinkActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    'group relative px-1 py-2 text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-zinc-300 hover:text-white',
                  )}
                >
                  {item.label}
                  <span
                    className={classNames(
                      'absolute -bottom-[1px] left-0 h-0.5 rounded-full bg-[#fb923c] transition-all duration-200',
                      active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100',
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            {renderMessageIcon()}
            {isAuthenticated && user ? <NotificationBell /> : null}

            {isAuthenticated && user ? (
              <div ref={profileRef} className="relative hidden md:flex">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((previous) => !previous)}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-1.5 py-1 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
                    aria-expanded={isProfileOpen}
                    aria-label="Open profile menu"
                  >
                    <Avatar
                      src={user.avatar?.url}
                      alt={user.fullName}
                      fallback={userInitial}
                      size="sm"
                      className="bg-[#fb923c] text-[#0b1220]"
                    />
                    <ChevronDown
                      className={classNames(
                        'h-4 w-4 transition-transform duration-200',
                        isProfileOpen ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  </button>

                  <div
                    className={classNames(
                      'absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-2xl transition-all duration-200',
                      isProfileOpen
                        ? 'pointer-events-auto translate-y-0 opacity-100'
                        : 'pointer-events-none -translate-y-1 opacity-0',
                    )}
                  >
                    <div className="rounded-lg px-3 py-2">
                      <p className="text-sm font-semibold text-zinc-900">{user.fullName}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                      <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                        {roleBadgeLabel}
                      </span>
                    </div>

                    <div className="my-2 h-px bg-zinc-200" />

                    <div className="space-y-1">
                      {profileMenuItems
                        .filter((item) => item.show)
                        .map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900"
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          );
                        })}
                    </div>

                    <div className="my-2 h-px bg-zinc-200" />

                    <button
                      type="button"
                      onClick={() => {
                        void handleLogout();
                      }}
                      disabled={isLoading}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/login"
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#fb923c] px-3 py-2 text-sm font-semibold text-[#0b1220] transition hover:bg-[#f97316]"
                >
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileOpen((previous) => !previous)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-200 transition hover:bg-zinc-800"
                aria-expanded={isMobileOpen}
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-16" />

      <div
        onClick={() => setIsMobileOpen(false)}
        className={classNames(
          'fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 md:hidden',
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      <aside
        className={classNames(
          'fixed left-0 top-0 z-50 h-screen w-[280px] bg-zinc-900 text-zinc-100 transition-transform duration-300 md:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
            <Link href="/" onClick={closeAllMenus} className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#fb923c] text-xs font-bold text-[#0b1220]">
                MF
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-extrabold text-white">MUJ</span>
                <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#fb923c]">FREELANCE</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Close mobile menu"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isAuthenticated && user ? (
              <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar?.url}
                    alt={user.fullName}
                    fallback={userInitial}
                    size="md"
                    className="bg-[#fb923c] text-[#0b1220]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Discover</p>
                <div className="space-y-1">
                  {discoverNavItems.map((item) => {
                    const active = isLinkActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeAllMenus}
                        className={classNames(
                          'block rounded-lg px-3 py-2 text-sm transition',
                          active
                            ? 'bg-zinc-800 font-medium text-white'
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </section>

              {isAuthenticated && user ? (
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Account</p>
                  <div className="space-y-1">
                    <Link
                      href={`/profile/${user.id}`}
                      onClick={closeAllMenus}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href={dashboardHref}
                      onClick={closeAllMenus}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/messages"
                      onClick={closeAllMenus}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      <span className="inline-flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </span>
                      {unreadCount > 0 ? (
                        <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      ) : null}
                    </Link>

                    {hasClientRole ? (
                      <Link
                        href="/dashboard/client/orders"
                        onClick={closeAllMenus}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        My Orders
                      </Link>
                    ) : null}

                    {hasFreelancerRole ? (
                      <Link
                        href="/dashboard/freelancer/orders"
                        onClick={closeAllMenus}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                        Work Orders
                      </Link>
                    ) : null}

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={closeAllMenus}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    ) : null}
                  </div>
                </section>
              ) : (
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Account</p>
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      onClick={closeAllMenus}
                      className="block rounded-lg border border-zinc-700 px-3 py-2 text-center text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeAllMenus}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#fb923c] px-3 py-2 text-sm font-semibold text-[#0b1220] transition hover:bg-[#f97316]"
                    >
                      Get Started
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </section>
              )}
            </div>
          </div>

          {isAuthenticated && user ? (
            <div className="mt-auto border-t border-zinc-800 p-4">
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
