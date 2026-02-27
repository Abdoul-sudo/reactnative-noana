import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  AlertCircle,
  Camera,
  Clock,
  MapPin,
  Pencil,
  Store,
  Truck,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerRestaurant } from '@/hooks/use-owner-restaurant';
import { getRestaurantImagePublicUrl } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { RestaurantInfoFormSheet } from '@/components/owner/restaurant-info-form-sheet';
import { OperatingHoursFormSheet } from '@/components/owner/operating-hours-form-sheet';
import { DeliverySettingsFormSheet } from '@/components/owner/delivery-settings-form-sheet';

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// ── Section Card ─────────────────────────────────────────
function SectionCard({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View
      className="bg-stone-800 rounded-xl p-4 mb-4"
      accessibilityLabel={`${title} section`}
      accessibilityRole="summary"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {icon}
          <Text
            accessibilityRole="header"
            className="font-[Karla_700Bold] text-base text-stone-100 ml-2"
          >
            {title}
          </Text>
        </View>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
          className="p-2"
        >
          <Pencil size={16} color="#a8a29e" />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

// ── Skeleton ─────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-24 rounded bg-stone-800" />
      </View>
      <View className="px-4 mt-4">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-stone-800 rounded-xl p-4 mb-4">
            <Skeleton className="h-5 w-36 rounded bg-stone-700 mb-3" />
            <Skeleton className="h-4 w-full rounded bg-stone-700 mb-2" />
            <Skeleton className="h-4 w-2/3 rounded bg-stone-700" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Error State ──────────────────────────────────────────
function SettingsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AlertCircle size={48} color="#f87171" />
      <Text className="font-[Karla_700Bold] text-lg text-stone-200 mt-4 text-center">
        Something went wrong
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-stone-400 mt-2 text-center leading-5">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="mt-6 px-6 py-3 border border-stone-600 rounded-full"
      >
        <Text className="font-[Karla_600SemiBold] text-sm text-stone-300">Try again</Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────
export default function OwnerSettingsScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const { restaurant, restaurantId, isLoading, error, isEmpty, refetch } =
    useOwnerRestaurant(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const infoFormRef = useRef<BottomSheetModal>(null);
  const hoursFormRef = useRef<BottomSheetModal>(null);
  const deliveryFormRef = useRef<BottomSheetModal>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // ── State branching ──
  if (isLoading) return <SettingsSkeleton />;

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <SettingsErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (isEmpty || !restaurantId || !restaurant) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Store size={48} color="#57534e" />
          <Text className="font-[Karla_700Bold] text-lg text-stone-300 mt-4 text-center">
            No restaurant found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
            You need a restaurant to manage settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const coverUrl = getRestaurantImagePublicUrl(restaurant.coverImageUrl);
  const logoUrl = getRestaurantImagePublicUrl(restaurant.logoUrl);

  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text
          accessibilityRole="header"
          className="font-[Karla_700Bold] text-xl text-stone-100"
        >
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#dc2626"
          />
        }
      >
        {/* ── Restaurant Info Section ── */}
        <SectionCard
          title="Restaurant Info"
          icon={<Store size={18} color="#dc2626" />}
          onEdit={() => infoFormRef.current?.present()}
        >
          {/* Cover Photo */}
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: 120, borderRadius: 8 }}
              contentFit="cover"
              accessibilityLabel="Restaurant cover photo"
            />
          ) : (
            <View className="h-[120px] rounded-lg bg-stone-700 items-center justify-center">
              <Camera size={24} color="#78716c" />
              <Text className="font-[Karla_400Regular] text-xs text-stone-500 mt-1">
                No cover photo
              </Text>
            </View>
          )}

          {/* Logo + Name */}
          <View className="flex-row items-center mt-3">
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
                accessibilityLabel="Restaurant logo"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-stone-700 items-center justify-center">
                <Store size={16} color="#78716c" />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="font-[Karla_600SemiBold] text-sm text-stone-100">
                {restaurant.name}
              </Text>
              {restaurant.description ? (
                <Text
                  className="font-[Karla_400Regular] text-xs text-stone-400 mt-0.5"
                  numberOfLines={2}
                >
                  {restaurant.description}
                </Text>
              ) : null}
            </View>
          </View>
        </SectionCard>

        {/* ── Operating Hours Section ── */}
        <SectionCard
          title="Operating Hours"
          icon={<Clock size={18} color="#dc2626" />}
          onEdit={() => hoursFormRef.current?.present()}
        >
          {restaurant.operatingHours ? (
            DAY_ORDER.map((day) => {
              const schedule = restaurant.operatingHours?.[day];
              if (!schedule) return null;

              return (
                <View
                  key={day}
                  className="flex-row items-center justify-between py-1.5"
                  accessibilityLabel={`${DAY_LABELS[day]}: ${schedule.closed ? 'Closed' : `${schedule.open} to ${schedule.close}`}`}
                >
                  <Text className="font-[Karla_500Medium] text-xs text-stone-300 w-8">
                    {DAY_LABELS[day]}
                  </Text>
                  {schedule.closed ? (
                    <Text className="font-[Karla_400Regular] text-xs text-red-400">Closed</Text>
                  ) : (
                    <Text className="font-[Karla_400Regular] text-xs text-stone-400">
                      {schedule.open} – {schedule.close}
                    </Text>
                  )}
                </View>
              );
            })
          ) : (
            <Text className="font-[Karla_400Regular] text-xs text-stone-500">
              No hours set — tap edit to configure
            </Text>
          )}
        </SectionCard>

        {/* ── Delivery Settings Section ── */}
        <SectionCard
          title="Delivery Settings"
          icon={<Truck size={18} color="#dc2626" />}
          onEdit={() => deliveryFormRef.current?.present()}
        >
          <View className="flex-row justify-between py-1">
            <Text className="font-[Karla_400Regular] text-xs text-stone-400">Radius</Text>
            <Text className="font-[Karla_500Medium] text-xs text-stone-200">
              {restaurant.deliveryRadiusKm ?? 5} km
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="font-[Karla_400Regular] text-xs text-stone-400">Delivery Fee</Text>
            <Text className="font-[Karla_500Medium] text-xs text-stone-200">
              {restaurant.deliveryFee != null ? formatPrice(restaurant.deliveryFee) : 'Free'}
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="font-[Karla_400Regular] text-xs text-stone-400">Minimum Order</Text>
            <Text className="font-[Karla_500Medium] text-xs text-stone-200">
              {restaurant.minimumOrder != null && restaurant.minimumOrder > 0
                ? formatPrice(restaurant.minimumOrder)
                : 'None'}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>

      {/* Form Sheets */}
      <RestaurantInfoFormSheet
        ref={infoFormRef}
        restaurantId={restaurantId}
        restaurant={restaurant}
        onSaved={refetch}
      />

      <OperatingHoursFormSheet
        ref={hoursFormRef}
        restaurantId={restaurantId}
        operatingHours={restaurant.operatingHours}
        onSaved={refetch}
      />

      <DeliverySettingsFormSheet
        ref={deliveryFormRef}
        restaurantId={restaurantId}
        restaurant={restaurant}
        onSaved={refetch}
      />
    </SafeAreaView>
  );
}
