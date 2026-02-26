import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Name is too long'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
