import { Pizza, Soup, Beef, Salad, type LucideProps } from 'lucide-react-native';
import { type ComponentType } from 'react';

export interface CuisineCategory {
  id: string;
  label: string;
  icon: ComponentType<LucideProps>;
}

/**
 * Cuisine categories matching the cuisine_type values in the restaurants table.
 * Each id must exactly match the cuisine_type string stored in the DB.
 */
export const CUISINE_CATEGORIES: CuisineCategory[] = [
  { id: 'Italian', label: 'Italian', icon: Pizza },
  { id: 'Asian', label: 'Asian', icon: Soup },
  { id: 'American', label: 'American', icon: Beef },
  { id: 'Mediterranean', label: 'Mediterranean', icon: Salad },
];
