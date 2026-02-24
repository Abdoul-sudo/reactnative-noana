import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for the pre-search state (recent + trending placeholders). */
export function PreSearchSkeleton() {
  return (
    <View className="px-4 pt-4">
      {/* Recent searches section */}
      <Skeleton className="h-5 rounded-md mb-3" style={{ width: 140 }} />
      <View className="flex-row gap-x-2 mb-4">
        {[80, 64, 96].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </View>

      {/* Trending section */}
      <Skeleton className="h-5 rounded-md mb-3" style={{ width: 100 }} />
      <View className="flex-row flex-wrap gap-2">
        {[72, 80, 88, 64, 96, 72].map((w, i) => (
          <Skeleton key={i} className="h-9 rounded-full" style={{ width: w }} />
        ))}
      </View>
    </View>
  );
}

/** Skeleton for search results (3 card placeholders). */
export function ResultsSkeleton() {
  return (
    <View className="px-4 pt-2">
      {/* Tab bar placeholder */}
      <View className="flex-row gap-x-4 mb-4">
        <Skeleton className="h-9 rounded-lg flex-1" />
        <Skeleton className="h-9 rounded-lg flex-1" />
      </View>

      {/* Result cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} className="flex-row gap-x-3 mb-4">
          <Skeleton className="w-20 h-20 rounded-xl" />
          <View className="flex-1 justify-center">
            <Skeleton className="h-4 rounded-md mb-2" style={{ width: '70%' }} />
            <Skeleton className="h-3 rounded-md mb-1" style={{ width: '50%' }} />
            <Skeleton className="h-3 rounded-md" style={{ width: '40%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}
