export type EmptyStateType =
  | 'nearby_restaurants'    // Epic 2: no restaurants in area
  | 'featured_restaurants'  // Epic 2: no featured restaurants
  | 'trending_dishes'       // Epic 2: no trending dishes
  | 'top_rated'             // Epic 2: no top-rated matches after filter
  | 'search_results'        // Epic 3: no search results (both tabs empty)
  | 'search_results_filtered' // Epic 3: no results because dietary filters are too restrictive
  | 'search_restaurants_empty' // Epic 3: no restaurants in search, but dishes exist
  | 'search_dishes_empty'     // Epic 3: no dishes in search, but restaurants exist
  | 'favorites'             // Epic 5: no saved favorites
  | 'orders'                // Epic 4: no active orders (customer)
  | 'order_history'         // Epic 4: no past orders
  | 'notifications'         // Epic 2 header: no notifications
  | 'owner_orders'          // Epic 4: owner has no incoming orders
  | 'owner_menu'            // Epic 7: owner menu is empty
  | 'surprise_me'           // Epic 2: no restaurants match filters for surprise
  | 'restaurant_listing'           // Epic 3: no restaurants available on listing
  | 'restaurant_listing_filtered'  // Epic 3: no restaurants match applied filters
  | 'restaurant_menu_empty'        // Epic 4: restaurant has no menu items
  | 'restaurant_reviews_empty'     // Epic 4: restaurant has no reviews
  | 'addresses'                    // Epic 5: no saved delivery addresses
  | 'promotions'                   // Epic 7: no active promotions
  | 'owner_reviews_empty';         // Epic 9: owner has no reviews yet

export interface EmptyStateConfig {
  title: string;
  message: string;
  iconName: string;   // Named export from lucide-react-native
  ctaLabel?: string;  // Optional CTA — caller supplies the action via onCta prop
}

export const EMPTY_STATES: Record<EmptyStateType, EmptyStateConfig> = {
  addresses: {
    title: 'No saved addresses',
    message: 'Add a delivery address to get started.',
    iconName: 'MapPin',
    ctaLabel: 'Add first address',
  },
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
  search_results_filtered: {
    title: 'No results with these filters',
    message: 'Try removing some dietary filters to see more results.',
    iconName: 'FilterX',
    ctaLabel: 'Clear filters',
  },
  search_restaurants_empty: {
    title: 'No restaurants found',
    message: 'No restaurant matches for this search. Try the Dishes tab?',
    iconName: 'UtensilsCrossed',
  },
  search_dishes_empty: {
    title: 'No dishes found',
    message: 'No dish matches for this search. Try the Restaurants tab?',
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
  surprise_me: {
    title: 'No recommendations available',
    message: 'Try adjusting your dietary filters to discover something new.',
    iconName: 'Sparkles',
    ctaLabel: 'Clear filters',
  },
  restaurant_listing: {
    title: 'No restaurants available',
    message: 'Check back later for new listings.',
    iconName: 'UtensilsCrossed',
  },
  restaurant_listing_filtered: {
    title: 'No matches with these filters',
    message: 'Try adjusting or clearing your filters.',
    iconName: 'FilterX',
    ctaLabel: 'Clear filters',
  },
  restaurant_menu_empty: {
    title: 'No menu items yet',
    message: 'This restaurant hasn\'t added their menu yet. Check back soon!',
    iconName: 'UtensilsCrossed',
  },
  restaurant_reviews_empty: {
    title: 'No reviews yet',
    message: 'Be the first to review this restaurant after placing an order.',
    iconName: 'MessageSquare',
  },
  promotions: {
    title: 'No active promotions',
    message: 'Create a promotion to attract more customers.',
    iconName: 'Tag',
    ctaLabel: 'Create promotion',
  },
  owner_reviews_empty: {
    title: 'Your first review is on its way!',
    message: 'Reviews will appear here once customers share their feedback.',
    iconName: 'MessageSquare',
  },
};
