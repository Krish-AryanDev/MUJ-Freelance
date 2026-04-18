import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { classNames } from '../../utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, name, className, ...props },
  ref,
) {
  const fallbackId = useId();
  const resolvedId = id || `input-${fallbackId.replace(/:/g, '')}`;
  const resolvedName = name || resolvedId;

  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={resolvedId} className="text-sm font-medium text-zinc-900">
          {label}
        </label>
      ) : null}

      <input
        ref={ref}
        id={resolvedId}
        name={resolvedName}
        className={classNames(
          'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition placeholder:text-zinc-400 focus:ring-2',
          error ? 'border-red-500 focus:ring-red-300' : '',
          className,
        )}
        {...props}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
});

export default Input;
