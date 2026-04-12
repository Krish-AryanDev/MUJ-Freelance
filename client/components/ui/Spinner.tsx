import { classNames } from '../../utils/helpers';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={classNames(
        'inline-block animate-spin rounded-full border-2 border-current border-r-transparent',
        sizeClasses[size],
        className,
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
