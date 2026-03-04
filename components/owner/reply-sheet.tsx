import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import {
  ownerReplySchema,
  type OwnerReplyFormData,
} from '@/lib/schemas/owner-reply';
import { replyToReview } from '@/lib/api/owner-reviews';

// ── Types ────────────────────────────────────────────────

type ReplySheetProps = {
  reviewId: string | null;
  existingReply: string | null;
  /** Increment to force form reset even when reviewId hasn't changed */
  nonce: number;
  onSuccess: () => void;
};

// ── Backdrop ─────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────

export const ReplySheet = forwardRef<BottomSheetModal, ReplySheetProps>(
  function ReplySheet({ reviewId, existingReply, nonce, onSuccess }, ref) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
      control,
      handleSubmit,
      reset,
      watch,
      formState: { errors },
    } = useForm<OwnerReplyFormData>({
      resolver: zodResolver(ownerReplySchema),
      defaultValues: { reply: '' },
    });

    const replyValue = watch('reply');

    // Pre-fill when editing an existing reply (nonce forces re-run for same review)
    useEffect(() => {
      if (reviewId) {
        reset({ reply: existingReply ?? '' });
        setServerError(null);
      }
    }, [reviewId, existingReply, nonce, reset]);

    async function onSubmit(data: OwnerReplyFormData) {
      if (!reviewId || isSubmitting) return;

      setIsSubmitting(true);
      setServerError(null);

      try {
        await replyToReview(reviewId, data.reply);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        reset();

        if (ref && 'current' in ref && ref.current) {
          ref.current.dismiss();
        }

        onSuccess();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit reply';
        setServerError(message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (__DEV__) console.warn('[reply-sheet] submit failed:', err);
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
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backgroundStyle={{ backgroundColor: '#1c1917' }}
        handleIndicatorStyle={{ backgroundColor: '#a8a29e' }}
      >
        <BottomSheetScrollView className="px-6 pt-2 pb-8">
          {/* Header */}
          <Text className="font-[Karla_700Bold] text-lg text-stone-100 text-center mb-4">
            {existingReply ? 'Edit Reply' : 'Reply to Review'}
          </Text>

          {/* Server error */}
          {serverError && (
            <View className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 mb-4">
              <Text className="font-[Karla_400Regular] text-sm text-red-400">
                {serverError}
              </Text>
            </View>
          )}

          {/* Reply input */}
          <Text className="font-[Karla_600SemiBold] text-sm text-stone-400 mb-2">
            Your reply
          </Text>
          <Controller
            control={control}
            name="reply"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Write your reply..."
                placeholderTextColor="#78716c"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                className="bg-stone-800 border border-stone-600 rounded-xl px-4 py-3 font-[Karla_400Regular] text-base text-stone-100 min-h-[120px]"
              />
            )}
          />

          {/* Character counter + error */}
          <View className="flex-row justify-between mt-1 mb-4">
            <View>
              {errors.reply && (
                <Text className="font-[Karla_400Regular] text-sm text-red-400">
                  {errors.reply.message}
                </Text>
              )}
            </View>
            <Text className="font-[Karla_400Regular] text-xs text-stone-500">
              {replyValue?.length ?? 0}/500
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.dismiss();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
              className="flex-1 border border-stone-600 rounded-full py-3"
            >
              <Text className="font-[Karla_600SemiBold] text-base text-stone-300 text-center">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={existingReply ? 'Save edited reply' : 'Submit reply'}
              accessibilityState={{ disabled: isSubmitting }}
              className="flex-1 bg-red-600 rounded-full py-3"
              style={isSubmitting ? { opacity: 0.5 } : undefined}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-[Karla_700Bold] text-base text-white text-center">
                  {existingReply ? 'Save' : 'Reply'}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
