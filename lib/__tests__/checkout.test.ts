import { buildOrderPayload } from '@/lib/checkout';

const MOCK_CART_ITEMS = [
  { id: 'item-1', name: 'Burger', price: 1200, quantity: 2, restaurant_id: 'rest-1' },
  { id: 'item-2', name: 'Fries', price: 400, quantity: 1, restaurant_id: 'rest-1' },
];

const MOCK_ADDRESS = {
  id: 'addr-1',
  user_id: 'user-1',
  label: 'Home',
  address: '123 Rue Didouche Mourad',
  city: 'Algiers',
  lat: 36.752887,
  lng: 3.042048,
  is_default: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('buildOrderPayload', () => {
  it('maps cart items to OrderItem format with dietary_tags as empty array', () => {
    const payload = buildOrderPayload({
      userId: 'user-1',
      restaurantId: 'rest-1',
      items: MOCK_CART_ITEMS,
      selectedAddress: MOCK_ADDRESS,
      subtotal: 2800,
      deliveryFee: 0,
      total: 2800,
    });

    expect(payload.items).toHaveLength(2);
    expect(payload.items[0]).toEqual({
      menu_item_id: 'item-1',
      name: 'Burger',
      price: 1200,
      quantity: 2,
      dietary_tags: [],
    });
    expect(payload.items[1]).toEqual({
      menu_item_id: 'item-2',
      name: 'Fries',
      price: 400,
      quantity: 1,
      dietary_tags: [],
    });
  });

  it('snapshots delivery address as plain object (not reference)', () => {
    const payload = buildOrderPayload({
      userId: 'user-1',
      restaurantId: 'rest-1',
      items: MOCK_CART_ITEMS,
      selectedAddress: MOCK_ADDRESS,
      subtotal: 2800,
      deliveryFee: 0,
      total: 2800,
    });

    expect(payload.delivery_address).toEqual({
      label: 'Home',
      address: '123 Rue Didouche Mourad',
      city: 'Algiers',
      lat: 36.752887,
      lng: 3.042048,
    });

    // Ensure it's a snapshot (not a reference to the original)
    expect(payload.delivery_address).not.toBe(MOCK_ADDRESS);
  });

  it('sets correct user_id, restaurant_id, and price fields', () => {
    const payload = buildOrderPayload({
      userId: 'user-42',
      restaurantId: 'rest-7',
      items: MOCK_CART_ITEMS,
      selectedAddress: MOCK_ADDRESS,
      subtotal: 2800,
      deliveryFee: 500,
      total: 3300,
    });

    expect(payload.user_id).toBe('user-42');
    expect(payload.restaurant_id).toBe('rest-7');
    expect(payload.subtotal).toBe(2800);
    expect(payload.delivery_fee).toBe(500);
    expect(payload.total).toBe(3300);
  });

  it('includes special_instructions when provided', () => {
    const payload = buildOrderPayload({
      userId: 'user-1',
      restaurantId: 'rest-1',
      items: MOCK_CART_ITEMS,
      selectedAddress: MOCK_ADDRESS,
      subtotal: 2800,
      deliveryFee: 0,
      total: 2800,
      specialInstructions: 'No onions please',
    });

    expect(payload.special_instructions).toBe('No onions please');
  });

  it('omits special_instructions when not provided', () => {
    const payload = buildOrderPayload({
      userId: 'user-1',
      restaurantId: 'rest-1',
      items: MOCK_CART_ITEMS,
      selectedAddress: MOCK_ADDRESS,
      subtotal: 2800,
      deliveryFee: 0,
      total: 2800,
    });

    expect(payload.special_instructions).toBeUndefined();
  });

  it('handles address with null lat/lng', () => {
    const addressWithoutGps = {
      ...MOCK_ADDRESS,
      lat: null,
      lng: null,
    };

    const payload = buildOrderPayload({
      userId: 'user-1',
      restaurantId: 'rest-1',
      items: MOCK_CART_ITEMS,
      selectedAddress: addressWithoutGps,
      subtotal: 2800,
      deliveryFee: 0,
      total: 2800,
    });

    expect(payload.delivery_address.lat).toBeNull();
    expect(payload.delivery_address.lng).toBeNull();
  });
});
