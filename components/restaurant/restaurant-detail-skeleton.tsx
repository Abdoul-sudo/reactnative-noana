import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading screen for the restaurant detail screen.
 * Matches the layout: cover image → info block → tab bar → menu rows.
 */
export function RestaurantDetailSkeleton() {
  return (
    <View className="flex-1">
      {/* Cover image placeholder */}
      <Skeleton className="w-full rounded-none" style={{ height: 200 }} />

      {/* Restaurant info block */}
      <View className="px-4 pt-4 pb-2">
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded mt-2" />
        <View className="flex-row gap-3 mt-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </View>
        <View className="flex-row gap-1.5 mt-2.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </View>
      </View>

      {/* Tab bar skeleton */}
      <View className="flex-row border-b border-gray-200 px-4 py-3">
        <Skeleton className="h-4 w-12 rounded flex-1" />
        <Skeleton className="h-4 w-16 rounded flex-1 mx-4" />
        <Skeleton className="h-4 w-10 rounded flex-1" />
      </View>

      {/* Menu item row skeletons (4 rows) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} className="px-4 py-3 border-b border-gray-50">
          <View className="flex-row justify-between">
            <View className="flex-1 mr-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-full rounded mt-1.5" />
              <Skeleton className="h-3 w-3/4 rounded mt-1" />
            </View>
            <Skeleton className="h-4 w-16 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}
