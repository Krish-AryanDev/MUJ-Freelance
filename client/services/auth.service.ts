import { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';

import { apiClient } from '../lib/axios';
import { getErrorMessage } from '../utils/helpers';
import type { ApiResponse } from '../types/api.types';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UserRole,
  VerifyEmailOtpRequest,
} from '../types/user.types';

interface BackendUser extends Omit<User, 'id'> {
  id?: string;
  _id?: string;
  role?: UserRole;
}

interface AuthPayload {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
}

interface RegisterPayload extends Omit<RegisterRequest, 'confirmPassword'> {
  confirmPassword?: string;
}

interface SendVerificationOtpPayload {
  email: string;
}

interface SendVerificationOtpResponse {
  email: string;
  expiresAt: string;
}

interface VerifyEmailOtpResponse {
  user: BackendUser;
}

interface AuthServiceError extends Error {
  statusCode?: number;
  isNetworkError?: boolean;
}

const toAuthServiceError = (error: unknown, fallback: string): AuthServiceError => {
  const normalizedError = new Error(getErrorMessage(error, fallback)) as AuthServiceError;

  if (error instanceof AxiosError) {
    normalizedError.statusCode = error.response?.status;
    normalizedError.isNetworkError = !error.response;
  }

  return normalizedError;
};

const normalizeUser = (user: BackendUser): User => {
  const normalizedId = user.id ?? user._id;

  if (!normalizedId) {
    throw new Error('User id is missing in API response');
  }

  return {
    ...user,
    id: normalizedId,
    roles:
      Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : user.role
          ? [user.role]
          : [],
    avatar: user.avatar ?? { url: '' },
  };
};

const unwrapResponse = <TData>(response: AxiosResponse<ApiResponse<TData>>): TData => {
  const payload = response.data;

  if (!payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
};

const mapAuthPayload = (payload: AuthPayload): LoginResponse => ({
  user: normalizeUser(payload.user),
  accessTokenIssued: Boolean(payload.accessToken),
  accessToken: payload.accessToken || '',
});

const register = async (payload: RegisterPayload): Promise<LoginResponse> => {
  try {
    if (payload.confirmPassword && payload.password !== payload.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const response = await apiClient.post<ApiResponse<AuthPayload>>('/auth/register', {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });

    return mapAuthPayload(unwrapResponse(response));
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to register user');
  }
};

const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthPayload>>('/auth/login', payload);
    return mapAuthPayload(unwrapResponse(response));
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to login');
  }
};

const logout = async (): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<null>>('/auth/logout');
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to logout');
  }
};

const refreshSession = async (): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<AuthPayload>>('/auth/refresh-token');
    return mapAuthPayload(unwrapResponse(response));
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to refresh session');
  }
};

const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<ApiResponse<{ user: BackendUser }>>('/auth/me');
    const payload = unwrapResponse(response);
    return normalizeUser(payload.user);
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to fetch current user');
  }
};

const becomeFreelancer = async (): Promise<User> => {
  try {
    const response = await apiClient.patch<ApiResponse<{ user: BackendUser }>>('/auth/become-freelancer');
    const payload = unwrapResponse(response);
    return normalizeUser(payload.user);
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to enable freelancer role');
  }
};

const sendVerificationOtp = async (
  payload: SendVerificationOtpPayload,
): Promise<SendVerificationOtpResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<SendVerificationOtpResponse>>(
      '/auth/send-verification-otp',
      payload,
    );

    return unwrapResponse(response);
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to send verification OTP');
  }
};

const verifyEmailOtp = async (payload: VerifyEmailOtpRequest): Promise<User> => {
  try {
    const response = await apiClient.post<ApiResponse<VerifyEmailOtpResponse>>(
      '/auth/verify-email-otp',
      payload,
    );

    const data = unwrapResponse(response);
    return normalizeUser(data.user);
  } catch (error) {
    throw toAuthServiceError(error, 'Failed to verify email OTP');
  }
};

const hasRole = (user: User | null, role: UserRole): boolean => {
  return Boolean(user?.roles?.includes(role));
};

export const authService = {
  register,
  login,
  logout,
  refreshSession,
  getCurrentUser,
  becomeFreelancer,
  sendVerificationOtp,
  verifyEmailOtp,
  hasRole,
};

export type { AuthServiceError, RegisterPayload, SendVerificationOtpPayload, SendVerificationOtpResponse };
