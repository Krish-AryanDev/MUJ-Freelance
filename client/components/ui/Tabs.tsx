'use client';

import { useMemo, useState } from 'react';

import { classNames } from '../../utils/helpers';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  items,
  defaultTabId,
  activeTabId,
  onTabChange,
  className,
}: TabsProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(defaultTabId || items[0]?.id);

  const currentTabId = activeTabId ?? internalActiveTabId;
  const currentTab = useMemo(() => items.find((item) => item.id === currentTabId), [currentTabId, items]);

  const changeTab = (tabId: string) => {
    setInternalActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={classNames('space-y-4', className)}>
      <div className="flex flex-wrap gap-2 rounded-lg bg-zinc-100 p-1">
        {items.map((item) => {
          const isActive = item.id === currentTabId;

          return (
            <button
              key={item.id}
              type="button"
              className={classNames(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
              )}
              onClick={() => changeTab(item.id)}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div>{currentTab?.content}</div>
    </div>
  );
}
