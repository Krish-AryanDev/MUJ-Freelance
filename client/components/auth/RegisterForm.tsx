'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { ZodError } from 'zod';

import { getZodFieldErrors, registerSchema } from '../../utils/validators';
import { classNames } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

type RegisterFormField = 'name' | 'email' | 'password' | 'confirmPassword' | 'root';

interface RegisterFormProps {
  className?: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

const defaultFieldState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterForm({ className, redirectTo, onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const { register, sendVerificationOtp, isLoading, error, setError } = useAuth();

  const [form, setForm] = useState(defaultFieldState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterFormField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = useMemo(() => isLoading || isSubmitting, [isLoading, isSubmitting]);
  const resolvedError = fieldErrors.root || error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setError(null);

    try {
      const payload = registerSchema.parse(form);

      setIsSubmitting(true);
      await register(payload);

      try {
        await sendVerificationOtp({ email: payload.email });
      } catch (_otpError) {
      }

      onSuccess?.();

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      }
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        const mappedErrors = getZodFieldErrors(submitError.issues) as Partial<
          Record<RegisterFormField, string>
        >;

        setFieldErrors(mappedErrors);
      } else {
        const message = submitError instanceof Error ? submitError.message : 'Registration failed';
        setFieldErrors({ root: message });
      }
    } finally {
      setIsSubmitting(false);
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
          Create
          <br />
          account
        </h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-name" className="sr-only">
          Name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          className="w-full rounded-full border border-[#dce5d8] bg-white px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:border-[#9dce69] focus:outline-none"
          placeholder="Name"
          disabled={disabled}
        />
        {fieldErrors.name ? <p className="text-sm text-red-500">{fieldErrors.name}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="sr-only">
          MUJ email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          className="w-full rounded-full border border-[#dce5d8] bg-white px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:border-[#9dce69] focus:outline-none"
          placeholder="Email address"
          disabled={disabled}
        />
        {fieldErrors.email ? <p className="text-sm text-red-500">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-password" className="sr-only">
          Password
        </label>
        <div className="flex items-center rounded-full border border-[#dce5d8] bg-white pr-4">
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
            className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:outline-none"
            placeholder="Password"
            disabled={disabled}
          />
          <Eye className="h-4 w-4 text-[#a8b6a7]" />
        </div>
        {fieldErrors.password ? <p className="text-sm text-red-500">{fieldErrors.password}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-confirm-password" className="sr-only">
          Confirm password
        </label>
        <div className="flex items-center rounded-full border border-[#dce5d8] bg-white pr-4">
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
            }
            className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:outline-none"
            placeholder="Confirm password"
            disabled={disabled}
          />
          <Eye className="h-4 w-4 text-[#a8b6a7]" />
        </div>
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      {resolvedError ? <p className="text-sm text-red-500">{resolvedError}</p> : null}

      <button
        type="submit"
        className="w-full rounded-full bg-[#94d34a] px-4 py-3 text-sm font-semibold text-[#243029] transition-colors hover:bg-[#88c83d] disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-xs text-[#8d9b8c]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#4a8b2b] hover:text-[#3f7725]">
          Log in
        </Link>
      </p>
    </form>
  );
}
