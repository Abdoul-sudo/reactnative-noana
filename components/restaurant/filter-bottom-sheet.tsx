import { forwardRef, useState, type ComponentProps } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { CUISINE_CATEGORIES } from '@/constants/cuisines';
import { type ListingFilters } from '@/hooks/use-restaurant-listing';

type FilterBottomSheetProps = {
  currentFilters: ListingFilters;
  onApply: (filters: ListingFilters) => void;
  onClear: () => void;
};

const PRICE_OPTIONS = ['$', '$$', '$$$'];
const RATING_OPTIONS = [
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];
const DELIVERY_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

/**
 * Filter bottom sheet for restaurant listing (AR31 — first use of @gorhom/bottom-sheet).
 *
 * Pattern: forwardRef so parent controls open/close via ref.
 * State is local to the sheet — changes are applied to parent only on "Apply" tap.
 *
 * Uses: BottomSheetModal with snapPoints ['50%', '80%'], backdrop dimming, pan-to-dismiss.
 */
export const FilterBottomSheet = forwardRef<BottomSheetModal, FilterBottomSheetProps>(
  function FilterBottomSheet({ currentFilters, onApply, onClear }, ref) {
    // Local state mirrors parent filters — only pushed up on "Apply"
    const [cuisine, setCuisine] = useState(currentFilters.cuisine);
    const [priceRange, setPriceRange] = useState(currentFilters.priceRange);
    const [minRating, setMinRating] = useState(currentFilters.minRating);
    const [maxDeliveryTime, setMaxDeliveryTime] = useState(currentFilters.maxDeliveryTime);

    // Sync local state when the sheet opens with new parent filters
    function handleSheetChange(index: number) {
      if (index >= 0) {
        setCuisine(currentFilters.cuisine);
        setPriceRange(currentFilters.priceRange);
        setMinRating(currentFilters.minRating);
        setMaxDeliveryTime(currentFilters.maxDeliveryTime);
      }
    }

    function handleApply() {
      onApply({ cuisine, priceRange, minRating, maxDeliveryTime });
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    function handleClear() {
      setCuisine(undefined);
      setPriceRange(undefined);
      setMinRating(undefined);
      setMaxDeliveryTime(undefined);
      onClear();
      if (ref && 'current' in ref && ref.current) {
        ref.current.dismiss();
      }
    }

    function renderBackdrop(props: ComponentProps<typeof BottomSheetBackdrop>) {
      return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />;
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['50%', '80%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onChange={handleSheetChange}
      >
        <BottomSheetView className="flex-1 px-4 pb-8">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ── Cuisine type ─────────────────────────────── */}
            <Text
              accessibilityRole="header"
              className="font-[Karla_700Bold] text-base text-gray-900 mb-2"
            >
              Cuisine
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CUISINE_CATEGORIES.map(cat => {
                const active = cuisine === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCuisine(active ? undefined : cat.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cat.label} cuisine, ${active ? 'selected' : 'not selected'}`}
                    accessibilityState={{ selected: active }}
                    className={
                      active
                        ? 'px-4 py-2.5 rounded-full bg-red-600'
                        : 'px-4 py-2.5 rounded-full border border-gray-300'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'font-[Karla_600SemiBold] text-sm text-white'
                          : 'font-[Karla_600SemiBold] text-sm text-gray-600'
                      }
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Price range ──────────────────────────────── */}
            <Text
              accessibilityRole="header"
              className="font-[Karla_700Bold] text-base text-gray-900 mb-2"
            >
              Price Range
            </Text>
            <View className="flex-row gap-2 mb-4">
              {PRICE_OPTIONS.map(price => {
                const active = priceRange === price;
                return (
                  <Pressable
                    key={price}
                    onPress={() => setPriceRange(active ? undefined : price)}
                    accessibilityRole="button"
                    accessibilityLabel={`Price ${price}, ${active ? 'selected' : 'not selected'}`}
                    accessibilityState={{ selected: active }}
                    className={
                      active
                        ? 'px-4 py-2.5 rounded-full bg-red-600'
                        : 'px-4 py-2.5 rounded-full border border-gray-300'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'font-[Karla_600SemiBold] text-sm text-white'
                          : 'font-[Karla_600SemiBold] text-sm text-gray-600'
                      }
                    >
                      {price}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Minimum rating ───────────────────────────── */}
            <Text
              accessibilityRole="header"
              className="font-[Karla_700Bold] text-base text-gray-900 mb-2"
            >
              Minimum Rating
            </Text>
            <View className="flex-row gap-2 mb-4">
              {RATING_OPTIONS.map(opt => {
                const active = minRating === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMinRating(active ? undefined : opt.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Minimum rating ${opt.label}, ${active ? 'selected' : 'not selected'}`}
                    accessibilityState={{ selected: active }}
                    className={
                      active
                        ? 'px-4 py-2.5 rounded-full bg-red-600'
                        : 'px-4 py-2.5 rounded-full border border-gray-300'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'font-[Karla_600SemiBold] text-sm text-white'
                          : 'font-[Karla_600SemiBold] text-sm text-gray-600'
                      }
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Max delivery time ────────────────────────── */}
            <Text
              accessibilityRole="header"
              className="font-[Karla_700Bold] text-base text-gray-900 mb-2"
            >
              Max Delivery Time
            </Text>
            <View className="flex-row gap-2 mb-6">
              {DELIVERY_OPTIONS.map(opt => {
                const active = maxDeliveryTime === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMaxDeliveryTime(active ? undefined : opt.value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Max delivery ${opt.label}, ${active ? 'selected' : 'not selected'}`}
                    accessibilityState={{ selected: active }}
                    className={
                      active
                        ? 'px-4 py-2.5 rounded-full bg-red-600'
                        : 'px-4 py-2.5 rounded-full border border-gray-300'
                    }
                  >
                    <Text
                      className={
                        active
                          ? 'font-[Karla_600SemiBold] text-sm text-white'
                          : 'font-[Karla_600SemiBold] text-sm text-gray-600'
                      }
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Action buttons ─────────────────────────────── */}
          <View className="flex-row gap-3 pt-4 border-t border-gray-200">
            <Pressable
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              className="flex-1 py-3 border border-gray-300 rounded-full items-center"
            >
              <Text className="font-[Karla_600SemiBold] text-sm text-gray-700">
                Clear
              </Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              className="flex-1 py-3 bg-red-600 rounded-full items-center"
            >
              <Text className="font-[Karla_600SemiBold] text-sm text-white">
                Apply
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
