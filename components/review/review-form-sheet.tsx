import { forwardRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { reviewSchema, type ReviewFormData } from '@/lib/schemas/review';
import { createReview } from '@/lib/api/reviews';

type ReviewFormSheetProps = {
  restaurantId: string;
  onSuccess: () => void;
};

const REVIEW_SHEET_SNAP_POINTS = ['65%'];

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
    />
  );
}

export const ReviewFormSheet = forwardRef<BottomSheetModal, ReviewFormSheetProps>(
  function ReviewFormSheet({ restaurantId, onSuccess }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<ReviewFormData>({
      resolver: zodResolver(reviewSchema),
      defaultValues: { rating: 0, comment: '' },
    });

    async function onSubmit(data: ReviewFormData) {
      setIsSubmitting(true);
      setServerError(null);

      try {
        await createReview({
          restaurant_id: restaurantId,
          rating: data.rating,
          comment: data.comment || null,
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        reset();

        if (ref && 'current' in ref && ref.current) {
          ref.current.dismiss();
        }

        onSuccess();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit review';
        setServerError(message);
      } finally {
        setIsSubmitting(false);
      }
    }

    function handleDismiss() {
      reset();
      setServerError(null);
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={REVIEW_SHEET_SNAP_POINTS}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onDismiss={handleDismiss}
      >
        <BottomSheetView className="flex-1 px-4">
          {/* Header */}
          <Text className="font-[Karla_700Bold] text-lg text-gray-900 text-center mb-6">
            Leave a Review
          </Text>

          {/* Server error */}
          {serverError && (
            <View className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-600">
                {serverError}
              </Text>
            </View>
          )}

          {/* Star rating */}
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 mb-2">
            Rating
          </Text>
          <Controller
            control={control}
            name="rating"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row justify-center gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => onChange(star)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${star} out of 5 stars`}
                    accessibilityState={{ selected: value >= star }}
                    className="p-1"
                  >
                    <Star
                      size={36}
                      color={value >= star ? '#DC2626' : '#D1D5DB'}
                      fill={value >= star ? '#DC2626' : 'transparent'}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          />
          {errors.rating && (
            <Text className="font-[Karla_400Regular] text-sm text-red-600 text-center mb-3">
              {errors.rating.message}
            </Text>
          )}
          {!errors.rating && <View className="mb-3" />}

          {/* Comment */}
          <Text className="font-[Karla_600SemiBold] text-sm text-gray-700 mb-2">
            Comment (optional)
          </Text>
          <Controller
            control={control}
            name="comment"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Share your experience..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-gray-900 min-h-[100px]"
              />
            )}
          />
          {errors.comment && (
            <Text className="font-[Karla_400Regular] text-sm text-red-600 mt-1">
              {errors.comment.message}
            </Text>
          )}

          {/* Buttons */}
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.dismiss();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel review"
              className="flex-1 bg-gray-100 rounded-full py-3"
            >
              <Text className="font-[Karla_600SemiBold] text-base text-gray-700 text-center">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Submit review"
              className="flex-1 bg-red-600 rounded-full py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-[Karla_700Bold] text-base text-white text-center">
                  Submit
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
