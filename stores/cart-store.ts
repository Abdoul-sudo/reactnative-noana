import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurant_id: string;
}

type AddItemInput = Omit<CartItem, 'quantity'>;

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: AddItemInput) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,

  addItem: (item) => {
    const { items, restaurantId } = get();

    // If cart has items from a different restaurant, clear first
    if (restaurantId && restaurantId !== item.restaurant_id) {
      set({ items: [{ ...item, quantity: 1 }], restaurantId: item.restaurant_id });
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
      });
    }
  },

  removeItem: (itemId) => {
    const newItems = get().items.filter((i) => i.id !== itemId);
    set({
      items: newItems,
      restaurantId: newItems.length === 0 ? null : get().restaurantId,
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

  clearCart: () => set({ items: [], restaurantId: null }),

  getTotal: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
