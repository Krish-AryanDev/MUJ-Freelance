import { z } from 'zod';

const MUJ_EMAIL_DOMAIN = '@muj.manipal.edu';

export const PASSWORD_MIN_LENGTH = 8;

const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /\d/;
const hasSpecialCharacter = /[^A-Za-z0-9]/;

export const isMujEmail = (email: string): boolean =>
  email.trim().toLowerCase().endsWith(MUJ_EMAIL_DOMAIN);

export const mujEmailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .refine(isMujEmail, {
    message: 'Only @muj.manipal.edu email addresses are allowed',
  });

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  .refine((value) => hasUppercase.test(value), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((value) => hasLowercase.test(value), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((value) => hasNumber.test(value), {
    message: 'Password must contain at least one number',
  })
  .refine((value) => hasSpecialCharacter.test(value), {
    message: 'Password must contain at least one special character',
  });

export const otpSchema = z
  .string()
  .trim()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only numbers');

export const loginSchema = z.object({
  email: mujEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
    email: mujEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: mujEmailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const getZodFieldErrors = (issues: z.ZodIssue[]): Record<string, string> =>
  issues.reduce<Record<string, string>>((accumulator, issue) => {
    const key = issue.path.join('.') || 'root';

    if (!accumulator[key]) {
      accumulator[key] = issue.message;
    }

    return accumulator;
  }, {});
