const FALLBACK_PRICE_VALUE = '₹0';

export interface PriceFormatOptions {
  currency?: 'INR';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const createCurrencyFormatter = (
  currency: 'INR',
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): Intl.NumberFormat =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  });

export const formatPrice = (
  amount: number,
  options: PriceFormatOptions = {},
): string => {
  if (!Number.isFinite(amount)) {
    return FALLBACK_PRICE_VALUE;
  }

  const {
    currency = 'INR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return createCurrencyFormatter(currency, minimumFractionDigits, maximumFractionDigits).format(amount);
};

export const formatCompactPrice = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return FALLBACK_PRICE_VALUE;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};
