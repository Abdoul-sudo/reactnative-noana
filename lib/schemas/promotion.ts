import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const promotionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Promotion name is required')
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
    start_date: z
      .string()
      .trim()
      .regex(DATE_REGEX, 'Use YYYY-MM-DD format'),
    end_date: z
      .string()
      .trim()
      .regex(DATE_REGEX, 'Use YYYY-MM-DD format'),
    push_enabled: z.boolean().default(false),
  })
  .refine(
    (data) => data.end_date >= data.start_date,
    { message: 'End date must be on or after start date', path: ['end_date'] },
  )
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

export type PromotionFormData = z.infer<typeof promotionSchema>;
