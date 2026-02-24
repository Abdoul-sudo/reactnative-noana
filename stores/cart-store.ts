import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurant_id: string;
}

export type AddItemInput = Omit<CartItem, 'quantity'> & {
  restaurant_name?: string;
};

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  pendingItem: AddItemInput | null;
  hasConflict: boolean;
  addItem: (item: AddItemInput) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  confirmConflict: () => void;
  cancelConflict: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,
  pendingItem: null,
  hasConflict: false,

  addItem: (item) => {
    const { items, restaurantId } = get();

    // Detect conflict: cart has items from a different restaurant
    if (restaurantId && restaurantId !== item.restaurant_id) {
      set({ pendingItem: item, hasConflict: true });
      return;
    }

    // Check if item already in cart
    const existing = items.find((i) => i.id === item.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({
        items: [...items, { ...item, quantity: 1 }],
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name ?? get().restaurantName,
      });
    }
  },

  removeItem: (itemId) => {
    const newItems = get().items.filter((i) => i.id !== itemId);
    const isEmpty = newItems.length === 0;
    set({
      items: newItems,
      restaurantId: isEmpty ? null : get().restaurantId,
      restaurantName: isEmpty ? null : get().restaurantName,
    });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({
    items: [],
    restaurantId: null,
    restaurantName: null,
    pendingItem: null,
    hasConflict: false,
  }),

  confirmConflict: () => {
    const { pendingItem } = get();
    if (!pendingItem) return;
    set({
      items: [{ ...pendingItem, quantity: 1 }],
      restaurantId: pendingItem.restaurant_id,
      restaurantName: pendingItem.restaurant_name ?? null,
      pendingItem: null,
      hasConflict: false,
    });
  },

  cancelConflict: () => {
    set({ pendingItem: null, hasConflict: false });
  },

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
