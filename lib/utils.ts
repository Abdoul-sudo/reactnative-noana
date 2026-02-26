/** Formats an amount in centimes to a display string with DA suffix (e.g., 2050 → "20.50 DA") */
export function formatPrice(amount: number): string {
  return `${Number((amount / 100).toFixed(2))} DA`;
}
