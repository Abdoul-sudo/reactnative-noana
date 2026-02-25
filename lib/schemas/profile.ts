import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  email: z.string().email('Invalid email address'),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
