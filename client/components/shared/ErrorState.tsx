import { classNames } from '../../utils/helpers';

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this data. Please try again.',
  className,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      className={classNames(
        'flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center',
        className,
      )}
      role="alert"
    >
      <div className="mb-3 text-3xl" aria-hidden="true">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-red-700">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-red-600">{message}</p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
