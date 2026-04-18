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
      await sendVerificationOtp({ email: resolvedEmail });
      setInfoMessage('A new OTP has been sent to your email.');
    } catch (resendError) {
      setFieldError(resendError instanceof Error ? resendError.message : 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={classNames(
        'w-full max-w-[430px] space-y-5 rounded-[28px] border border-[#e6ece0] bg-[#f9fbf8] px-7 py-8 shadow-[0_16px_38px_rgba(51,76,51,0.15)] sm:px-9',
        className,
      )}
    >
      <div className="text-center">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#28392f]">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#94d34a]" />
          muj freelance
        </p>
        <h2 className="mt-4 text-[46px] font-black leading-[0.95] tracking-[-0.03em] text-[#2b3130]">
          Verify
          <br />
          email
        </h2>
        <p className="mt-3 text-xs text-[#8d9b8c]">
          Enter the 6-digit OTP sent to <span className="font-semibold text-[#4f5f4b]">{resolvedEmail || 'your email'}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="otp-code" className="sr-only">
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
          className="w-full rounded-full border border-[#dce5d8] bg-white px-4 py-3 text-sm tracking-[0.35em] text-[#2f3e46] placeholder:text-[#a8b6a7] focus:border-[#9dce69] focus:outline-none"
          placeholder="000000"
          disabled={disabled}
        />
      </div>

      {fieldError ? <p className="text-sm text-red-500">{fieldError}</p> : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {infoMessage ? <p className="text-sm text-green-600">{infoMessage}</p> : null}

      <button
        type="submit"
        className="w-full rounded-full bg-[#94d34a] px-4 py-3 text-sm font-semibold text-[#243029] transition-colors hover:bg-[#88c83d] disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Verifying...' : 'Verify OTP'}
      </button>

      <div className="flex items-center justify-between text-xs text-[#8d9b8c]">
        <button
          type="button"
          onClick={resendOtp}
          className="font-medium text-[#4f5f4b] underline disabled:opacity-50"
          disabled={isResending || disabled}
        >
          {isResending ? 'Resending...' : 'Resend OTP'}
        </button>

        <Link href="/register" className="font-semibold text-[#4a8b2b] hover:text-[#3f7725]">
          Back to register
        </Link>
      </div>
    </form>
  );
}
