import { Alert } from 'react-native';
import { fetchMenuItemsByIds } from '@/lib/api/menu';
import { useCartStore } from '@/stores/cart-store';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

type ReorderDeps = {
  startReorder: ReturnType<typeof useCartStore.getState>['startReorder'];
  confirmConflict: ReturnType<typeof useCartStore.getState>['confirmConflict'];
  cancelConflict: ReturnType<typeof useCartStore.getState>['cancelConflict'];
  navigate: (path: string) => void;
};

/**
 * Shared reorder logic used by both the home screen "Order Again" section
 * and the order history screen. Checks item availability, uses current prices,
 * handles cart conflicts via Alert.alert, and navigates to cart.
 */
export async function handleReorder(order: OrderWithRestaurant, deps: ReorderDeps) {
  const items = order.items as unknown as OrderItem[];
  if (items.length === 0) return;

  // 1. Check which items are still available
  const menuItemIds = items.map((item) => item.menu_item_id);
  let availableMenuItems;
  try {
    availableMenuItems = await fetchMenuItemsByIds(menuItemIds);
  } catch {
    Alert.alert('Error', 'Could not check item availability. Please try again.');
    return;
  }

  // 2. Build availability set and current price map
  const availableIds = new Set(availableMenuItems.map((mi) => mi.id));
  const currentPriceMap = new Map(availableMenuItems.map((mi) => [mi.id, mi.price]));

  // 3. Split items into available and skipped
  const availableItems = items.filter((item) => availableIds.has(item.menu_item_id));
  const skippedItems = items.filter((item) => !availableIds.has(item.menu_item_id));

  if (availableItems.length === 0) {
    Alert.alert('Items Unavailable', 'All items from this order are currently unavailable.');
    return;
  }

  // 4. Map to cart input format with CURRENT prices
  const cartItems = availableItems.map((item) => ({
    id: item.menu_item_id,
    name: item.name,
    price: currentPriceMap.get(item.menu_item_id) ?? item.price,
    quantity: item.quantity,
    restaurant_id: order.restaurant_id,
    restaurant_name: order.restaurants.name,
  }));

  // 5. Add to cart
  deps.startReorder(cartItems, order.restaurant_id, order.restaurants.name);

  // 6. Handle conflict (Alert for non-restaurant-screen context)
  if (useCartStore.getState().hasConflict) {
    const currentName = useCartStore.getState().restaurantName ?? 'another restaurant';
    Alert.alert(
      'Replace your cart?',
      `Your cart has items from ${currentName}. Replace with items from ${order.restaurants.name}?`,
      [
        { text: 'Keep current cart', style: 'cancel', onPress: deps.cancelConflict },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            deps.confirmConflict();
            if (skippedItems.length > 0) {
              showSkippedAlert(skippedItems);
            }
            deps.navigate('/(tabs)/cart');
          },
        },
      ],
    );
    return;
  }

  // 7. Notify about skipped items and navigate
  if (skippedItems.length > 0) {
    showSkippedAlert(skippedItems);
  }
  deps.navigate('/(tabs)/cart');
}

function showSkippedAlert(skippedItems: OrderItem[]) {
  const names = skippedItems.map((item) => item.name).join(', ');
  Alert.alert(
    'Some Items Skipped',
    `The following items are no longer available and were not added: ${names}`,
  );
}
