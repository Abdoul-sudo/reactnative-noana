import { useCartStore, type CartItem } from '@/stores/cart-store';

const ITEM_A: Omit<CartItem, 'quantity'> = {
  id: 'item-a',
  name: 'Margherita Pizza',
  price: 850,
  restaurant_id: 'rest-1',
};

const ITEM_B: Omit<CartItem, 'quantity'> = {
  id: 'item-b',
  name: 'Caesar Salad',
  price: 650,
  restaurant_id: 'rest-1',
};

const ITEM_OTHER_RESTAURANT: Omit<CartItem, 'quantity'> = {
  id: 'item-c',
  name: 'Chicken Shawarma',
  price: 500,
  restaurant_id: 'rest-2',
};

beforeEach(() => {
  useCartStore.setState({ items: [], restaurantId: null });
});

describe('cart-store', () => {
  describe('addItem', () => {
    it('adds item with quantity 1', () => {
      useCartStore.getState().addItem(ITEM_A);

      const { items, restaurantId } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-a');
      expect(items[0].quantity).toBe(1);
      expect(restaurantId).toBe('rest-1');
    });

    it('increments quantity when adding same item', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_A);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('clears cart when adding from different restaurant', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);
      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().addItem(ITEM_OTHER_RESTAURANT);

      const { items, restaurantId } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-c');
      expect(restaurantId).toBe('rest-2');
    });
  });

  describe('removeItem', () => {
    it('removes item by id', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);

      useCartStore.getState().removeItem('item-a');

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-b');
    });

    it('resets restaurantId when last item removed', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().removeItem('item-a');

      const { items, restaurantId } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(restaurantId).toBeNull();
    });
  });

  describe('updateQuantity', () => {
    it('sets new quantity', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().updateQuantity('item-a', 5);

      expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it('removes item when quantity set to 0', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().updateQuantity('item-a', 0);

      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().restaurantId).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('resets all state', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);

      useCartStore.getState().clearCart();

      const { items, restaurantId } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(restaurantId).toBeNull();
    });
  });

  describe('getTotal', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it('returns correct sum of price * quantity', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);
      useCartStore.getState().updateQuantity('item-a', 2);

      // (850 * 2) + (650 * 1) = 2350
      expect(useCartStore.getState().getTotal()).toBe(2350);
    });
  });

  describe('getItemCount', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    it('returns correct total quantity', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);
      useCartStore.getState().updateQuantity('item-a', 3);

      // 3 + 1 = 4
      expect(useCartStore.getState().getItemCount()).toBe(4);
    });
  });
});
