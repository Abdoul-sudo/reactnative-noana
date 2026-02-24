import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { type CuisineCategory } from '@/constants/cuisines';

interface CategoryScrollProps {
  categories: CuisineCategory[];
}

function CategoryItem({ item }: { item: CuisineCategory }) {
  const router = useRouter();
  const Icon = item.icon;

  return (
    <Pressable
      onPress={() =>
        // TODO 3.1: search screen reads cuisine param from route
        router.navigate({ pathname: '/(tabs)/search', params: { cuisine: item.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${item.label} cuisine category`}
      className="items-center mx-2"
      style={{ width: 72 }}
    >
      <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center mb-1.5">
        <Icon size={26} color="#dc2626" />
      </View>
      <Text
        className="font-[Karla_500Medium] text-xs text-gray-700 text-center"
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export function CategoryScroll({ categories }: CategoryScrollProps) {
  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CategoryItem item={item} />}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    />
  );
}
