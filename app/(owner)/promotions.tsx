import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  AlertCircle,
  Calendar,
  Percent,
  Tag,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth-store';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import { fetchMenuByRestaurant } from '@/lib/api/menu';
import { togglePromotion, type Promotion } from '@/lib/api/owner-promotions';
import type { PromotionWithStats } from '@/lib/api/owner-promotions';
import { useOwnerPromotions } from '@/hooks/use-owner-promotions';
import { centimesToPrice } from '@/lib/schemas/menu-item';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PromotionFormSheet } from '@/components/owner/promotion-form-sheet';
import { FlashDealFormSheet } from '@/components/owner/flash-deal-form-sheet';

// ── Types ────────────────────────────────────────────────

type SimpleMenuItem = { id: string; name: string };
type TabKey = 'active' | 'history';

// ── Helpers ──────────────────────────────────────────────

function formatDiscount(type: string, value: number): string {
  return type === 'percentage' ? `${value}%` : `${centimesToPrice(value)} DA`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Tab Bar ─────────────────────────────────────────────

function PromotionTabBar({
  activeTab,
  activeCounts,
  onSelect,
}: {
  activeTab: TabKey;
  activeCounts: { active: number; history: number };
  onSelect: (tab: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'history', label: 'History' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="mb-3"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const count = activeCounts[tab.key];
        const color = isActive ? '#dc2626' : '#292524';

        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: color }}
          >
            <Text
              className="font-[Karla_600SemiBold] text-sm"
              style={{ color: isActive ? '#ffffff' : '#a8a29e' }}
            >
              {tab.label}
            </Text>
            {count > 0 && (
              <View
                className="ml-1.5 rounded-full px-1.5 min-w-[20px] items-center"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#44403c',
                }}
              >
                <Text
                  className="font-[Karla_600SemiBold] text-xs"
                  style={{ color: isActive ? '#ffffff' : '#a8a29e' }}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Promotion Card ───────────────────────────────────────

function PromotionCard({
  promotion,
  onEdit,
  onToggle,
  isHistory,
}: {
  promotion: PromotionWithStats;
  onEdit: (promo: Promotion) => void;
  onToggle: (promoId: string, isActive: boolean) => void;
  isHistory?: boolean;
}) {
  const statusColor = isHistory ? '#78716c' : '#22c55e';
  const statusLabel = isHistory ? 'Expired' : 'Active';

  return (
    <View className="bg-stone-800 rounded-xl p-4 mx-4">
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <Tag size={16} color="#ca8a04" />
          <Text
            className="font-[Karla_700Bold] text-base text-stone-100 ml-2"
            numberOfLines={1}
          >
            {promotion.name}
          </Text>
        </View>
        <View
          className="rounded-full px-2.5 py-0.5"
          style={{ backgroundColor: statusColor + '20' }}
        >
          <Text
            className="font-[Karla_600SemiBold] text-xs"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Discount badge */}
      <View className="flex-row items-center mb-2">
        <Percent size={14} color="#a8a29e" />
        <Text className="font-[Karla_600SemiBold] text-sm text-stone-300 ml-1">
          {formatDiscount(promotion.discount_type, promotion.discount_value)} off
        </Text>
      </View>

      {/* Date range */}
      <View className="flex-row items-center mb-3">
        <Calendar size={14} color="#a8a29e" />
        <Text className="font-[Karla_400Regular] text-xs text-stone-400 ml-1">
          {formatDate(promotion.start_date)} — {formatDate(promotion.end_date)}
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row bg-stone-700/50 rounded-lg p-2.5 mb-3">
        <View className="flex-1 items-center">
          <Text className="font-[Karla_700Bold] text-lg text-stone-100">
            {promotion.order_count}
          </Text>
          <Text className="font-[Karla_400Regular] text-xs text-stone-400">
            Orders
          </Text>
        </View>
        <View className="w-px bg-stone-600 mx-2" />
        <View className="flex-1 items-center">
          <Text className="font-[Karla_700Bold] text-lg text-stone-100">
            {promotion.total_revenue > 0
              ? `${centimesToPrice(promotion.total_revenue)} DA`
              : '—'}
          </Text>
          <Text className="font-[Karla_400Regular] text-xs text-stone-400">
            Revenue
          </Text>
        </View>
        {isHistory && (
          <>
            <View className="w-px bg-stone-600 mx-2" />
            <View className="flex-1 items-center">
              <Text className="font-[Karla_700Bold] text-lg text-stone-100">
                {promotion.discount_type === 'fixed' && promotion.order_count > 0
                  ? `${centimesToPrice(promotion.discount_value * promotion.order_count)} DA`
                  : '—'}
              </Text>
              <Text className="font-[Karla_400Regular] text-xs text-stone-400">
                Discount cost
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Actions — only for active tab */}
      {!isHistory && (
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => onToggle(promotion.id, !promotion.is_active)}
            accessibilityRole="button"
            accessibilityLabel={promotion.is_active ? 'Deactivate promotion' : 'Activate promotion'}
            className="flex-row items-center"
          >
            {promotion.is_active ? (
              <ToggleRight size={18} color="#22c55e" />
            ) : (
              <ToggleLeft size={18} color="#78716c" />
            )}
            <Text
              className="font-[Karla_600SemiBold] text-xs ml-1"
              style={{ color: promotion.is_active ? '#22c55e' : '#78716c' }}
            >
              {promotion.is_active ? 'Active' : 'Inactive'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onEdit(promotion)}
            accessibilityRole="button"
            accessibilityLabel="Edit promotion"
            className="flex-row items-center ml-auto"
          >
            <Text className="font-[Karla_600SemiBold] text-xs" style={{ color: '#ca8a04' }}>
              Edit
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Skeleton ─────────────────────────────────────────────

function PromotionsSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Skeleton className="h-7 w-28 rounded bg-stone-800" />
        <View className="flex-row gap-2">
          <Skeleton className="h-9 w-28 rounded-full bg-stone-800" />
          <Skeleton className="h-9 w-24 rounded-full bg-stone-800" />
        </View>
      </View>
      <View className="flex-row gap-2 px-4 mb-3">
        <Skeleton className="h-8 w-20 rounded-full bg-stone-800" />
        <Skeleton className="h-8 w-20 rounded-full bg-stone-800" />
      </View>
      <View className="gap-3 mt-2">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-stone-800 rounded-xl p-4 mx-4">
            <Skeleton className="h-5 w-40 rounded bg-stone-700 mb-3" />
            <Skeleton className="h-4 w-24 rounded bg-stone-700 mb-2" />
            <Skeleton className="h-4 w-32 rounded bg-stone-700 mb-3" />
            <Skeleton className="h-12 w-full rounded-lg bg-stone-700" />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Error State ──────────────────────────────────────────

function PromotionsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

// ── Separator ────────────────────────────────────────────

function CardSeparator() {
  return <View className="h-3" />;
}

// ── Main Screen ──────────────────────────────────────────

export default function OwnerPromotionsScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<SimpleMenuItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('active');

  // Form sheet state
  const formSheetRef = useRef<BottomSheetModal>(null);
  const flashDealSheetRef = useRef<BottomSheetModal>(null);
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);
  const [formNonce, setFormNonce] = useState(0);
  const [flashNonce, setFlashNonce] = useState(0);

  function handleCreate() {
    setEditPromotion(null);
    setFormNonce((n) => n + 1);
    formSheetRef.current?.present();
  }

  function handleFlashDeal() {
    setFlashNonce((n) => n + 1);
    flashDealSheetRef.current?.present();
  }

  function handleEdit(promo: Promotion) {
    setEditPromotion(promo);
    setFormNonce((n) => n + 1);
    formSheetRef.current?.present();
  }

  async function handleToggle(promoId: string, isActive: boolean) {
    try {
      await togglePromotion(promoId, isActive);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleSaved() {
    refetch();
  }

  // Resolve restaurantId + menu items
  useEffect(() => {
    if (!userId) {
      setInitLoading(false);
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        const rid = await fetchOwnerRestaurantId(userId);
        if (!cancelled && rid) {
          setRestaurantId(rid);

          const categories = await fetchMenuByRestaurant(rid);
          const items: SimpleMenuItem[] = [];
          for (const cat of categories) {
            if (Array.isArray(cat.items)) {
              for (const item of cat.items) {
                if (item.deleted_at === null && item.is_available) {
                  items.push({ id: item.id, name: item.name });
                }
              }
            }
          }
          if (!cancelled) {
            setMenuItems(items);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setInitError(e instanceof Error ? e : new Error('Failed to load restaurant'));
        }
      } finally {
        if (!cancelled) {
          setInitLoading(false);
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [userId]);

  const {
    activePromotions,
    historyPromotions,
    isLoading: promosLoading,
    error: promosError,
    refetch,
  } = useOwnerPromotions(restaurantId ?? '');

  // Refetch on tab focus (skip first mount)
  const isFirstFocusRef = useRef(true);
  useFocusEffect(() => {
    if (isFirstFocusRef.current) {
      isFirstFocusRef.current = false;
      return;
    }
    if (restaurantId) {
      refetch();
    }
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // Current tab data
  const currentData = activeTab === 'active' ? activePromotions : historyPromotions;
  const isHistory = activeTab === 'history';

  // ── State branching ──

  if (initLoading || (restaurantId && promosLoading)) {
    return <PromotionsSkeleton />;
  }

  if (initError) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <PromotionsErrorState
          message={initError.message}
          onRetry={() => {
            setInitError(null);
            setInitLoading(true);
          }}
        />
      </SafeAreaView>
    );
  }

  if (promosError) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <PromotionsErrorState message={promosError.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!restaurantId) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Tag size={48} color="#57534e" />
          <Text className="font-[Karla_700Bold] text-lg text-stone-300 mt-4 text-center">
            No restaurant found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
            You need a restaurant to manage promotions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text
          accessibilityRole="header"
          className="font-[Karla_700Bold] text-xl text-stone-100"
        >
          Promotions
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleFlashDeal}
            accessibilityRole="button"
            accessibilityLabel="Create flash deal"
            className="rounded-full px-3 py-2 flex-row items-center"
            style={{ backgroundColor: '#d97706' }}
          >
            <Zap size={14} color="#ffffff" />
            <Text className="font-[Karla_600SemiBold] text-sm text-white ml-1">
              Flash Deal
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCreate}
            accessibilityRole="button"
            accessibilityLabel="Create promotion"
            className="bg-red-600 rounded-full px-4 py-2"
          >
            <Text className="font-[Karla_600SemiBold] text-sm text-white">
              + Create
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tab Bar */}
      <PromotionTabBar
        activeTab={activeTab}
        activeCounts={{
          active: activePromotions.length,
          history: historyPromotions.length,
        }}
        onSelect={setActiveTab}
      />

      {/* Promotions List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PromotionCard
            promotion={item}
            onEdit={handleEdit}
            onToggle={handleToggle}
            isHistory={isHistory}
          />
        )}
        ItemSeparatorComponent={CardSeparator}
        ListEmptyComponent={
          <EmptyState
            type={isHistory ? 'promotion_history' : 'promotions'}
            onCta={isHistory ? undefined : handleCreate}
          />
        }
        contentContainerStyle={
          currentData.length === 0
            ? { flexGrow: 1 }
            : { paddingTop: 4, paddingBottom: 24 }
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#dc2626"
          />
        }
      />

      {/* Promotion Form Sheet */}
      <PromotionFormSheet
        ref={formSheetRef}
        restaurantId={restaurantId}
        menuItems={menuItems}
        editPromotion={editPromotion}
        nonce={formNonce}
        onSaved={handleSaved}
      />

      {/* Flash Deal Form Sheet */}
      <FlashDealFormSheet
        ref={flashDealSheetRef}
        restaurantId={restaurantId}
        menuItems={menuItems}
        nonce={flashNonce}
        onSaved={handleSaved}
      />
    </SafeAreaView>
  );
}
