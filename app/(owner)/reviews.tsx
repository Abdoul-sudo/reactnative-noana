import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Minus,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerReviews } from '@/hooks/use-owner-reviews';
import { fetchOwnerRestaurantId } from '@/lib/api/owner-analytics';
import type { RatingTrend } from '@/lib/api/owner-reviews';
import type { ReviewWithProfile } from '@/lib/api/reviews';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ReplySheet } from '@/components/owner/reply-sheet';

// ── Rating Filter Config ────────────────────────────────

const RATING_FILTERS: ReadonlyArray<{ rating: number; label: string }> = [
  { rating: 0, label: 'All' },
  { rating: 5, label: '5\u2605' },
  { rating: 4, label: '4\u2605' },
  { rating: 3, label: '3\u2605' },
  { rating: 2, label: '2\u2605' },
  { rating: 1, label: '1\u2605' },
] as const;

// ── Helpers ─────────────────────────────────────────────

function getRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Rating Trend Card ───────────────────────────────────

function RatingTrendCard({ trend }: { trend: RatingTrend | null }) {
  if (!trend) return null;

  const current = trend.current_avg;
  const previous = trend.previous_avg;
  const delta = Number((current - previous).toFixed(1));

  let TrendIcon = Minus;
  let trendColor = '#a8a29e'; // stone-400
  let deltaLabel = 'No change';

  if (delta > 0) {
    TrendIcon = TrendingUp;
    trendColor = '#22c55e'; // green-500
    deltaLabel = `+${delta}`;
  } else if (delta < 0) {
    TrendIcon = TrendingDown;
    trendColor = '#ef4444'; // red-500
    deltaLabel = `${delta}`;
  }

  return (
    <View
      className="bg-stone-800 rounded-xl p-4 mx-4 mb-3"
      accessibilityRole="summary"
      accessibilityLabel={`Average rating ${current} out of 5, ${deltaLabel} compared to previous period`}
    >
      <Text className="font-[Karla_400Regular] text-xs text-stone-400 mb-2">
        Last 30 days
      </Text>
      <View className="flex-row items-center">
        <Text className="font-[Karla_700Bold] text-3xl text-stone-100 mr-2">
          {current > 0 ? current.toFixed(1) : '—'}
        </Text>
        <Star size={20} color="#ca8a04" fill="#ca8a04" />
        {current > 0 && (
          <View className="flex-row items-center ml-4">
            <TrendIcon size={16} color={trendColor} />
            <Text
              className="font-[Karla_600SemiBold] text-sm ml-1"
              style={{ color: trendColor }}
            >
              {deltaLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Rating Filter Bar ───────────────────────────────────

function RatingFilterBar({
  activeFilter,
  counts,
  onSelect,
}: {
  activeFilter: number;
  counts: Record<number, number>;
  onSelect: (rating: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="mb-3"
    >
      {RATING_FILTERS.map((filter) => {
        const isActive = filter.rating === activeFilter;
        const count = filter.rating === 0
          ? Object.values(counts).reduce((sum, c) => sum + c, 0)
          : counts[filter.rating] ?? 0;

        return (
          <Pressable
            key={filter.rating}
            onPress={() => onSelect(filter.rating)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${filter.label} filter, ${count} reviews`}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: isActive ? '#ca8a04' : '#292524' }}
          >
            <Text
              className="font-[Karla_600SemiBold] text-xs"
              style={{ color: isActive ? '#1c1917' : '#a8a29e' }}
            >
              {filter.label}
            </Text>
            {count > 0 && (
              <View
                className="ml-1.5 rounded-full px-1.5 min-w-[18px] items-center"
                style={{ backgroundColor: isActive ? '#1c191740' : '#44403c' }}
              >
                <Text
                  className="font-[Karla_700Bold] text-[10px]"
                  style={{ color: isActive ? '#1c1917' : '#d6d3d1' }}
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

// ── Review Card ─────────────────────────────────────────

function ReviewCard({
  review,
  onReply,
}: {
  review: ReviewWithProfile;
  onReply: (reviewId: string, existingReply: string | null) => void;
}) {
  const displayName =
    review.profiles != null &&
    typeof review.profiles === 'object' &&
    'display_name' in review.profiles &&
    typeof review.profiles.display_name === 'string'
      ? review.profiles.display_name
      : 'Anonymous';

  const avatarUrl =
    review.profiles != null &&
    typeof review.profiles === 'object' &&
    'avatar_url' in review.profiles &&
    typeof review.profiles.avatar_url === 'string'
      ? review.profiles.avatar_url
      : null;

  const ownerReply =
    typeof review.owner_reply === 'string' ? review.owner_reply : null;

  const ownerReplyAt =
    typeof review.owner_reply_at === 'string' ? review.owner_reply_at : null;

  return (
    <View className="bg-stone-800 rounded-xl p-4 mx-4">
      <View className="flex-row items-start">
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            source={avatarUrl}
            style={{ width: 36, height: 36, borderRadius: 18 }}
            contentFit="cover"
            accessibilityLabel={`${displayName} avatar`}
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-stone-700 items-center justify-center">
            <Text className="font-[Karla_700Bold] text-xs text-stone-300">
              {getInitials(displayName)}
            </Text>
          </View>
        )}

        {/* Name, rating, date, comment */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-[Karla_600SemiBold] text-sm text-stone-100">
              {displayName}
            </Text>
            <Text className="font-[Karla_400Regular] text-xs text-stone-500">
              {review.created_at ? getRelativeDate(review.created_at) : ''}
            </Text>
          </View>

          {/* Star rating */}
          <View className="flex-row mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={12}
                color={star <= review.rating ? '#ca8a04' : '#44403c'}
                fill={star <= review.rating ? '#ca8a04' : 'transparent'}
              />
            ))}
          </View>

          {/* Comment */}
          {review.comment && (
            <Text className="font-[Karla_400Regular] text-sm text-stone-300 mt-1.5">
              {review.comment}
            </Text>
          )}

          {/* Owner reply */}
          {ownerReply && (
            <View className="mt-3 bg-stone-700/50 rounded-lg p-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-[Karla_600SemiBold] text-xs text-stone-400">
                  Owner reply
                </Text>
                {ownerReplyAt && (
                  <Text className="font-[Karla_400Regular] text-xs text-stone-500">
                    {getRelativeDate(ownerReplyAt)}
                  </Text>
                )}
              </View>
              <Text className="font-[Karla_400Regular] text-sm text-stone-300">
                {ownerReply}
              </Text>
            </View>
          )}

          {/* Reply / Edit reply button */}
          <Pressable
            onPress={() => onReply(review.id, ownerReply)}
            accessibilityRole="button"
            accessibilityLabel={ownerReply ? 'Edit reply' : 'Reply to review'}
            className="flex-row items-center mt-2"
          >
            <MessageSquare size={14} color="#ca8a04" />
            <Text className="font-[Karla_600SemiBold] text-xs ml-1" style={{ color: '#ca8a04' }}>
              {ownerReply ? 'Edit reply' : 'Reply'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Skeleton ────────────────────────────────────────────

function ReviewsSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-24 rounded bg-stone-800" />
      </View>
      {/* Trend card skeleton */}
      <View className="bg-stone-800 rounded-xl p-4 mx-4 mb-3">
        <Skeleton className="h-3 w-20 rounded bg-stone-700 mb-3" />
        <Skeleton className="h-8 w-28 rounded bg-stone-700" />
      </View>
      {/* Filter bar skeleton */}
      <View className="flex-row px-4 mb-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-8 w-14 rounded-full bg-stone-800" />
        ))}
      </View>
      {/* Review card skeletons */}
      <View className="gap-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="bg-stone-800 rounded-xl p-4 mx-4">
            <View className="flex-row items-start">
              <Skeleton className="w-9 h-9 rounded-full bg-stone-700" />
              <View className="flex-1 ml-3">
                <Skeleton className="h-4 w-24 rounded bg-stone-700 mb-2" />
                <Skeleton className="h-3 w-16 rounded bg-stone-700 mb-2" />
                <Skeleton className="h-3 w-48 rounded bg-stone-700" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Error State ─────────────────────────────────────────

function ReviewsErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

// ── Separator ───────────────────────────────────────────

function CardSeparator() {
  return <View className="h-3" />;
}

// ── Main Screen ─────────────────────────────────────────

export default function OwnerReviewsScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);

  // Reply sheet state
  const replySheetRef = useRef<BottomSheetModal>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [selectedExistingReply, setSelectedExistingReply] = useState<string | null>(null);
  const [replyNonce, setReplyNonce] = useState(0);

  function handleOpenReply(reviewId: string, existingReply: string | null) {
    setSelectedReviewId(reviewId);
    setSelectedExistingReply(existingReply);
    setReplyNonce((n) => n + 1);
    replySheetRef.current?.present();
  }

  function handleReplySuccess() {
    refetch();
  }

  // Resolve restaurantId from userId (same pattern as use-owner-orders)
  useEffect(() => {
    if (!userId) {
      setInitLoading(false);
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        const rid = await fetchOwnerRestaurantId(userId);
        if (!cancelled) {
          setRestaurantId(rid);
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

  // Only call the hook when restaurantId is available
  const {
    reviews,
    allReviews,
    ratingTrend,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch,
  } = useOwnerReviews(restaurantId ?? '', ratingFilter);

  // Compute per-rating counts from ALL reviews (not filtered) for filter badges
  const ratingCounts: Record<number, number> = {};
  for (const r of allReviews) {
    ratingCounts[r.rating] = (ratingCounts[r.rating] ?? 0) + 1;
  }

  // Refetch on tab focus (skip first mount)
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      if (restaurantId) {
        refetch();
      }
    }, [refetch, restaurantId]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  // ── State branching ──

  if (initLoading || (restaurantId && reviewsLoading)) {
    return <ReviewsSkeleton />;
  }

  if (initError) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <ReviewsErrorState
          message={initError.message}
          onRetry={() => {
            setInitError(null);
            setInitLoading(true);
          }}
        />
      </SafeAreaView>
    );
  }

  if (reviewsError) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <ReviewsErrorState message={reviewsError.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (!restaurantId) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Star size={48} color="#57534e" />
          <Text className="font-[Karla_700Bold] text-lg text-stone-300 mt-4 text-center">
            No restaurant found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
            You need a restaurant to view reviews.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      {/* Header with back button */}
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 p-1"
        >
          <ArrowLeft size={24} color="#f5f5f4" />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="font-[Karla_700Bold] text-xl text-stone-100"
        >
          Reviews
        </Text>
      </View>

      {/* Rating Trend */}
      <RatingTrendCard trend={ratingTrend} />

      {/* Rating Filters */}
      <RatingFilterBar
        activeFilter={ratingFilter}
        counts={ratingCounts}
        onSelect={setRatingFilter}
      />

      {/* Reviews List */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} onReply={handleOpenReply} />}
        ItemSeparatorComponent={CardSeparator}
        ListEmptyComponent={<EmptyState type="owner_reviews_empty" />}
        contentContainerStyle={
          reviews.length === 0
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

      {/* Reply Bottom Sheet */}
      <ReplySheet
        ref={replySheetRef}
        reviewId={selectedReviewId}
        existingReply={selectedExistingReply}
        nonce={replyNonce}
        onSuccess={handleReplySuccess}
      />
    </SafeAreaView>
  );
}
