import { FlatList, View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecentOrders } from '@/hooks/use-recent-orders';
import { useCartStore } from '@/stores/cart-store';
import { fetchMenuItemsByIds } from '@/lib/api/menu';
import { ReorderCard } from './reorder-card';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

/**
 * "Order Again" section for the home screen.
 * Shows a horizontal FlatList of previous order cards.
 * Returns null when the user has no delivered orders (section hidden).
 */
export function ReorderSection() {
  const { orders, isLoading } = useRecentOrders();
  const startReorder = useCartStore((s) => s.startReorder);
  const confirmConflict = useCartStore((s) => s.confirmConflict);
  const cancelConflict = useCartStore((s) => s.cancelConflict);
  const router = useRouter();

  // Hide section entirely when no orders or still loading
  if (isLoading || orders.length === 0) return null;

  async function handleReorder(order: OrderWithRestaurant) {
    const items = order.items as unknown as OrderItem[];
    if (items.length === 0) return;

    // Check which items are still available
    const menuItemIds = items.map((item) => item.menu_item_id);
    let availableMenuItems;
    try {
      availableMenuItems = await fetchMenuItemsByIds(menuItemIds);
    } catch {
      Alert.alert('Error', 'Could not check item availability. Please try again.');
      return;
    }

    // Build a set of available IDs and a price map for current prices
    const availableIds = new Set(availableMenuItems.map((mi) => mi.id));
    const currentPriceMap = new Map(availableMenuItems.map((mi) => [mi.id, mi.price]));

    // Split items into available and skipped
    const availableItems = items.filter((item) => availableIds.has(item.menu_item_id));
    const skippedItems = items.filter((item) => !availableIds.has(item.menu_item_id));

    if (availableItems.length === 0) {
      Alert.alert(
        'Items Unavailable',
        'All items from this order are currently unavailable.',
      );
      return;
    }

    // Map available order items to cart input format, using CURRENT prices
    const cartItems = availableItems.map((item) => ({
      id: item.menu_item_id,
      name: item.name,
      price: currentPriceMap.get(item.menu_item_id) ?? item.price,
      quantity: item.quantity,
      restaurant_id: order.restaurant_id,
      restaurant_name: order.restaurants.name,
    }));

    // Add to cart — may trigger conflict if cart has items from a different restaurant
    startReorder(cartItems, order.restaurant_id, order.restaurants.name);

    // Check if a conflict was triggered (dialog is only in restaurant screen,
    // so we handle it here with an Alert for the home screen context)
    if (useCartStore.getState().hasConflict) {
      const currentName = useCartStore.getState().restaurantName ?? 'another restaurant';
      Alert.alert(
        'Replace your cart?',
        `Your cart has items from ${currentName}. Replace with items from ${order.restaurants.name}?`,
        [
          { text: 'Keep current cart', style: 'cancel', onPress: cancelConflict },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              confirmConflict();
              if (skippedItems.length > 0) {
                showSkippedAlert(skippedItems);
              }
              router.navigate('/(tabs)/cart');
            },
          },
        ],
      );
      return;
    }

    // Notify about skipped items
    if (skippedItems.length > 0) {
      showSkippedAlert(skippedItems);
    }

    // Navigate to cart tab
    router.navigate('/(tabs)/cart');
  }

  return (
    <View className="mt-4">
      <Text className="font-[Karla_700Bold] text-base text-gray-900 px-4 mb-2">
        Order Again
      </Text>
      <FlatList
        data={orders}
        keyExtractor={(item: OrderWithRestaurant) => item.id}
        renderItem={({ item }: { item: OrderWithRestaurant }) => (
          <ReorderCard order={item} onReorder={handleReorder} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}

function showSkippedAlert(skippedItems: OrderItem[]) {
  const skippedNames = skippedItems.map((item) => item.name).join(', ');
  Alert.alert(
    'Some Items Skipped',
    `The following items are no longer available and were not added: ${skippedNames}`,
  );
}
