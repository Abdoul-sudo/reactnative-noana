/** Fallback trending searches used when the DB fetch fails or returns empty. */
export const TRENDING_SEARCHES = [
  { id: 'pizza', label: 'Pizza' },
  { id: 'burger', label: 'Burger' },
  { id: 'couscous', label: 'Couscous' },
  { id: 'shawarma', label: 'Shawarma' },
  { id: 'grillades', label: 'Grillades' },
  { id: 'bourek', label: 'Bourek' },
  { id: 'tajine', label: 'Tajine' },
  { id: 'sushi', label: 'Sushi' },
] as const;

export type TrendingSearch = (typeof TRENDING_SEARCHES)[number];
