import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loading state for the restaurant listing screen.
 * Shows 6 placeholder rows matching the `'list'` layout (80×80 image + text).
 */
export function ListingSkeleton() {
  return (
    <View className="flex-1 bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} className="flex-row px-4 py-3">
          {/* Image placeholder */}
          <Skeleton className="w-20 h-20 rounded-xl" />

          {/* Text placeholders */}
          <View className="flex-1 ml-3 justify-center">
            <Skeleton className="h-4 rounded-md" style={{ width: '70%' }} />
            <Skeleton className="mt-1.5 h-3 rounded-md" style={{ width: '50%' }} />
            <Skeleton className="mt-1.5 h-3 rounded-md" style={{ width: '40%' }} />
            <View className="flex-row mt-2 gap-x-1">
              <Skeleton className="h-4 rounded-full" style={{ width: 56 }} />
              <Skeleton className="h-4 rounded-full" style={{ width: 40 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
