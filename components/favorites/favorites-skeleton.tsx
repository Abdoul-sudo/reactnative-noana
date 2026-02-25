import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton placeholder for the favorites screen.
 * Shows 4 cards in a 2-column grid matching the RestaurantCard grid layout.
 */
export function FavoritesSkeleton() {
  return (
    <View className="flex-1 px-4 pt-2">
      {/* Row 1 */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Skeleton className="w-full h-28 rounded-xl" />
          <Skeleton className="h-4 rounded mt-2" style={{ width: '75%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '50%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '60%' }} />
        </View>
        <View className="flex-1">
          <Skeleton className="w-full h-28 rounded-xl" />
          <Skeleton className="h-4 rounded mt-2" style={{ width: '75%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '50%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '60%' }} />
        </View>
      </View>

      {/* Row 2 */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Skeleton className="w-full h-28 rounded-xl" />
          <Skeleton className="h-4 rounded mt-2" style={{ width: '75%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '50%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '60%' }} />
        </View>
        <View className="flex-1">
          <Skeleton className="w-full h-28 rounded-xl" />
          <Skeleton className="h-4 rounded mt-2" style={{ width: '75%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '50%' }} />
          <Skeleton className="h-3 rounded mt-1" style={{ width: '60%' }} />
        </View>
      </View>
    </View>
  );
}
