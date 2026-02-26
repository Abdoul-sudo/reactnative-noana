import { useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { AlertCircle, Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerMenu } from '@/hooks/use-owner-menu';
import { softDeleteCategory, type CategoryWithCount } from '@/lib/api/owner-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFormSheet } from '@/components/owner/category-form-sheet';

// ── Category row ─────────────────────────────────────────
function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryWithCount;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      className="flex-row items-center px-4 py-4 bg-stone-800"
      accessibilityLabel={`${category.name}, ${category.itemCount} items`}
      accessibilityRole="summary"
    >
      <View className="flex-1">
        <Text className="font-[Karla_600SemiBold] text-base text-stone-100">
          {category.name}
        </Text>
        <Text className="font-[Karla_400Regular] text-xs text-stone-400 mt-0.5">
          {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${category.name}`}
        className="p-2 mr-1"
      >
        <Pencil size={18} color="#a8a29e" />
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${category.name}`}
        className="p-2"
      >
        <Trash2 size={18} color="#f87171" />
      </Pressable>
    </View>
  );
}

function RowSeparator() {
  return <View className="h-px bg-stone-700" />;
}

// ── Skeleton loader ──────────────────────────────────────
function MenuSkeleton() {
  return (
    <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Skeleton className="h-7 w-20 rounded bg-stone-800" />
        <Skeleton className="h-10 w-10 rounded-full bg-stone-800" />
      </View>
      <View className="mt-4 mx-4 rounded-xl overflow-hidden bg-stone-800">
        {[1, 2, 3, 4].map((i) => (
          <View key={i}>
            <View className="flex-row items-center px-4 py-4">
              <View className="flex-1">
                <Skeleton className="h-5 w-28 rounded bg-stone-700" />
                <Skeleton className="h-3 w-16 rounded bg-stone-700 mt-2" />
              </View>
              <Skeleton className="h-5 w-5 rounded bg-stone-700 mr-3" />
              <Skeleton className="h-5 w-5 rounded bg-stone-700" />
            </View>
            {i < 4 && <View className="h-px bg-stone-700" />}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Empty state ──────────────────────────────────────────
function MenuEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <UtensilsCrossed size={48} color="#57534e" />
      <Text className="font-[Karla_700Bold] text-lg text-stone-300 mt-4 text-center">
        No categories yet
      </Text>
      <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
        Create your first menu category to start adding dishes.
      </Text>
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add your first category"
        className="mt-6 px-6 py-3 bg-red-600 rounded-full"
      >
        <Text className="font-[Karla_600SemiBold] text-sm text-white">Add Category</Text>
      </Pressable>
    </View>
  );
}

// ── Error state ──────────────────────────────────────────
function MenuErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
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

// ── Main screen ──────────────────────────────────────────
export default function OwnerMenuScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id ?? '';
  const { categories, restaurantId, isLoading, error, isEmpty, refetch } = useOwnerMenu(userId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryWithCount | null>(null);

  const formSheetRef = useRef<BottomSheetModal>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  function openAddForm() {
    setEditCategory(null);
    formSheetRef.current?.present();
  }

  function openEditForm(category: CategoryWithCount) {
    setEditCategory(category);
    formSheetRef.current?.present();
  }

  function handleDelete(category: CategoryWithCount) {
    const itemText = category.itemCount > 0
      ? ` and its ${category.itemCount} item${category.itemCount === 1 ? '' : 's'}`
      : '';

    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"${itemText}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteCategory(category.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
            } catch (e) {
              if (__DEV__) console.warn('[menu] delete failed:', e);
              Alert.alert('Error', 'Failed to delete category. Please try again.');
            }
          },
        },
      ],
    );
  }

  // ── State branching: Loading → Error → Empty → Content ──
  if (isLoading) return <MenuSkeleton />;

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <MenuErrorState message={error.message} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  if (isEmpty || !restaurantId) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-[Karla_700Bold] text-lg text-stone-300 text-center">
            No restaurant found
          </Text>
          <Text className="font-[Karla_400Regular] text-sm text-stone-500 mt-2 text-center">
            You need a restaurant to manage menu categories.
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
          Menu
        </Text>
        <Pressable
          onPress={openAddForm}
          accessibilityRole="button"
          accessibilityLabel="Add new category"
          className="w-10 h-10 rounded-full bg-red-600 items-center justify-center"
        >
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <MenuEmptyState onAdd={openAddForm} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryRow
              category={item}
              onEdit={() => openEditForm(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ItemSeparatorComponent={RowSeparator}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          className="rounded-xl overflow-hidden"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#dc2626"
            />
          }
        />
      )}

      <CategoryFormSheet
        ref={formSheetRef}
        restaurantId={restaurantId}
        editCategory={editCategory}
        onSaved={refetch}
      />
    </SafeAreaView>
  );
}
