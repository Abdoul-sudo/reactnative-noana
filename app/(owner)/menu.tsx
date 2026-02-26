import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/stores/auth-store';
import { useOwnerMenu } from '@/hooks/use-owner-menu';
import { useOwnerMenuItems } from '@/hooks/use-owner-menu-items';
import {
  softDeleteCategory,
  softDeleteMenuItem,
  toggleItemAvailability,
  type CategoryWithCount,
  type MenuItemDisplay,
} from '@/lib/api/owner-menu';
import { getMenuImagePublicUrl } from '@/lib/storage';
import { formatPrice } from '@/lib/utils';
import { DIETARY_TAGS } from '@/constants/dietary';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryFormSheet } from '@/components/owner/category-form-sheet';
import { MenuItemFormSheet } from '@/components/owner/menu-item-form-sheet';

// ── Menu item row ───────────────────────────────────────
function MenuItemRow({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: {
  item: MenuItemDisplay;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailability: (value: boolean) => void;
}) {
  const imageUrl = getMenuImagePublicUrl(item.imageUrl);
  const tagLabels = (item.dietaryTags ?? [])
    .map((t) => DIETARY_TAGS.find((dt) => dt.id === t)?.label)
    .filter(Boolean);

  return (
    <View
      className="flex-row items-center px-4 py-3 bg-stone-800/50"
      accessibilityLabel={`${item.name}, ${formatPrice(item.price)}${item.isAvailable ? '' : ', unavailable'}`}
      accessibilityRole="summary"
    >
      {/* Thumbnail */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: 48, height: 48, borderRadius: 8 }}
          contentFit="cover"
          accessibilityLabel={`${item.name} photo`}
        />
      ) : (
        <View className="w-12 h-12 rounded-lg bg-stone-700 items-center justify-center">
          <UtensilsCrossed size={16} color="#78716c" />
        </View>
      )}

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text
          className={`font-[Karla_600SemiBold] text-sm ${item.isAvailable ? 'text-stone-100' : 'text-stone-500'}`}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="font-[Karla_400Regular] text-xs text-stone-400">
          {formatPrice(item.price)}
          {tagLabels.length > 0 ? ` · ${tagLabels.join(', ')}` : ''}
        </Text>
      </View>

      {/* Availability toggle */}
      <Switch
        value={item.isAvailable}
        onValueChange={onToggleAvailability}
        trackColor={{ false: '#44403c', true: '#dc2626' }}
        thumbColor="#fafaf9"
        accessibilityLabel={`${item.name} availability`}
        accessibilityRole="switch"
        style={{ transform: [{ scale: 0.8 }] }}
      />

      {/* Edit */}
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        className="p-2 ml-1"
      >
        <Pencil size={16} color="#a8a29e" />
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
        className="p-2"
      >
        <Trash2 size={16} color="#f87171" />
      </Pressable>
    </View>
  );
}

function ItemSeparator() {
  return <View className="h-px bg-stone-700/50 ml-16" />;
}

// ── Category items section ──────────────────────────────
function CategoryItemsSection({
  categoryId,
  restaurantId,
  refreshTrigger,
  onEditItem,
  onItemChanged,
}: {
  categoryId: string;
  restaurantId: string;
  refreshTrigger: number;
  onEditItem: (item: MenuItemDisplay) => void;
  onItemChanged: () => void;
}) {
  const { items, isLoading, error, refetch } = useOwnerMenuItems(categoryId, refreshTrigger);

  function handleDeleteItem(item: MenuItemDisplay) {
    Alert.alert(
      'Delete Item',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteMenuItem(item.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refetch();
              onItemChanged();
            } catch (e) {
              if (__DEV__) console.warn('[menu] delete item failed:', e);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ],
    );
  }

  async function handleToggleAvailability(item: MenuItemDisplay, value: boolean) {
    try {
      await toggleItemAvailability(item.id, value);
      refetch();
    } catch (e) {
      if (__DEV__) console.warn('[menu] toggle availability failed:', e);
      Alert.alert('Error', 'Failed to update availability.');
    }
  }

  if (isLoading) {
    return (
      <View className="px-4 py-3 bg-stone-800/30">
        <ActivityIndicator size="small" color="#a8a29e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-4 py-3 bg-stone-800/30">
        <Text className="font-[Karla_400Regular] text-sm text-red-400 text-center">
          Failed to load items
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="px-4 py-4 bg-stone-800/30">
        <Text className="font-[Karla_400Regular] text-sm text-stone-500 text-center">
          No items yet — tap + to add one
        </Text>
      </View>
    );
  }

  return (
    <View>
      {items.map((item, index) => (
        <View key={item.id}>
          {index > 0 && <ItemSeparator />}
          <MenuItemRow
            item={item}
            onEdit={() => onEditItem(item)}
            onDelete={() => handleDeleteItem(item)}
            onToggleAvailability={(val) => handleToggleAvailability(item, val)}
          />
        </View>
      ))}
    </View>
  );
}

// ── Category row (expandable) ───────────────────────────
function CategoryRow({
  category,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddItem,
}: {
  category: CategoryWithCount;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
}) {
  return (
    <View
      accessibilityLabel={`${category.name}, ${category.itemCount} items${isExpanded ? ', expanded' : ''}`}
      accessibilityRole="summary"
    >
      <Pressable
        onPress={onToggleExpand}
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`}
        className="flex-row items-center px-4 py-4 bg-stone-800"
      >
        {isExpanded ? (
          <ChevronDown size={18} color="#a8a29e" />
        ) : (
          <ChevronRight size={18} color="#a8a29e" />
        )}
        <View className="flex-1 ml-2">
          <Text className="font-[Karla_600SemiBold] text-base text-stone-100">
            {category.name}
          </Text>
          <Text className="font-[Karla_400Regular] text-xs text-stone-400 mt-0.5">
            {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <Pressable
          onPress={onAddItem}
          accessibilityRole="button"
          accessibilityLabel={`Add item to ${category.name}`}
          className="p-2 mr-1"
        >
          <Plus size={18} color="#dc2626" />
        </Pressable>
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
  const [editItem, setEditItem] = useState<MenuItemDisplay | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [itemRefreshKey, setItemRefreshKey] = useState(0);

  const categoryFormRef = useRef<BottomSheetModal>(null);
  const itemFormRef = useRef<BottomSheetModal>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }

  function handleItemSaved() {
    refetch();
    setItemRefreshKey((k) => k + 1);
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function openAddCategory() {
    setEditCategory(null);
    categoryFormRef.current?.present();
  }

  function openEditCategory(category: CategoryWithCount) {
    setEditCategory(category);
    categoryFormRef.current?.present();
  }

  function openAddItem(categoryId: string) {
    setEditItem(null);
    setItemCategoryId(categoryId);
    itemFormRef.current?.present();
  }

  function openEditItem(item: MenuItemDisplay) {
    setEditItem(item);
    setItemCategoryId(item.categoryId);
    itemFormRef.current?.present();
  }

  function handleDeleteCategory(category: CategoryWithCount) {
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
              if (__DEV__) console.warn('[menu] delete category failed:', e);
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
          onPress={openAddCategory}
          accessibilityRole="button"
          accessibilityLabel="Add new category"
          className="w-10 h-10 rounded-full bg-red-600 items-center justify-center"
        >
          <Plus size={20} color="white" />
        </Pressable>
      </View>

      {categories.length === 0 ? (
        <MenuEmptyState onAdd={openAddCategory} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <CategoryRow
                category={item}
                isExpanded={expandedCategories.has(item.id)}
                onToggleExpand={() => toggleCategory(item.id)}
                onEdit={() => openEditCategory(item)}
                onDelete={() => handleDeleteCategory(item)}
                onAddItem={() => openAddItem(item.id)}
              />
              {expandedCategories.has(item.id) && (
                <CategoryItemsSection
                  categoryId={item.id}
                  restaurantId={restaurantId}
                  refreshTrigger={itemRefreshKey}
                  onEditItem={openEditItem}
                  onItemChanged={refetch}
                />
              )}
            </View>
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
        ref={categoryFormRef}
        restaurantId={restaurantId}
        editCategory={editCategory}
        onSaved={refetch}
      />

      <MenuItemFormSheet
        ref={itemFormRef}
        restaurantId={restaurantId}
        categoryId={itemCategoryId}
        editItem={editItem}
        onSaved={handleItemSaved}
      />
    </SafeAreaView>
  );
}
