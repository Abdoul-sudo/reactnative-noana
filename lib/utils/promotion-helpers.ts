import { type Promotion } from '@/lib/api/owner-promotions';

/**
 * Calculates the discounted price in DA.
 *
 * IMPORTANT price units:
 * - `price` is in DA (integers, e.g. 850 = 850 DA)
 * - `discount_value` for percentage type = percentage integer (e.g. 20 = 20%)
 * - `discount_value` for fixed type = centimes (e.g. 50000 = 500 DA)
 */
export function calculateDiscountedPrice(
  price: number,
  promotion: { discount_type: string; discount_value: number },
): number {
  if (promotion.discount_type === 'percentage') {
    return Math.round(price - (price * promotion.discount_value) / 100);
  }
  // Fixed: discount_value is in centimes, price is in DA
  const discountDA = Math.round(promotion.discount_value / 100);
  return Math.max(0, price - discountDA);
}

/**
 * Returns the promotion that gives the lowest final price for a given item.
 * Only considers promotions whose applicable_item_ids include the item.
 * Returns null if no promotions apply.
 */
export function getBestPromotion(
  itemId: string,
  price: number,
  promotions: Promotion[],
): Promotion | null {
  let best: Promotion | null = null;
  let lowestPrice = price;

  for (const promo of promotions) {
    if (!promo.applicable_item_ids.includes(itemId)) continue;

    const discounted = calculateDiscountedPrice(price, promo);
    if (discounted < lowestPrice) {
      lowestPrice = discounted;
      best = promo;
    }
  }

  return best;
}

/**
 * Returns badge text for restaurant card promotion badge.
 * Single promo → "20% off" or "500 DA off"
 * Multiple promos → "Promotions"
 */
export function formatPromotionBadge(promotions: Promotion[]): string {
  if (promotions.length === 0) return '';
  if (promotions.length > 1) return 'Promotions';

  const promo = promotions[0];
  if (promo.discount_type === 'percentage') {
    return `${promo.discount_value}% off`;
  }
  // Fixed: centimes to DA
  const da = Math.round(promo.discount_value / 100);
  return `${da} DA off`;
}
