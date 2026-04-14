import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { authStore } from '../store/authStore';
import { ROLES } from '../constants/roles';

const getSnapshot = () => authStore.getState();

const SERVER_SNAPSHOT = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  initialized: false,
  error: null,
};

const getServerSnapshot = () => SERVER_SNAPSHOT;

export const useAuth = () => {
  const state = useSyncExternalStore(authStore.subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!state.initialized) {
      void authStore.initializeAuth();
    }
  }, [state.initialized]);

  useEffect(() => {
    const handleSessionExpired = () => {
      authStore.clearAuth();
      authStore.setError('Session expired. Please login again.');
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      login: authStore.login,
      register: authStore.register,
      logout: authStore.logout,
      refreshSession: authStore.refreshSession,
      sendVerificationOtp: authStore.sendVerificationOtp,
      verifyEmailOtp: authStore.verifyEmailOtp,
      becomeFreelancer: authStore.becomeFreelancer,
      clearAuth: authStore.clearAuth,
      setError: authStore.setError,
      hasRole: (role: 'client' | 'freelancer' | 'admin') =>
        Boolean(state.user?.roles?.includes(role)),
      isAdmin: Boolean(state.user?.roles?.includes(ROLES.ADMIN)),
      isFreelancer: Boolean(state.user?.roles?.includes(ROLES.FREELANCER)),
      isClient: Boolean(state.user?.roles?.includes(ROLES.CLIENT)),
    }),
    [state],
  );
};

export default useAuth;
