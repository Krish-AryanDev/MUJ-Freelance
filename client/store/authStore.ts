import type { LoginRequest, User, VerifyEmailOtpRequest } from '../types/user.types';
import type { RegisterPayload, SendVerificationOtpPayload, SendVerificationOtpResponse } from '../services/auth.service';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean;
  error: string | null;
}

type AuthListener = () => void;

const listeners = new Set<AuthListener>();

let authState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
  error: null,
};

const emitChange = (): void => {
  listeners.forEach((listener) => listener());
};

const setState = (updater: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)): void => {
  const partial = typeof updater === 'function' ? updater(authState) : updater;
  authState = { ...authState, ...partial };
  emitChange();
};

const subscribe = (listener: AuthListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getState = (): AuthState => authState;

const setUser = (user: User | null, accessToken?: string | null): void => {
  setState({
    user,
    accessToken: accessToken ?? authState.accessToken,
    isAuthenticated: Boolean(user),
    initialized: true,
    error: null,
  });
};

const clearAuth = (): void => {
  setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    initialized: true,
    error: null,
  });
};

const setLoading = (isLoading: boolean): void => {
  setState({ isLoading });
};

const setError = (error: string | null): void => {
  setState({ error });
};

const initializeAuth = async (): Promise<void> => {
  if (authState.initialized && authState.user) {
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const user = await authService.getCurrentUser();
    setUser(user, null);
  } catch (_error) {
    clearAuth();
  } finally {
    setState({ isLoading: false, initialized: true });
  }
};

const login = async (payload: LoginRequest): Promise<User> => {
  setLoading(true);
  setError(null);

  try {
    const session = await authService.login(payload);
    setUser(session.user, session.accessToken || null);
    return session.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

const register = async (payload: RegisterPayload): Promise<User> => {
  setLoading(true);
  setError(null);

  try {
    const session = await authService.register(payload);
    setUser(session.user, session.accessToken || null);
    return session.user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

const logout = async (): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    await authService.logout();
  } finally {
    clearAuth();
    setLoading(false);
  }
};

const refreshSession = async (): Promise<User | null> => {
  setLoading(true);
  setError(null);

  try {
    const session = await authService.refreshSession();
    setUser(session.user, session.accessToken || null);
    return session.user;
  } catch (_error) {
    clearAuth();
    return null;
  } finally {
    setLoading(false);
  }
};

const becomeFreelancer = async (): Promise<User> => {
  setLoading(true);
  setError(null);

  try {
    const user = await authService.becomeFreelancer();
    setUser(user, authState.accessToken);
    return user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user role';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

const sendVerificationOtp = async (
  payload: SendVerificationOtpPayload,
): Promise<SendVerificationOtpResponse> => {
  setLoading(true);
  setError(null);

  try {
    return await authService.sendVerificationOtp(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send verification OTP';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

const verifyEmailOtp = async (payload: VerifyEmailOtpRequest): Promise<User> => {
  setLoading(true);
  setError(null);

  try {
    const user = await authService.verifyEmailOtp(payload);
    setUser(user, authState.accessToken);
    return user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify OTP';
    setError(message);
    throw error;
  } finally {
    setLoading(false);
  }
};

export const authStore = {
  subscribe,
  getState,
  setUser,
  clearAuth,
  setLoading,
  setError,
  initializeAuth,
  login,
  register,
  logout,
  refreshSession,
  becomeFreelancer,
  sendVerificationOtp,
  verifyEmailOtp,
};

export type { AuthState };
