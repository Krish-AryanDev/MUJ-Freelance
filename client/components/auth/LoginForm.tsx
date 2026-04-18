'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { ZodError } from 'zod';

import { classNames } from '../../utils/helpers';
import { getZodFieldErrors, loginSchema } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';

type LoginField = 'email' | 'password' | 'root';

interface LoginFormProps {
  className?: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function LoginForm({ className, redirectTo, onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = useMemo(() => isLoading || isSubmitting, [isLoading, isSubmitting]);
  const resolvedError = fieldErrors.root || error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setError(null);

    try {
      const payload = loginSchema.parse({ email, password });
      setIsSubmitting(true);
      await login(payload);
      onSuccess?.();

      const nextPath = redirectTo || searchParams.get('next') || '/';
      router.push(nextPath);
    } catch (submitError) {
      if (submitError instanceof ZodError) {
        setFieldErrors(getZodFieldErrors(submitError.issues) as Partial<Record<LoginField, string>>);
      } else {
        const message = submitError instanceof Error ? submitError.message : 'Login failed';
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
          Welcome
          <br />
          back
        </h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="sr-only">
          MUJ email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-full border border-[#dce5d8] bg-white px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:border-[#9dce69] focus:outline-none"
          placeholder="Email address"
          disabled={disabled}
        />
        {fieldErrors.email ? <p className="text-sm text-red-500">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="sr-only">
          Password
        </label>
        <div className="flex items-center rounded-full border border-[#dce5d8] bg-white pr-4">
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-full bg-transparent px-4 py-3 text-sm text-[#2f3e46] placeholder:text-[#a8b6a7] focus:outline-none"
            placeholder="Password"
            disabled={disabled}
          />
          <Eye className="h-4 w-4 text-[#a8b6a7]" />
        </div>
        {fieldErrors.password ? <p className="text-sm text-red-500">{fieldErrors.password}</p> : null}
      </div>

      {resolvedError ? <p className="text-sm text-red-500">{resolvedError}</p> : null}

      <button
        type="submit"
        className="w-full rounded-full bg-[#94d34a] px-4 py-3 text-sm font-semibold text-[#243029] transition-colors hover:bg-[#88c83d] disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="flex items-center justify-between text-xs text-[#8d9b8c]">
        <Link href="/forgot-password" className="font-medium text-[#4f5f4b] hover:text-[#324232]">
          Forgot password?
        </Link>
        <Link href="/register" className="font-semibold text-[#4a8b2b] hover:text-[#3f7725]">
          Create account
        </Link>
      </div>
    </form>
  );
}
