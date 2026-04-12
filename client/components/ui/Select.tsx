import type { SelectHTMLAttributes } from 'react';

import { classNames } from '../../utils/helpers';

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
}

export default function Select({
  label,
  error,
  hint,
  id,
  className,
  options,
  children,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-zinc-900">
          {label}
        </label>
      ) : null}

      <select
        id={id}
        className={classNames(
          'w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none ring-black/20 transition focus:ring-2',
          error ? 'border-red-500 focus:ring-red-300' : '',
          className,
        )}
        {...props}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
