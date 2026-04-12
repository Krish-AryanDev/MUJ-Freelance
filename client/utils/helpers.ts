import { AxiosError } from 'axios';

import type { ApiListQuery } from '../types/api.types';

export type ClassNameValue = string | false | null | undefined;

export const classNames = (...values: ClassNameValue[]): string =>
  values.filter((value): value is string => Boolean(value)).join(' ');

export const buildQueryString = (query: ApiListQuery): string => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const truncateText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
};

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong'): string => {
  if (error instanceof AxiosError) {
    const responseMessage =
      typeof error.response?.data === 'object' &&
      error.response?.data !== null &&
      'message' in error.response.data &&
      typeof (error.response.data as { message?: unknown }).message === 'string'
        ? ((error.response.data as { message: string }).message ?? fallback)
        : undefined;

    return responseMessage ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
