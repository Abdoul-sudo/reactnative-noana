import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

interface RestaurantCardSkeletonProps {
  count?: number;
}

export function RestaurantCardSkeleton({ count = 1 }: RestaurantCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="mr-3" style={{ width: 208 }}>
          {/* Cover image area */}
          <Skeleton className="h-36 w-full rounded-xl" />
          {/* Restaurant name */}
          <Skeleton className="mt-2 h-4 rounded-md" style={{ width: 160 }} />
          {/* Cuisine / subtitle */}
          <Skeleton className="mt-1 h-3 rounded-md" style={{ width: 112 }} />
          {/* Dietary badge row */}
          <View className="flex-row mt-2 gap-x-1">
            <Skeleton className="h-5 rounded-full" style={{ width: 64 }} />
            <Skeleton className="h-5 rounded-full" style={{ width: 48 }} />
          </View>
        </View>
      ))}
    </>
  );
}
