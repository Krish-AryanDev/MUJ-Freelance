"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/messages')) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} MUJ Freelance. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/search" className="hover:text-zinc-100">
            Find Work
          </Link>
          <Link href="/projects" className="hover:text-zinc-100">
            Explore Projects
          </Link>
        </div>
      </div>
    </footer>
  );
}
