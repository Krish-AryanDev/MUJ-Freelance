'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { classNames } from '../../utils/helpers';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  title?: string;
  items: ReadonlyArray<SidebarItem>;
  className?: string;
}

export default function Sidebar({ title = 'Navigation', items, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={classNames('w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm', className)}>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</p>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
