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
    <aside className={classNames('w-full rounded-xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]', className)}>
      <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{title}</p>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors relative overflow-hidden',
                isActive ? 'bg-[#87A878] text-white font-bold' : 'text-[#1a1a1a] hover:bg-zinc-50 font-medium',
              )}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#648058]" />}
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
