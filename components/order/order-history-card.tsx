import { View, Text, Pressable } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { ORDER_STATUS } from '@/constants/order-status';
import { type OrderWithRestaurant, type OrderItem } from '@/lib/api/orders';

type OrderHistoryCardProps = {
  order: OrderWithRestaurant;
  onPress: (order: OrderWithRestaurant) => void;
  onReorder: (order: OrderWithRestaurant) => void;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  placed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Placed' },
  confirmed: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Confirmed' },
  preparing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Preparing' },
  on_the_way: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'On the Way' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
};

export function OrderHistoryCard({ order, onPress, onReorder }: OrderHistoryCardProps) {
  const items = order.items as unknown as OrderItem[];
  const summary = formatItemsSummary(items);
  const dateStr = formatOrderDate(order.placed_at);
  const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.placed;
  const isDelivered = order.status === ORDER_STATUS.DELIVERED;

  return (
    <Pressable
      onPress={() => onPress(order)}
      accessibilityRole="button"
      accessibilityLabel={`Order from ${order.restaurants.name}, ${statusStyle.label}, ${dateStr}, ${order.total} DA`}
      className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
    >
      {/* Row 1: restaurant name + status badge */}
      <View className="flex-row items-center justify-between mb-1">
        <Text
          className="font-[Karla_700Bold] text-sm text-gray-900 flex-1 mr-2"
          numberOfLines={1}
        >
          {order.restaurants.name}
        </Text>
        <View className={`${statusStyle.bg} rounded-full px-2 py-0.5`}>
          <Text className={`font-[Karla_600SemiBold] text-xs ${statusStyle.text}`}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Row 2: items summary */}
      <Text
        className="font-[Karla_400Regular] text-xs text-gray-500 mb-2"
        numberOfLines={1}
      >
        {summary}
      </Text>

      {/* Row 3: date + total + reorder button */}
      <View className="flex-row items-center justify-between">
        <Text className="font-[Karla_400Regular] text-xs text-gray-400">
          {dateStr}
        </Text>
        <Text className="font-[Karla_600SemiBold] text-sm text-gray-900">
          {order.total} DA
        </Text>
        {isDelivered && (
          <Pressable
            onPress={() => onReorder(order)}
            accessibilityRole="button"
            accessibilityLabel={`Reorder from ${order.restaurants.name}`}
            className="flex-row items-center bg-red-600 rounded-full px-3 py-1.5"
          >
            <RotateCcw size={12} color="#ffffff" />
            <Text className="font-[Karla_700Bold] text-xs text-white ml-1">
              Reorder
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function formatItemsSummary(items: OrderItem[]): string {
  const parts = items.slice(0, 3).map((item) => `${item.name} x${item.quantity}`);
  if (items.length > 3) parts.push('...');
  return parts.join(', ');
}

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  // Compare calendar dates (not raw ms) to handle timezone edge cases
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - orderDay.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
