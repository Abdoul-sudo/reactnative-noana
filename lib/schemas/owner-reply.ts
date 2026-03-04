import { z } from 'zod';

export const ownerReplySchema = z.object({
  reply: z
    .string()
    .trim()
    .min(1, 'Reply cannot be empty')
    .max(500, 'Reply is too long'),
});

export type OwnerReplyFormData = z.infer<typeof ownerReplySchema>;
