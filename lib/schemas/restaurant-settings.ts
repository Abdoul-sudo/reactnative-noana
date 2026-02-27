import { z } from 'zod';

// ── Restaurant Info ─────────────────────────────────────

export const restaurantInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Restaurant name is required')
    .max(100, 'Name is too long'),
  description: z
    .string()
    .trim()
    .max(500, 'Description is too long')
    .optional()
    .or(z.literal('')),
});

export type RestaurantInfoFormData = z.infer<typeof restaurantInfoSchema>;

// ── Operating Hours ─────────────────────────────────────

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayScheduleSchema = z.object({
  open: z.string().regex(TIME_REGEX, 'Use HH:MM format (e.g. 09:00)'),
  close: z.string().regex(TIME_REGEX, 'Use HH:MM format (e.g. 22:00)'),
  closed: z.boolean(),
}).refine(
  (day) => day.closed || day.close > day.open,
  { message: 'Close time must be after open time' },
);

export const operatingHoursSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

export type OperatingHoursFormData = z.infer<typeof operatingHoursSchema>;

// ── Delivery Settings ───────────────────────────────────

export const deliverySettingsSchema = z.object({
  deliveryRadiusKm: z
    .string()
    .trim()
    .min(1, 'Delivery radius is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Radius must be greater than 0' },
    ),
  deliveryFee: z
    .string()
    .trim()
    .min(1, 'Delivery fee is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Fee must be 0 or greater' },
    ),
  minimumOrder: z
    .string()
    .trim()
    .min(1, 'Minimum order is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Minimum must be 0 or greater' },
    ),
});

export type DeliverySettingsFormData = z.infer<typeof deliverySettingsSchema>;
