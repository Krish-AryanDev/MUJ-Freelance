'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { classNames } from '../../utils/helpers';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Tooltip({ content, children, className }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={classNames('relative inline-flex', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      {isOpen ? (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white">
          {content}
        </span>
      ) : null}
    </span>
  );
}
