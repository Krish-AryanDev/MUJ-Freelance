'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { classNames } from '../../utils/helpers';

interface DropdownItem {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
}

export default function Dropdown({ trigger, items, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  return (
    <div ref={containerRef} className={classNames('relative inline-block', className)}>
      <button type="button" onClick={() => setIsOpen((previous) => !previous)}>
        {trigger}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
          {items.map((item) => {
            const commonClassName = classNames(
              'block w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100',
              item.disabled ? 'cursor-not-allowed opacity-60 hover:bg-transparent' : '',
            );

            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={commonClassName}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                className={commonClassName}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
