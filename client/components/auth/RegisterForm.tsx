'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { ZodError } from 'zod';

import { getZodFieldErrors, registerSchema } from '../../utils/validators';
import { classNames } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

type RegisterFormField =
  | 'name'
  | 'email'
  | 'password'
  | 'enrollmentNo'
  | 'branch'
  | 'semester'
  | 'role'
  | 'confirmPassword'
  | 'root';

interface RegisterFormProps {
  className?: string;
  redirectTo?: string;
  onSuccess?: () => void;
}

const defaultFieldState = {
  name: '',
  email: '',
  password: '',
  enrollmentNo: '',
  branch: '',
  semester: 1,
  role: 'client' as 'client' | 'freelancer',
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
    <form onSubmit={handleSubmit} className={classNames('space-y-4 rounded-lg border p-6', className)}>
      <h2 className="text-2xl font-semibold">Create your account</h2>

      <div className="space-y-1">
        <label htmlFor="register-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          className="w-full rounded-md border px-3 py-2"
          placeholder="Krish Aryan"
          disabled={disabled}
        />
        {fieldErrors.name ? <p className="text-sm text-red-500">{fieldErrors.name}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-enrollment-no" className="text-sm font-medium">
          Enrollment number
        </label>
        <input
          id="register-enrollment-no"
          name="enrollmentNo"
          type="text"
          value={form.enrollmentNo}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, enrollmentNo: event.target.value.toUpperCase() }))
          }
          className="w-full rounded-md border px-3 py-2"
          placeholder="229301234"
          disabled={disabled}
        />
        {fieldErrors.enrollmentNo ? (
          <p className="text-sm text-red-500">{fieldErrors.enrollmentNo}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-branch" className="text-sm font-medium">
          Branch
        </label>
        <select
          id="register-branch"
          name="branch"
          value={form.branch}
          onChange={(event) => setForm((previous) => ({ ...previous, branch: event.target.value }))}
          className="w-full rounded-md border px-3 py-2"
          disabled={disabled}
        >
          <option value="">Select branch</option>
          <option value="CSE">CSE</option>
          <option value="CCE">CCE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
          <option value="ME">ME</option>
          <option value="Civil">Civil</option>
          <option value="Biotech">Biotech</option>
          <option value="Other">Other</option>
        </select>
        {fieldErrors.branch ? <p className="text-sm text-red-500">{fieldErrors.branch}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-semester" className="text-sm font-medium">
          Semester
        </label>
        <input
          id="register-semester"
          name="semester"
          type="number"
          min={1}
          max={12}
          value={form.semester}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              semester: Number.parseInt(event.target.value || '1', 10),
            }))
          }
          className="w-full rounded-md border px-3 py-2"
          disabled={disabled}
        />
        {fieldErrors.semester ? <p className="text-sm text-red-500">{fieldErrors.semester}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-email" className="text-sm font-medium">
          MUJ email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          className="w-full rounded-md border px-3 py-2"
          placeholder="name@muj.manipal.edu"
          disabled={disabled}
        />
        {fieldErrors.email ? <p className="text-sm text-red-500">{fieldErrors.email}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
          className="w-full rounded-md border px-3 py-2"
          placeholder="********"
          disabled={disabled}
        />
        {fieldErrors.password ? <p className="text-sm text-red-500">{fieldErrors.password}</p> : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-confirm-password" className="text-sm font-medium">
          Confirm password
        </label>
        <input
          id="register-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
          }
          className="w-full rounded-md border px-3 py-2"
          placeholder="********"
          disabled={disabled}
        />
        {fieldErrors.confirmPassword ? (
          <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="register-role" className="text-sm font-medium">
          I want to join as
        </label>
        <select
          id="register-role"
          name="role"
          value={form.role}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, role: event.target.value as 'client' | 'freelancer' }))
          }
          className="w-full rounded-md border px-3 py-2"
          disabled={disabled}
        >
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
        </select>
        {fieldErrors.role ? <p className="text-sm text-red-500">{fieldErrors.role}</p> : null}
      </div>

      {resolvedError ? <p className="text-sm text-red-500">{resolvedError}</p> : null}

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={disabled}
      >
        {disabled ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Login
        </Link>
      </p>
    </form>
  );
}
