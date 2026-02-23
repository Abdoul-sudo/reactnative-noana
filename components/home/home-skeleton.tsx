import { ScrollView, View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';
import { RestaurantCardSkeleton } from './restaurant-card-skeleton';

// Filter chip widths (Vegan, Halal, Gluten-free, Keto)
const CHIP_WIDTHS = [72, 60, 96, 48] as const;

export function HomeSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1 bg-white">
      {/* ── Header ────────────────────────────────────────────── */}
      <View className="px-4 pt-12 pb-3">
        <Skeleton className="h-6 rounded-md" style={{ width: 160 }} />
        <Skeleton className="h-4 rounded-md mt-2" style={{ width: 224 }} />
      </View>

      {/* ── Dietary filter chips row ──────────────────────────── */}
      <View className="flex-row px-4 py-3 gap-x-2">
        {CHIP_WIDTHS.map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </View>

      {/* ── Featured section ──────────────────────────────────── */}
      <View className="px-4 py-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 176 }} />
        <View className="flex-row">
          <RestaurantCardSkeleton count={3} />
        </View>
      </View>

      {/* ── Top rated section ─────────────────────────────────── */}
      <View className="px-4 py-2 mt-2">
        <Skeleton className="h-5 rounded-md mb-3" style={{ width: 144 }} />
        <View className="flex-row">
          <RestaurantCardSkeleton count={2} />
        </View>
      </View>
    </ScrollView>
  );
}
