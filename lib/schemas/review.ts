import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Please select a rating').max(5),
  comment: z.string().max(500, 'Comment is too long').optional().or(z.literal('')),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
