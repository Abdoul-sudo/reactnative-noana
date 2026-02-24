/** Static trending searches for MVP. Will be replaced by DB table later. */
export const TRENDING_SEARCHES = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'burger', label: 'Burger' },
  { id: 'couscous', label: 'Couscous' },
  { id: 'shawarma', label: 'Shawarma' },
  { id: 'sushi', label: 'Sushi' },
  { id: 'tacos', label: 'Tacos' },
] as const;

export type TrendingSearch = (typeof TRENDING_SEARCHES)[number];
