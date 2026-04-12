import {
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  type FormatOptions,
} from 'date-fns';

import type { ISODateString } from '../types/api.types';

const FALLBACK_DATE_VALUE = '--';

const toDate = (value: Date | ISODateString): Date =>
  value instanceof Date ? value : parseISO(value);

export const isValidDateInput = (value: Date | ISODateString): boolean =>
  isValid(toDate(value));

export const formatDate = (
  value: Date | ISODateString,
  pattern = 'dd MMM yyyy',
  options?: FormatOptions,
): string => {
  const date = toDate(value);

  if (!isValid(date)) {
    return FALLBACK_DATE_VALUE;
  }

  return format(date, pattern, options);
};

export const formatDateTime = (value: Date | ISODateString): string =>
  formatDate(value, 'dd MMM yyyy, hh:mm a');

export const formatRelativeTime = (value: Date | ISODateString): string => {
  const date = toDate(value);

  if (!isValid(date)) {
    return FALLBACK_DATE_VALUE;
  }

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
  });
};
