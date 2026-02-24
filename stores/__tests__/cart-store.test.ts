import { useCartStore, type CartItem, type AddItemInput } from '@/stores/cart-store';

const ITEM_A: AddItemInput = {
  id: 'item-a',
  name: 'Margherita Pizza',
  price: 850,
  restaurant_id: 'rest-1',
  restaurant_name: 'Pizza Palace',
};

const ITEM_B: AddItemInput = {
  id: 'item-b',
  name: 'Caesar Salad',
  price: 650,
  restaurant_id: 'rest-1',
  restaurant_name: 'Pizza Palace',
};

const ITEM_OTHER_RESTAURANT: AddItemInput = {
  id: 'item-c',
  name: 'Chicken Shawarma',
  price: 500,
  restaurant_id: 'rest-2',
  restaurant_name: 'Shawarma House',
};

beforeEach(() => {
  useCartStore.setState({
    items: [],
    restaurantId: null,
    restaurantName: null,
    pendingItem: null,
    hasConflict: false,
  });
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

    it('sets conflict state when adding from different restaurant', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);
      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().addItem(ITEM_OTHER_RESTAURANT);

      const { items, restaurantId, hasConflict, pendingItem } = useCartStore.getState();
      // Cart is unchanged — conflict detected, not cleared
      expect(items).toHaveLength(2);
      expect(restaurantId).toBe('rest-1');
      expect(hasConflict).toBe(true);
      expect(pendingItem).toEqual(ITEM_OTHER_RESTAURANT);
    });

    it('tracks restaurant name on first item add', () => {
      useCartStore.getState().addItem(ITEM_A);

      expect(useCartStore.getState().restaurantName).toBe('Pizza Palace');
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

      const { items, restaurantId, restaurantName } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(restaurantId).toBeNull();
      expect(restaurantName).toBeNull();
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

  describe('confirmConflict', () => {
    it('clears old items and adds pending item', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);
      // Trigger conflict
      useCartStore.getState().addItem(ITEM_OTHER_RESTAURANT);
      expect(useCartStore.getState().hasConflict).toBe(true);

      useCartStore.getState().confirmConflict();

      const { items, restaurantId, restaurantName, hasConflict, pendingItem } =
        useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-c');
      expect(items[0].quantity).toBe(1);
      expect(restaurantId).toBe('rest-2');
      expect(restaurantName).toBe('Shawarma House');
      expect(hasConflict).toBe(false);
      expect(pendingItem).toBeNull();
    });

    it('does nothing when no pending item', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().confirmConflict();

      // Cart unchanged
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].id).toBe('item-a');
    });
  });

  describe('cancelConflict', () => {
    it('resets conflict state without changing items', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_OTHER_RESTAURANT);
      expect(useCartStore.getState().hasConflict).toBe(true);

      useCartStore.getState().cancelConflict();

      const { items, restaurantId, hasConflict, pendingItem } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('item-a');
      expect(restaurantId).toBe('rest-1');
      expect(hasConflict).toBe(false);
      expect(pendingItem).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('resets all state', () => {
      useCartStore.getState().addItem(ITEM_A);
      useCartStore.getState().addItem(ITEM_B);

      useCartStore.getState().clearCart();

      const { items, restaurantId, restaurantName } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(restaurantId).toBeNull();
      expect(restaurantName).toBeNull();
    });
  });

  describe('initial state', () => {
    it('has no conflict on initialization', () => {
      const { hasConflict, pendingItem } = useCartStore.getState();
      expect(hasConflict).toBe(false);
      expect(pendingItem).toBeNull();
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
