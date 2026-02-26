import { FlatList, ScrollView, View, Text, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import { CartesianChart, Area, Line, PolarChart, Pie } from 'victory-native';
import { LinearGradient, vec, useFont } from '@shopify/react-native-skia';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerDashboard } from '@/hooks/use-owner-dashboard';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { type OrderStats, type TopDish } from '@/lib/api/owner-analytics';

const CHART_COLORS = {
  lineStroke: '#dc2626',
  areaGradientTop: '#dc262660',
  areaGradientBottom: '#dc262605',
  axisLine: '#44403c',
  axisLabel: '#a8a29e',
  placed: '#60a5fa',
  confirmed: '#facc15',
  preparing: '#fb923c',
  onTheWay: '#a78bfa',
  delivered: '#4ade80',
  cancelled: '#f87171',
} as const;

type StatusKey = 'placed' | 'confirmed' | 'preparing' | 'onTheWay' | 'delivered' | 'cancelled';

const STATUS_LEGEND: ReadonlyArray<{ key: StatusKey; label: string; color: string }> = [
  { key: 'placed', label: 'Placed', color: CHART_COLORS.placed },
  { key: 'confirmed', label: 'Confirmed', color: CHART_COLORS.confirmed },
  { key: 'preparing', label: 'Preparing', color: CHART_COLORS.preparing },
  { key: 'onTheWay', label: 'On the Way', color: CHART_COLORS.onTheWay },
  { key: 'delivered', label: 'Delivered', color: CHART_COLORS.delivered },
  { key: 'cancelled', label: 'Cancelled', color: CHART_COLORS.cancelled },
];

function getStatusCount(stats: OrderStats, key: StatusKey): number {
  return stats[key];
}

// ── Revenue card with trend arrow + percentage ────────────
type RevenueCardProps = {
  title: string;
  amount: number;
  previousAmount: number;
};

function RevenueCard({ title, amount, previousAmount }: RevenueCardProps) {
  const hasData = amount > 0 || previousAmount > 0;
  const trend = !hasData ? 'neutral' : amount >= previousAmount ? 'up' : 'down';
  const trendColor = trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : '#a8a29e';
  const Icon = trend === 'down' ? TrendingDown : TrendingUp;

  const pctChange = previousAmount > 0
    ? Math.round(((amount - previousAmount) / previousAmount) * 100)
    : amount > 0 ? 100 : 0;

  return (
    <View
      className="bg-stone-800 rounded-xl p-4 flex-1"
      accessibilityLabel={`${title}: ${formatPrice(amount)}, ${trend === 'up' ? 'up' : 'down'} ${Math.abs(pctChange)} percent`}
      accessibilityRole="summary"
    >
      <Text className="font-[Karla_400Regular] text-xs text-stone-400">{title}</Text>
      <Text className="font-[Karla_700Bold] text-lg text-stone-100 mt-1">
        {formatPrice(amount)}
      </Text>
      <View className="flex-row items-center mt-1">
        <Icon size={12} color={trendColor} />
        <Text style={{ color: trendColor }} className="font-[Karla_600SemiBold] text-xs ml-1">
          {pctChange >= 0 ? '+' : ''}{pctChange}%
        </Text>
      </View>
    </View>
  );
}

// ── Dark skeleton loader ──────────────────────────────────
function DashboardSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-32 rounded bg-stone-800" />
      </View>
      <View className="flex-row gap-x-3 px-4 mt-4">
        <Skeleton className="flex-1 h-24 rounded-xl bg-stone-800" />
        <Skeleton className="flex-1 h-24 rounded-xl bg-stone-800" />
        <Skeleton className="flex-1 h-24 rounded-xl bg-stone-800" />
      </View>
      <View className="px-4 mt-6">
        <Skeleton className="h-5 w-40 rounded bg-stone-800" />
        <Skeleton className="h-52 w-full rounded-xl bg-stone-800 mt-3" />
      </View>
      <View className="px-4 mt-6">
        <Skeleton className="h-5 w-36 rounded bg-stone-800" />
        <Skeleton className="h-52 w-full rounded-xl bg-stone-800 mt-3" />
      </View>
      <View className="px-4 mt-6">
        <Skeleton className="h-5 w-28 rounded bg-stone-800" />
        <View className="bg-stone-800 rounded-xl mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="flex-row items-center px-4 py-3">
              <Skeleton className="h-5 w-5 rounded bg-stone-700" />
              <Skeleton className="h-4 w-32 rounded bg-stone-700 ml-2" />
              <View className="flex-1" />
              <Skeleton className="h-3 w-12 rounded bg-stone-700 mr-3" />
              <Skeleton className="h-4 w-16 rounded bg-stone-700" />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Dark empty state (ghosted cards) ──────────────────────
function DashboardEmptyState() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text
          accessibilityRole="header"
          className="font-[Karla_700Bold] text-xl text-stone-100"
        >
          Dashboard
        </Text>
      </View>
      <View className="flex-row gap-x-3 px-4 mt-4">
        {['Today', 'This Week', 'This Month'].map((label) => (
          <View key={label} className="bg-stone-800 rounded-xl p-4 flex-1 opacity-50">
            <Text className="font-[Karla_400Regular] text-xs text-stone-400">{label}</Text>
            <Text className="font-[Karla_700Bold] text-lg text-stone-500 mt-1">0 DA</Text>
          </View>
        ))}
      </View>
      <View className="items-center justify-center px-8 mt-16">
        <Text className="font-[Karla_700Bold] text-lg text-stone-300 text-center">
          Your first order is around the corner!
        </Text>
        <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
          Revenue and order charts will appear here once you start receiving orders.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ── Dark error state ──────────────────────────────────────
function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
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
    </SafeAreaView>
  );
}

function DishSeparator() {
  return <View className="h-px bg-stone-700 mx-4" />;
}

// ── Top dish leaderboard row ──────────────────────────────
function TopDishRow({ dish, rank }: { dish: TopDish; rank: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View
      className="flex-row items-center px-4 py-3"
      accessibilityLabel={`Rank ${rank}: ${dish.name}, ${dish.totalQuantity} sold, ${formatPrice(dish.totalRevenue)}`}
      accessibilityRole="summary"
    >
      <View className="w-8 items-center">
        {medal ? (
          <Text className="text-base">{medal}</Text>
        ) : (
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-500">{rank}</Text>
        )}
      </View>
      <Text className="font-[Karla_600SemiBold] text-sm text-stone-100 flex-1 ml-2" numberOfLines={1}>
        {dish.name}
      </Text>
      <Text className="font-[Karla_400Regular] text-xs text-stone-400 mr-3">
        {dish.totalQuantity} sold
      </Text>
      <Text className="font-[Karla_700Bold] text-sm text-stone-100">
        {formatPrice(dish.totalRevenue)}
      </Text>
    </View>
  );
}

// ── Main dashboard screen ─────────────────────────────────
export default function OwnerDashboardScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const { summary, chartData, orderStats, topDishes, isLoading, error, isEmpty, refetch } =
    useOwnerDashboard(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const font = useFont(
    require('@expo-google-fonts/karla/400Regular/Karla_400Regular.ttf'),
    12,
  );

  // Refetch on tab focus (skip first mount to avoid double-fetch)
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // ── State branching: Loading → Error → Empty → Content ──
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState message={error.message} onRetry={refetch} />;
  if (isEmpty || !summary || !orderStats) return <DashboardEmptyState />;

  // Build donut chart data (only statuses with count > 0)
  const donutData = STATUS_LEGEND
    .filter((s) => getStatusCount(orderStats, s.key) > 0)
    .map((s) => ({
      label: s.label,
      value: getStatusCount(orderStats, s.key),
      color: s.color,
    }));

  const timeframeLabel = orderStats.timeframe === 'today' ? "Today's Orders" : "This Month's Orders";

  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
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
        {/* ── Header ─────────────────────────────────────── */}
        <View className="px-4 pt-4 pb-2">
          <Text
            accessibilityRole="header"
            className="font-[Karla_700Bold] text-xl text-stone-100"
          >
            Dashboard
          </Text>
        </View>

        {/* ── Revenue cards ──────────────────────────────── */}
        <View className="flex-row gap-x-3 px-4 mt-2">
          <RevenueCard title="Today" amount={summary.today} previousAmount={summary.yesterday} />
          <RevenueCard title="This Week" amount={summary.thisWeek} previousAmount={summary.lastWeek} />
          <RevenueCard title="This Month" amount={summary.thisMonth} previousAmount={summary.lastMonth} />
        </View>

        {/* ── Revenue area chart ─────────────────────────── */}
        <View className="px-4 mt-6">
          <Text className="font-[Karla_700Bold] text-base text-stone-100 mb-3">
            Revenue (30 days)
          </Text>
          <View className="bg-stone-800 rounded-xl p-3" style={{ height: 220 }}>
            {font && chartData.length > 0 ? (
              <CartesianChart
                data={chartData}
                xKey="day"
                yKeys={['revenue']}
                xAxis={{ font, lineColor: CHART_COLORS.axisLine, labelColor: CHART_COLORS.axisLabel }}
                yAxis={[{ font, lineColor: CHART_COLORS.axisLine, labelColor: CHART_COLORS.axisLabel }]}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Area
                      points={points.revenue}
                      y0={chartBounds.bottom}
                      curveType="natural"
                      animate={{ type: 'timing', duration: 500 }}
                    >
                      <LinearGradient
                        start={vec(0, chartBounds.top)}
                        end={vec(0, chartBounds.bottom)}
                        colors={[CHART_COLORS.areaGradientTop, CHART_COLORS.areaGradientBottom]}
                      />
                    </Area>
                    <Line
                      points={points.revenue}
                      color={CHART_COLORS.lineStroke}
                      strokeWidth={2}
                      curveType="natural"
                      animate={{ type: 'timing', duration: 500 }}
                    />
                  </>
                )}
              </CartesianChart>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="font-[Karla_400Regular] text-sm text-stone-500">
                  No chart data available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Orders donut chart ─────────────────────────── */}
        <View className="px-4 mt-6">
          <View className="flex-row items-baseline justify-between mb-3">
            <Text className="font-[Karla_700Bold] text-base text-stone-100">
              {timeframeLabel}
            </Text>
            <Text className="font-[Karla_600SemiBold] text-sm text-stone-400">
              {orderStats.total} total
            </Text>
          </View>
          <View className="bg-stone-800 rounded-xl p-3" style={{ height: 220 }}>
            {donutData.length > 0 ? (
              <PolarChart
                data={donutData}
                labelKey="label"
                valueKey="value"
                colorKey="color"
              >
                <Pie.Chart innerRadius="50%" startAngle={-90} />
              </PolarChart>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="font-[Karla_400Regular] text-sm text-stone-500">
                  No orders yet
                </Text>
              </View>
            )}
          </View>

          {/* ── Custom legend ────────────────────────────── */}
          <View className="flex-row flex-wrap mt-3 gap-x-4 gap-y-2">
            {STATUS_LEGEND.map((item) => {
              const count = getStatusCount(orderStats, item.key);
              if (count === 0) return null;
              return (
                <View key={item.key} className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: item.color }} />
                  <Text className="font-[Karla_400Regular] text-xs text-stone-400">
                    {item.label} ({count})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Top Dishes leaderboard ──────────────────────── */}
        <View className="px-4 mt-6 mb-6">
          <Text accessibilityRole="header" className="font-[Karla_700Bold] text-base text-stone-100 mb-3">
            Top Dishes
          </Text>
          {topDishes.length > 0 ? (
            <View className="bg-stone-800 rounded-xl overflow-hidden">
              <FlatList
                data={topDishes}
                keyExtractor={(item) => item.menuItemId}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <TopDishRow dish={item} rank={index + 1} />
                )}
                ItemSeparatorComponent={DishSeparator}
              />
            </View>
          ) : (
            <View className="bg-stone-800 rounded-xl py-8 items-center">
              <Text className="font-[Karla_400Regular] text-sm text-stone-500">
                No dish data yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
