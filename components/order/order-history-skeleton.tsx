import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading state for the order history screen.
 * Shows 4 placeholder order cards matching the OrderHistoryCard layout.
 */
export function OrderHistorySkeleton() {
  return (
    <View className="flex-1 px-4 pt-3">
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
        >
          {/* Row 1: restaurant name + status badge */}
          <View className="flex-row items-center justify-between mb-2">
            <Skeleton className="h-4 rounded" style={{ width: 140 }} />
            <Skeleton className="h-5 rounded-full" style={{ width: 72 }} />
          </View>

          {/* Row 2: items summary */}
          <Skeleton className="h-3 rounded mb-2" style={{ width: '80%' }} />

          {/* Row 3: date + total + reorder button */}
          <View className="flex-row items-center justify-between mt-1">
            <Skeleton className="h-3 rounded" style={{ width: 64 }} />
            <Skeleton className="h-3 rounded" style={{ width: 56 }} />
            <Skeleton className="h-8 rounded-full" style={{ width: 88 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
