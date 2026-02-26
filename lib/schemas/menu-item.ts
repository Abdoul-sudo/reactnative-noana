import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(100, 'Name is too long'),
  description: z.string().trim().max(500, 'Description is too long').optional().or(z.literal('')),
  price: z.string().trim().min(1, 'Price is required').refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: 'Price must be greater than 0' },
  ),
  prepTimeMin: z.string().trim().optional().or(z.literal('')).refine(
    (val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    },
    { message: 'Must be a positive number' },
  ),
  isAvailable: z.boolean().default(true),
  dietaryTags: z.array(z.enum(['vegan', 'halal', 'gluten_free', 'keto'])).default([]),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;

/** Converts user-entered DA price to centimes for DB storage */
export function priceToCentimes(priceStr: string): number {
  return Math.round(parseFloat(priceStr) * 100);
}

/** Converts centimes from DB to DA string for form display */
export function centimesToPrice(centimes: number): string {
  return (centimes / 100).toFixed(2).replace(/\.00$/, '');
}
