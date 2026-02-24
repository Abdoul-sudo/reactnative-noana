import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MapPin, ChevronDown, Search } from 'lucide-react-native';
import { useState } from 'react';
import { DietaryFilterBar } from '@/components/home/dietary-filter-bar';
import { HomeSkeleton } from '@/components/home/home-skeleton';
import { useDietaryFilters } from '@/hooks/use-dietary-filters';

export default function HomeScreen() {
  const router = useRouter();
  const { activeFilters, toggleFilter } = useDietaryFilters();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stub: replaced by real data hooks in Stories 2.4/2.5
  const isLoading = false;

  async function handleRefresh() {
    setIsRefreshing(true);
    // TODO 2.4/2.5: replace with real refetch() calls from data hooks
    await new Promise(r => setTimeout(r, 300));
    setIsRefreshing(false);
  }

  if (isLoading) return <HomeSkeleton />;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Header row 1: brand + bell + loyalty ───────────── */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text
            accessibilityRole="header"
            className="font-[PlayfairDisplaySC_400Regular] text-2xl text-gray-900"
          >
            noana
          </Text>
          <View className="flex-row items-center gap-x-3">
            <Pressable
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              className="p-2.5"
            >
              <Bell size={24} color="#1f2937" />
            </Pressable>
            <View className="bg-red-600 px-2 py-0.5 rounded-full">
              <Text className="font-[Karla_600SemiBold] text-xs text-white">0 pts</Text>
            </View>
          </View>
        </View>

        {/* ── Header row 2: location selector ───────────────── */}
        <Pressable
          className="flex-row items-center px-4 py-2.5 gap-x-1"
          accessibilityRole="button"
          accessibilityLabel="Select delivery location"
        >
          <MapPin size={16} color="#dc2626" />
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-800 flex-1">
            Select location
          </Text>
          <ChevronDown size={14} color="#6b7280" />
        </Pressable>

        {/* ── Search bar (tappable, navigates to search tab) ── */}
        <Pressable
          onPress={() => router.navigate('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Search restaurants and dishes"
          className="mx-4 mb-2 flex-row items-center bg-gray-100 rounded-xl px-4 py-3.5"
        >
          <Search size={18} color="#9ca3af" />
          <Text className="font-[Karla_400Regular] text-sm text-gray-400 ml-2">
            Search restaurants and dishes
          </Text>
        </Pressable>

        {/* ── Dietary filter chips ───────────────────────────── */}
        <DietaryFilterBar activeFilters={activeFilters} onToggle={toggleFilter} />

        {/* ── Content sections (Stories 2.4/2.5 fill here) ──── */}
        {/* TODO 2.4: CuisineCategories, FeaturedRestaurants    */}
        {/* TODO 2.5: TrendingDishes, TopRatedRestaurants       */}
      </ScrollView>
    </SafeAreaView>
  );
}
