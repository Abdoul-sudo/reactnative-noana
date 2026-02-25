import { type CartItem } from '@/stores/cart-store';
import { type Address } from '@/lib/api/addresses';
import {
  type CreateOrderInput,
  type OrderItem,
  type DeliveryAddress,
} from '@/lib/api/orders';

type BuildOrderPayloadInput = {
  userId: string;
  restaurantId: string;
  items: CartItem[];
  selectedAddress: Address;
  subtotal: number;
  deliveryFee: number;
  total: number;
  specialInstructions?: string;
};

/**
 * Builds the CreateOrderInput payload from cart state and selected address.
 * Maps CartItem[] to OrderItem[] (jsonb snapshot) and snapshots the delivery address.
 */
export function buildOrderPayload(input: BuildOrderPayloadInput): CreateOrderInput {
  const orderItems: OrderItem[] = input.items.map((item) => ({
    menu_item_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    dietary_tags: [],
  }));

  const deliveryAddress: DeliveryAddress = {
    label: input.selectedAddress.label ?? '',
    address: input.selectedAddress.address,
    city: input.selectedAddress.city,
    lat: input.selectedAddress.lat ?? null,
    lng: input.selectedAddress.lng ?? null,
  };

  return {
    user_id: input.userId,
    restaurant_id: input.restaurantId,
    items: orderItems,
    delivery_address: deliveryAddress,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    special_instructions: input.specialInstructions,
  };
}
