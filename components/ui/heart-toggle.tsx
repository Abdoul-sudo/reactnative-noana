import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';

type HeartToggleProps = {
  restaurantId: string;
  size?: number;
  /** true when overlaid on a dark image — uses white outline when not favorited */
  onImage?: boolean;
};

export function HeartToggle({ restaurantId, size = 20, onImage = false }: HeartToggleProps) {
  const session = useAuthStore((s) => s.session);
  const isFavorite = useFavoritesStore((s) => s.favoriteIds.has(restaurantId));
  const toggle = useFavoritesStore((s) => s.toggle);

  // Hide the heart entirely for unauthenticated users
  if (!session?.user?.id) return null;

  const handlePress = () => toggle(session.user.id, restaurantId);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={size}
        color={isFavorite ? '#dc2626' : onImage ? '#ffffff' : '#9ca3af'}
        fill={isFavorite ? '#dc2626' : 'none'}
      />
    </Pressable>
  );
}
