/** Formats an amount in centimes to a display string with DA suffix (e.g., 2050 → "20.50 DA") */
export function formatPrice(amount: number): string {
  return `${Number((amount / 100).toFixed(2))} DA`;
}

/** Formats an ISO date string as a relative time string (e.g., "5 min ago", "2 hrs ago") */
export function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
