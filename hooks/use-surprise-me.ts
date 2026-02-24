import { useState } from 'react';
import { type TrendingDish } from '@/lib/api/menu';

/** Pick a random element from an array, or null if empty. */
export function pickRandom<T>(arr: readonly T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * "Surprise Me" hook — picks a random dish from an already-filtered list.
 * The TrendingDish type embeds restaurant.name + restaurant.slug,
 * so one random pick gives us both a dish and its restaurant.
 *
 * Does NOT fetch data — relies on the parent passing dietary-filtered dishes.
 */
export function useSurpriseMe(dishes: readonly TrendingDish[]) {
  const [surprise, setSurprise] = useState<TrendingDish | null>(null);

  function trigger() {
    setSurprise(pickRandom(dishes));
  }

  function reset() {
    setSurprise(null);
  }

  const hasResults = dishes.length > 0;

  return { surprise, trigger, reset, hasResults };
}
