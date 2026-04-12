import { CheckCircle2, Package, PlayCircle, ShoppingBag, XCircle } from 'lucide-react';

import { formatDateTime } from '@/utils/formatDate';

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

type TimelineState = 'past' | 'current' | 'future';

interface TimelineEvent {
  id: string;
  label: string;
  timestamp?: string;
  state: TimelineState;
  icon: React.ComponentType<{ className?: string }>;
}

const eventClassMap: Record<TimelineState, string> = {
  past: 'border-zinc-300 bg-zinc-100 text-zinc-700',
  current: 'border-black bg-black text-white',
  future: 'border-zinc-200 border-dashed bg-white text-zinc-400',
};

const getCurrentStep = (status: string): number => {
  if (status === 'cancelled') {
    return 4;
  }

  if (status === 'completed') {
    return 3;
  }

  if (status === 'delivered') {
    return 2;
  }

  return 1;
};

export default function OrderTimeline({
  status,
  createdAt,
  deliveredAt,
  completedAt,
  cancelledAt,
}: OrderTimelineProps) {
  const currentStep = getCurrentStep(status);

  const events: TimelineEvent[] = [
    {
      id: 'placed',
      label: 'Order Placed',
      timestamp: createdAt,
      state: 'past',
      icon: ShoppingBag,
    },
    {
      id: 'started',
      label: 'Work Started',
      timestamp: createdAt,
      state: currentStep === 1 ? 'current' : 'past',
      icon: PlayCircle,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      timestamp: deliveredAt,
      state: currentStep > 2 ? 'past' : currentStep === 2 ? 'current' : 'future',
      icon: Package,
    },
    {
      id: 'completed',
      label: 'Completed',
      timestamp: completedAt,
      state: currentStep === 3 ? 'current' : currentStep > 3 ? 'past' : 'future',
      icon: CheckCircle2,
    },
  ];

  if (status === 'cancelled') {
    events.push({
      id: 'cancelled',
      label: 'Cancelled',
      timestamp: cancelledAt,
      state: 'current',
      icon: XCircle,
    });
  }

  return (
    <div className="space-y-3">
      {events
        .filter((event) => event.id !== 'delivered' || ['delivered', 'completed', 'cancelled', 'disputed'].includes(status))
        .map((event, index, arr) => {
          const Icon = event.icon;

          return (
            <div key={event.id} className="relative flex gap-3 pb-4">
              {index < arr.length - 1 ? <span className="absolute left-[14px] top-8 h-full w-px bg-zinc-200" /> : null}
              <span className={`z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border ${eventClassMap[event.state]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{event.label}</p>
                <p className="text-xs text-zinc-500">{event.timestamp ? formatDateTime(event.timestamp) : '--'}</p>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export type { OrderTimelineProps };
