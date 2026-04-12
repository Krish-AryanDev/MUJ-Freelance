import { formatDate } from '@/utils/formatDate';

interface MilestoneTrackerProps {
  status: string;
  revisionsUsed: number;
  revisionsAllowed: number;
  deadline: string;
}

const statusProgressMap: Record<string, number> = {
  active: 25,
  delivered: 75,
  revision: 50,
  completed: 100,
  cancelled: 0,
  disputed: 75,
};

const steps = ['Order Placed', 'In Progress', 'Delivered', 'Completed'];

const getStepProgress = (status: string): number => {
  if (status === 'completed') {
    return 4;
  }

  if (status === 'delivered' || status === 'disputed') {
    return 3;
  }

  if (status === 'revision') {
    return 2;
  }

  if (status === 'active') {
    return 2;
  }

  return 1;
};

export default function MilestoneTracker({
  status,
  revisionsUsed,
  revisionsAllowed,
  deadline,
}: MilestoneTrackerProps) {
  const progress = statusProgressMap[status] ?? 0;
  const completedSteps = getStepProgress(status);
  const revisionPercent = revisionsAllowed > 0 ? Math.min((revisionsUsed / revisionsAllowed) * 100, 100) : 0;
  const isOverdue = new Date(deadline).getTime() < Date.now() && status !== 'completed' && status !== 'cancelled';

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-black" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-zinc-500">Order progress: {progress}%</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const isDone = stepIndex <= completedSteps;

          return (
            <div key={step} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  isDone ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-zinc-500'
                }`}
              >
                {stepIndex <= completedSteps ? '✓' : stepIndex}
              </span>
              <span className={isDone ? 'font-medium text-zinc-900' : 'text-zinc-500'}>{step}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-zinc-700">Revisions: {revisionsUsed} of {revisionsAllowed} used</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${revisionPercent}%` }} />
        </div>
      </div>

      <p className={`text-sm ${isOverdue ? 'font-semibold text-red-600' : 'text-zinc-600'}`}>
        Due: {formatDate(deadline)}
      </p>
    </div>
  );
}

export type { MilestoneTrackerProps };
