import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label is too long').default('Home'),
  address: z.string().min(5, 'Address is too short'),
  city: z.string().min(2, 'City is required'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  is_default: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;
