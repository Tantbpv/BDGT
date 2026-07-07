export function formatCurrency(
  amount: number | string,
  currency = 'USD',
  locale = 'en-US',
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function sumAmounts(amounts: string[]): string {
  const total = amounts.reduce((acc, a) => acc + parseFloat(a), 0);
  return total.toFixed(2);
}
