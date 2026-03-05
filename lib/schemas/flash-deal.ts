import { z } from 'zod';

export const flashDealSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Deal name is required')
      .max(100, 'Name is too long'),
    discount_type: z.enum(['percentage', 'fixed'], {
      required_error: 'Select a discount type',
    }),
    discount_value: z
      .string()
      .trim()
      .min(1, 'Discount value is required')
      .refine(
        (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num > 0;
        },
        { message: 'Must be a positive number' },
      ),
    applicable_item_ids: z
      .array(z.string())
      .min(1, 'Select at least one menu item'),
    duration_hours: z
      .string()
      .trim()
      .min(1, 'Duration is required')
      .refine(
        (val) => {
          const num = parseInt(val, 10);
          return !isNaN(num) && num >= 1 && num <= 72;
        },
        { message: 'Duration must be between 1 and 72 hours' },
      ),
  })
  .refine(
    (data) => {
      if (data.discount_type === 'percentage') {
        const val = parseInt(data.discount_value, 10);
        return val <= 100;
      }
      return true;
    },
    { message: 'Percentage cannot exceed 100', path: ['discount_value'] },
  );

export type FlashDealFormData = z.infer<typeof flashDealSchema>;
