import { type CartItem } from '@/stores/cart-store';
import { type Promotion } from '@/lib/api/promotions';
import {
  getBestPromotion,
  calculateDiscountedPrice,
} from '@/lib/utils/promotion-helpers';

export type CheckoutItemDiscount = {
  itemId: string;
  originalPrice: number;
  discountedPrice: number;
  promotionId: string;
  promotionName: string;
};

export type CheckoutDiscountResult = {
  /** Per-item discount details (only items that have a promotion) */
  itemDiscounts: Map<string, CheckoutItemDiscount>;
  /** Sum of discounted prices * quantity for ALL items */
  discountedSubtotal: number;
  /** Original subtotal minus discounted subtotal */
  totalDiscount: number;
  /** The promotion_id to save on the order (best single promo, or null) */
  promotionId: string | null;
};

/**
 * Computes checkout discount details from cart items and active promotions.
 *
 * For each cart item, finds the best applicable promotion and calculates
 * the discounted price. Returns everything the checkout screen needs:
 * per-item discounts, discounted subtotal, total savings, and the
 * promotion_id to save on the order.
 *
 * Promotion ID selection: if all discounted items share the same promo,
 * use that ID. If mixed, pick the one with the largest total savings.
 */
export function computeCheckoutDiscounts(
  items: CartItem[],
  promotions: Promotion[],
): CheckoutDiscountResult {
  const itemDiscounts = new Map<string, CheckoutItemDiscount>();

  // Track per-promotion total savings to pick the best one
  const promoSavings = new Map<string, number>();

  let discountedSubtotal = 0;
  let originalSubtotal = 0;

  for (const item of items) {
    const originalLineTotal = item.price * item.quantity;
    originalSubtotal += originalLineTotal;

    const bestPromo = getBestPromotion(item.id, item.price, promotions);

    if (bestPromo) {
      const discounted = calculateDiscountedPrice(item.price, bestPromo);
      const discountedLineTotal = discounted * item.quantity;
      discountedSubtotal += discountedLineTotal;

      itemDiscounts.set(item.id, {
        itemId: item.id,
        originalPrice: item.price,
        discountedPrice: discounted,
        promotionId: bestPromo.id,
        promotionName: bestPromo.name,
      });

      // Accumulate savings per promotion
      const savings = originalLineTotal - discountedLineTotal;
      promoSavings.set(
        bestPromo.id,
        (promoSavings.get(bestPromo.id) ?? 0) + savings,
      );
    } else {
      discountedSubtotal += originalLineTotal;
    }
  }

  const totalDiscount = originalSubtotal - discountedSubtotal;

  // Determine which promotion_id to save on the order
  let promotionId: string | null = null;
  if (promoSavings.size === 1) {
    // Single promotion — use it
    promotionId = [...promoSavings.keys()][0];
  } else if (promoSavings.size > 1) {
    // Multiple promotions — pick the one with largest total savings
    let maxSavings = 0;
    for (const [id, savings] of promoSavings) {
      if (savings > maxSavings) {
        maxSavings = savings;
        promotionId = id;
      }
    }
  }

  return {
    itemDiscounts,
    discountedSubtotal,
    totalDiscount,
    promotionId,
  };
}
