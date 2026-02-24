export type DietaryTag = 'vegan' | 'halal' | 'gluten_free' | 'keto';

export interface DietaryTagConfig {
  id: DietaryTag;
  label: string;
}

export const DIETARY_TAGS: DietaryTagConfig[] = [
  { id: 'vegan',       label: 'Vegan' },
  { id: 'halal',       label: 'Halal' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'keto',        label: 'Keto' },
];
