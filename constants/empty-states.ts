export type EmptyStateType =
  | 'nearby_restaurants'    // Epic 2: no restaurants in area
  | 'featured_restaurants'  // Epic 2: no featured restaurants
  | 'trending_dishes'       // Epic 2: no trending dishes
  | 'top_rated'             // Epic 2: no top-rated matches after filter
  | 'search_results'        // Epic 3: no search results
  | 'favorites'             // Epic 5: no saved favorites
  | 'orders'                // Epic 4: no active orders (customer)
  | 'order_history'         // Epic 4: no past orders
  | 'notifications'         // Epic 2 header: no notifications
  | 'owner_orders'          // Epic 4: owner has no incoming orders
  | 'owner_menu'            // Epic 7: owner menu is empty
  | 'promotions';           // Epic 7: no active promotions

export interface EmptyStateConfig {
  title: string;
  message: string;
  iconName: string;   // Named export from lucide-react-native
  ctaLabel?: string;  // Optional CTA — caller supplies the action via onCta prop
}

export const EMPTY_STATES: Record<EmptyStateType, EmptyStateConfig> = {
  nearby_restaurants: {
    title: 'No restaurants nearby',
    message: 'Try expanding your search radius or changing your location.',
    iconName: 'MapPin',
    ctaLabel: 'Adjust location',
  },
  featured_restaurants: {
    title: 'Nothing featured today',
    message: 'Check back later for curated picks.',
    iconName: 'Star',
  },
  trending_dishes: {
    title: 'No trending dishes yet',
    message: 'Be the first to order and set the trend.',
    iconName: 'TrendingUp',
  },
  top_rated: {
    title: 'No matches found',
    message: 'Try adjusting your dietary filters.',
    iconName: 'Award',
    ctaLabel: 'Clear filters',
  },
  search_results: {
    title: 'No results found',
    message: 'Try a different search term or browse categories.',
    iconName: 'Search',
  },
  favorites: {
    title: 'No favorites yet',
    message: 'Tap the heart icon on any restaurant to save it here.',
    iconName: 'Heart',
  },
  orders: {
    title: 'No active orders',
    message: 'Your current orders will appear here.',
    iconName: 'ClipboardList',
    ctaLabel: 'Browse restaurants',
  },
  order_history: {
    title: 'No past orders',
    message: 'Your order history will appear here once you place your first order.',
    iconName: 'Clock',
    ctaLabel: 'Start ordering',
  },
  notifications: {
    title: 'No notifications yet',
    message: "You'll see order updates and offers here.",
    iconName: 'Bell',
  },
  owner_orders: {
    title: 'No orders today',
    message: 'New customer orders will appear here in real time.',
    iconName: 'ChefHat',
  },
  owner_menu: {
    title: 'Your menu is empty',
    message: 'Add categories and items to start accepting orders.',
    iconName: 'UtensilsCrossed',
    ctaLabel: 'Add menu item',
  },
  promotions: {
    title: 'No active promotions',
    message: 'Create a promotion to attract more customers.',
    iconName: 'Tag',
    ctaLabel: 'Create promotion',
  },
};
