import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import { classNames } from '../../utils/helpers';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, name, className, rows = 4, ...props },
  ref,
) {
  const fallbackId = useId();
  const resolvedId = id || `textarea-${fallbackId.replace(/:/g, '')}`;
  const resolvedName = name || resolvedId;

  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={resolvedId} className="text-sm font-medium text-zinc-900">
          {label}
        </label>
      ) : null}

      <textarea
        ref={ref}
        id={resolvedId}
        name={resolvedName}
        rows={rows}
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

export default Textarea;
