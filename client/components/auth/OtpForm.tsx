'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { ZodError } from 'zod';

import { getZodFieldErrors, otpSchema } from '../../utils/validators';
import { classNames } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

interface OtpFormProps {
  className?: string;
  email?: string;
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function OtpForm({ className, email, onSuccess, redirectTo }: OtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmailOtp, sendVerificationOtp, isLoading, error, setError } = useAuth();

  const [otp, setOtp] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const resolvedEmail = useMemo(() => email || searchParams.get('email') || '', [email, searchParams]);
  const disabled = useMemo(() => isLoading || isSubmitting, [isLoading, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);
    setInfoMessage(null);
    setError(null);

    if (!resolvedEmail) {
      setFieldError('Email is missing. Please register/login again to continue.');
      return;
    }

    try {
      const parsedOtp = otpSchema.parse(otp);

      setIsSubmitting(true);
      await verifyEmailOtp({ email: resolvedEmail, otp: parsedOtp });
      onSuccess?.();

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/login');
      }
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        const mapped = getZodFieldErrors(submitError.issues);
        setFieldError(mapped.root || mapped.otp || 'Invalid OTP');
      } else {
        setFieldError(submitError instanceof Error ? submitError.message : 'OTP verification failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    if (!resolvedEmail) {
      setFieldError('Email is missing. Please go back and submit your email again.');
      return;
    }

    setFieldError(null);
    setError(null);
    setIsResending(true);

    try {
      const data = await sendVerificationOtp({ email: resolvedEmail });
      setInfoMessage(
        data.devOtp
          ? `A new OTP has been sent. (Dev OTP: ${data.devOtp})`
          : 'A new OTP has been sent to your email.',
      );
    } catch (resendError) {
      setFieldError(resendError instanceof Error ? resendError.message : 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classNames('space-y-4 rounded-lg border p-6', className)}>
      <h2 className="text-2xl font-semibold">Verify email</h2>
      <p className="text-sm opacity-80">
        Enter the 6-digit OTP sent to <span className="font-medium">{resolvedEmail || 'your email'}</span>
      </p>

      <div className="space-y-1">
        <label htmlFor="otp-code" className="text-sm font-medium">
          OTP code
        </label>
        <input
          id="otp-code"
          name="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full rounded-md border px-3 py-2 tracking-[0.35em]"
          placeholder="000000"
          disabled={disabled}
        />
      </div>

      {fieldError ? <p className="text-sm text-red-500">{fieldError}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {infoMessage ? <p className="text-sm text-green-600">{infoMessage}</p> : null}

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={resendOtp}
          className="underline disabled:opacity-50"
          disabled={isResending || disabled}
        >
          {isResending ? 'Resending...' : 'Resend OTP'}
        </button>

        <Link href="/register" className="underline">
          Back to register
        </Link>
      </div>
    </form>
  );
}
