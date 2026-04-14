import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { authStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 20_000;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshTokenResponse {
  success: boolean;
  message: string;
}

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

const resolvePendingRequests = (): void => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

const rejectPendingRequests = (): void => {
  pendingRequests = [];
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

apiClient.interceptors.request.use(
  (config) => config,
  (error: unknown) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const statusCode = error.response?.status;

    if (!originalRequest || statusCode !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';
    const isRefreshRequest = requestUrl.includes('/auth/refresh-token');
    const isSessionProbeRequest = requestUrl.includes('/auth/me');
    const authState = authStore.getState();
    const hasKnownSession = Boolean(authState.isAuthenticated && authState.user?.id);

    if (isRefreshRequest || isSessionProbeRequest || !hasKnownSession) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        pendingRequests.push(() => {
          apiClient(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      await refreshClient.post<RefreshTokenResponse>('/auth/refresh-token');
      isRefreshing = false;
      resolvePendingRequests();
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      rejectPendingRequests();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }

      return Promise.reject(refreshError);
    }
  },
);

export const extractResponseData = <TData>(response: AxiosResponse<TData>): TData => response.data;
