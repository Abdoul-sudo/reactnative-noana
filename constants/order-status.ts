export const ORDER_STATUS = {
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Ordered steps for the tracking stepper (excludes cancelled).
 * Each step has: key (matches DB status), label, iconName (Lucide), timestampKey (DB column).
 */
export const ORDER_STEPS = [
  { key: ORDER_STATUS.PLACED, label: 'Placed', iconName: 'ClipboardCheck', timestampKey: 'placed_at' },
  { key: ORDER_STATUS.CONFIRMED, label: 'Confirmed', iconName: 'CheckCircle', timestampKey: 'confirmed_at' },
  { key: ORDER_STATUS.PREPARING, label: 'Preparing', iconName: 'ChefHat', timestampKey: 'preparing_at' },
  { key: ORDER_STATUS.ON_THE_WAY, label: 'On the Way', iconName: 'Truck', timestampKey: 'on_the_way_at' },
  { key: ORDER_STATUS.DELIVERED, label: 'Delivered', iconName: 'PackageCheck', timestampKey: 'delivered_at' },
] as const;

export type OrderStep = (typeof ORDER_STEPS)[number];
