'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { ZodError } from 'zod';

import { classNames } from '../../utils/helpers';
import { forgotPasswordSchema, getZodFieldErrors } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';

type ForgotField = 'email' | 'root';

interface ForgotPasswordFormProps {
  className?: string;
}

export default function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const { sendVerificationOtp, isLoading, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ForgotField, string>>>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = useMemo(() => isLoading || isSubmitting, [isLoading, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setInfoMessage(null);
    setError(null);

    try {
      const payload = forgotPasswordSchema.parse({ email });
      setIsSubmitting(true);

      await sendVerificationOtp(payload);
      setInfoMessage('If this email exists, a verification OTP has been sent.');
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        setFieldErrors(getZodFieldErrors(submitError.issues) as Partial<Record<ForgotField, string>>);
      } else {
        const message = submitError instanceof Error ? submitError.message : 'Unable to process request';
        setFieldErrors({ root: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classNames('space-y-4 rounded-lg border p-6', className)}>
      <h2 className="text-2xl font-semibold">Forgot password</h2>
      <p className="text-sm opacity-80">
        Enter your MUJ email and we will send a one-time verification code.
      </p>

      <div className="space-y-1">
        <label htmlFor="forgot-email" className="text-sm font-medium">
          MUJ email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="name@muj.manipal.edu"
          disabled={disabled}
        />
        {fieldErrors.email ? <p className="text-sm text-red-500">{fieldErrors.email}</p> : null}
      </div>

      {fieldErrors.root ? <p className="text-sm text-red-500">{fieldErrors.root}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {infoMessage ? <p className="text-sm text-green-600">{infoMessage}</p> : null}

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Sending...' : 'Send OTP'}
      </button>

      <p className="text-center text-sm">
        Remembered your password?{' '}
        <Link href="/login" className="underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
