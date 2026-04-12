'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
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
    <form onSubmit={handleSubmit} className={classNames('space-y-4 rounded-lg border p-6', className)}>
      <h2 className="text-2xl font-semibold">Login</h2>

      <div className="space-y-1">
        <label htmlFor="login-email" className="text-sm font-medium">
          MUJ email
        </label>
        <input
          id="login-email"
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

      <div className="space-y-1">
        <label htmlFor="login-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border px-3 py-2"
          placeholder="********"
          disabled={disabled}
        />
        {fieldErrors.password ? <p className="text-sm text-red-500">{fieldErrors.password}</p> : null}
      </div>

      {resolvedError ? <p className="text-sm text-red-500">{resolvedError}</p> : null}

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
        <Link href="/register" className="underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
