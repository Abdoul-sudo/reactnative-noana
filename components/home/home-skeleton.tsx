import { ScrollView, View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { RestaurantCardSkeleton } from './restaurant-card-skeleton';

// Filter chip widths (Vegan, Halal, Gluten-free, Keto)
const CHIP_WIDTHS = [72, 60, 96, 48] as const;

// Cuisine category circle count (matches CUISINE_CATEGORIES length)
const CATEGORY_COUNT = 4;

export function HomeSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 bg-white">
      {/* ── Header ────────────────────────────────────────────── */}
      <View className="px-4 pt-4 pb-3">
        <Skeleton className="h-6 rounded-md" style={{ width: 160 }} />
        <Skeleton className="h-4 rounded-md mt-2" style={{ width: 224 }} />
      </View>

      {/* ── Dietary filter chips row ──────────────────────────── */}
      <View className="flex-row px-4 py-3 gap-x-2">
        {CHIP_WIDTHS.map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </View>

      {/* ── Cuisine categories row ──────────────────────────── */}
      <View className="px-4 py-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 160 }} />
        <View className="flex-row gap-x-4">
          {Array.from({ length: CATEGORY_COUNT }).map((_, i) => (
            <View key={i} className="items-center" style={{ width: 72 }}>
              <Skeleton className="w-14 h-14 rounded-full" />
              <Skeleton className="h-3 rounded-md mt-1.5" style={{ width: 48 }} />
            </View>
          ))}
        </View>
      </View>

      {/* ── Featured restaurants section ───────────────────── */}
      <View className="px-4 py-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 176 }} />
        <View className="flex-row">
          <RestaurantCardSkeleton count={3} />
        </View>
      </View>

      {/* ── Trending dishes section ─────────────────────────── */}
      <View className="px-4 py-2 mt-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 144 }} />
        <View className="flex-row gap-x-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ width: 160 }}>
              <Skeleton className="w-full h-28 rounded-xl" />
              <Skeleton className="h-3.5 rounded-md mt-1.5" style={{ width: 120 }} />
              <Skeleton className="h-3 rounded-md mt-1" style={{ width: 64 }} />
              <Skeleton className="h-3 rounded-md mt-1" style={{ width: 96 }} />
            </View>
          ))}
        </View>
      </View>

      {/* ── Top rated restaurants section (2-column grid) ──── */}
      <View className="px-4 py-2 mt-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 176 }} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Skeleton className="w-full h-28 rounded-xl" />
            <Skeleton className="h-3.5 rounded-md mt-2" style={{ width: '80%' }} />
            <Skeleton className="h-3 rounded-md mt-1" style={{ width: '60%' }} />
          </View>
          <View className="flex-1">
            <Skeleton className="w-full h-28 rounded-xl" />
            <Skeleton className="h-3.5 rounded-md mt-2" style={{ width: '80%' }} />
            <Skeleton className="h-3 rounded-md mt-1" style={{ width: '60%' }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
