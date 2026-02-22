# noana - Project Specification

> **Type**: Mobile Application
> **Stack**: React Native (Expo) + NativeWind + Supabase
> **Concept**: Modern restaurant discovery & food ordering mobile app (Zomato-style)
> **Status**: Specification

---

## Overview

noana is a restaurant discovery and food ordering mobile app where users can browse restaurants, explore menus, place orders, and track deliveries in real-time. Restaurant owners get a dedicated dashboard to manage menus, incoming orders, and revenue analytics.

**Portfolio Value**: Demonstrates mobile development competence with auth, complex relational data, real-time features, image handling, role-based access, native animations, production-grade UI, geo-based filtering, loyalty/gamification, and social features.

**Key Differentiators** (vs. generic Zomato clone):
- **Loyalty & Gamification**: Points, streaks, and rewards to drive retention
- **Social Layer**: Share meals, see what friends ordered, group ordering
- **Owner Promotions**: Flash deals, push offers to nearby customers — real business value loop
- **"Surprise Me"**: One-tap random restaurant + popular dish discovery — fun, memorable UX hook
- **Dietary-First Filters**: Vegan, Halal, Gluten-free, Keto as first-class filter citizens on the home screen

---

## Design System

### Color Palette

| Role           | Hex       | NativeWind   | Usage                                     |
| -------------- | --------- | ------------ | ----------------------------------------- |
| Primary        | `#DC2626` | `red-600`    | Brand, active states, primary buttons     |
| Primary Light  | `#F87171` | `red-400`    | Hover states, secondary accents           |
| CTA / Accent   | `#CA8A04` | `yellow-600` | Ratings, stars, call-to-action highlights |
| Background     | `#FEF2F2` | `red-50`     | Screen background, light sections         |
| Surface        | `#FFFFFF` | `white`      | Cards, modals, bottom sheets              |
| Text Primary   | `#450A0A` | `red-950`    | Headings, body text                       |
| Text Secondary | `#991B1B` | `red-800`    | Subheadings, descriptions                 |
| Text Muted     | `#6B7280` | `gray-500`   | Captions, timestamps, placeholders        |
| Border         | `#FECACA` | `red-200`    | Card borders, dividers                    |
| Success        | `#16A34A` | `green-600`  | Order confirmed, open status              |
| Warning        | `#F59E0B` | `amber-500`  | Preparing, limited stock                  |
| Dark Surface   | `#1C1917` | `stone-900`  | Owner dashboard background                |
| Dark Card      | `#292524` | `stone-800`  | Owner dashboard cards                     |

**Design Notes**:

- Warm reds and ambers evoke appetite and urgency
- Light customer-facing screens / dark owner dashboard for visual contrast
- CTA gold (`#CA8A04`) used sparingly for ratings and premium actions

### Typography

**Font Pairing**: Restaurant Menu (Serif + Sans)

| Role               | Font                | Weight   | Usage                                            |
| ------------------ | ------------------- | -------- | ------------------------------------------------ |
| Display / Headings | Playfair Display SC | 400, 700 | Screen titles, restaurant names, section headers |
| Body / UI          | Karla               | 300-700  | Descriptions, buttons, labels, navigation        |

Load via `expo-font` or `@expo-google-fonts`:

```ts
import { useFonts, PlayfairDisplaySC_400Regular, PlayfairDisplaySC_700Bold } from '@expo-google-fonts/playfair-display-sc';
import { Karla_300Light, Karla_400Regular, Karla_500Medium, Karla_600SemiBold, Karla_700Bold } from '@expo-google-fonts/karla';
```

**NativeWind Config**:

```js
fontFamily: {
  display: ['PlayfairDisplaySC_400Regular'],
  'display-bold': ['PlayfairDisplaySC_700Bold'],
  sans: ['Karla_400Regular'],
  'sans-light': ['Karla_300Light'],
  'sans-medium': ['Karla_500Medium'],
  'sans-semibold': ['Karla_600SemiBold'],
  'sans-bold': ['Karla_700Bold'],
}
```

**Typography Scale**:
| Element | Size | Weight | Font |
|---------|------|--------|------|
| Hero title | 36-44px | 700 | display |
| Section title | 28-32px | 700 | display |
| Restaurant name | 22px | 700 | display |
| Card title | 17-18px | 600 | sans |
| Body text | 15-16px | 400 | sans |
| Caption / meta | 13px | 400 | sans |
| Small label | 11px | 500 | sans |

### Spacing & Layout

- **Screen padding**: 16-20px horizontal
- **Section gaps**: 32-40px between major sections
- **Card padding**: 12-16px
- **Border radius**: 16px for cards, 999px for pills/badges
- **List items**: FlatList / SectionList for performant scrolling

### Shadows & Elevation

| Level  | Usage                 | Style                     |
| ------ | --------------------- | ------------------------- |
| Low    | Cards at rest         | `shadow-sm` / elevation 2 |
| Medium | Cards on press        | `shadow-md` / elevation 4 |
| High   | Modals, bottom sheets | `shadow-xl` / elevation 8 |
| Glow   | CTA buttons           | Custom red shadow         |

### Icons

- **Library**: Lucide React Native (consistent, clean line icons)
- **Size**: 22-24px for tab bar, 20px for UI, 16px for inline
- **No emojis as icons** - always use SVG

### Animations

| Interaction        | Duration | Library                      |
| ------------------ | -------- | ---------------------------- |
| Screen transitions | 300ms    | React Navigation             |
| Card press scale   | 150ms    | Reanimated                   |
| Bottom sheet slide | 300ms    | @gorhom/bottom-sheet         |
| List item enter    | 200ms    | Reanimated layout animations |
| Order status step  | 400ms    | Reanimated spring            |
| Pull to refresh    | Native   | FlatList built-in            |
| Skeleton pulse     | 1.5s     | Custom Reanimated            |
| Tab switch         | 200ms    | React Navigation             |

**Performance Rules**:

- Use `react-native-reanimated` for all animations (runs on UI thread)
- Respect `AccessibilityInfo.isReduceMotionEnabled`
- Skeleton screens for all async content (no blank screens)
- Activity indicators only for operations > 300ms

---

## Screens & Features

### Navigation Structure

```
Onboarding (shown once, first launch)
├── Welcome
├── LocationPermission
├── CuisinePreferences (select favorite cuisines)
├── DietaryPreferences (Vegan, Halal, Gluten-free, Keto, None)
└── PersonalizedHome (transition to main app)

Tab Navigator (Customer)
├── Home (Stack)
│   ├── Landing
│   ├── RestaurantList
│   └── RestaurantDetail
├── Search (Stack)
│   ├── SearchHome (trending, recent, discovery)
│   └── SearchResults
├── Orders (Stack)
│   ├── OrderList
│   └── OrderDetail (tracking)
├── Favorites
└── Profile (Stack)
    ├── ProfileHome
    ├── Addresses
    ├── Settings
    ├── OrderHistory
    └── Rewards (loyalty points & streaks)

Tab Navigator (Owner)
├── Dashboard
├── Orders (Kanban)
├── Menu Management
├── Promotions (flash deals, push offers)
├── Reviews
└── Settings
```

### 0. Onboarding (First Launch Only)

**Trigger**: Shown once on first app launch (flag stored in `expo-secure-store`)

**Screens** (3 steps + transition):

1. **Welcome**: App logo, tagline "Discover. Order. Enjoy.", animated food illustration, "Get Started" CTA
2. **Location & Preferences**: Request location permission (`expo-location`), select 3+ favorite cuisines from a visual grid, select dietary preferences (Vegan, Halal, Gluten-free, Keto, None) as toggle chips
3. **Personalized Intro**: "Your personalized feed is ready!" with preview of curated restaurants based on selections, "Let's Go" CTA transitions to main app

**Key UI Patterns**:
- Horizontal pager with dot indicators
- Skip button on each screen (top-right)
- Cuisine grid with animated selection (scale + checkmark)
- Preferences saved to `profiles` table after auth
- Smooth transition animation into main tab navigator

**Empty State Handling**: If user skips preferences, home screen shows generic popular content with a banner: "Personalize your feed" linking back to preference selection

---

### 1. Landing / Home Screen

**Tab**: Home

**Sections**:

1. **Header**: Location selector, search bar, notification bell, loyalty points badge
2. **Dietary Filters**: Prominent toggle chips — Vegan, Halal, Gluten-free, Keto (persisted from onboarding, always visible, toggleable)
3. **Cuisine Categories**: Horizontal scrollable pills with icons (Pizza, Sushi, Burgers, Indian, Thai, etc.)
4. **"Surprise Me" Card**: Eye-catching CTA card — one tap picks a random restaurant + its most popular dish. Animated dice/shuffle icon. Shows result in a fun reveal animation
5. **Reorder**: If user has past orders, show "Order Again" horizontal scroll of previous orders (restaurant logo, order summary, one-tap reorder)
6. **Featured Restaurants**: Horizontal card carousel with cover photo, name, cuisine tags, rating, delivery time, dietary badges
7. **Trending Near You**: Vertical list of popular dishes with restaurant attribution
8. **Top Rated**: Grid of restaurant cards (2 columns)

**Key UI Patterns**:

- Pull-to-refresh
- Location picker with bottom sheet
- Restaurant cards with press scale animation
- Cuisine pills with smooth active state transition
- Dietary filter chips with animated toggle (filled/outlined states)
- "Surprise Me" card with shuffle animation (Reanimated spring)
- Reorder cards with one-tap cart population

### 1b. Search Screen

**Tab**: Search

**Sections**:

1. **Search Bar**: Auto-focus on tab switch, debounced text input, voice search button (expo-speech)
2. **Recent Searches**: Horizontal chips of last 10 searches (tap to re-search, swipe to dismiss)
3. **Trending Searches**: Popular search terms in the user's area (updated periodically)
4. **Cuisine Discovery**: Visual grid of cuisine categories with photos (tap to browse)
5. **Popular Dishes Near You**: Vertical list of trending dishes with restaurant attribution

**Search Results** (push screen):
- Segmented tabs: Restaurants | Dishes
- Restaurant results: Same card format as listing
- Dish results: Dish image, name, price, restaurant name, rating — tap goes to restaurant detail scrolled to that item
- Dietary filter chips available in results view
- Empty state: Illustrated "No results for [query]" with suggestions to try related terms

**Key UI Patterns**:
- Debounced search with 300ms delay
- Skeleton loading during search
- Animated transition between idle state and results
- Search history persisted locally (AsyncStorage)
- Clear all recent searches button

---

### 2. Restaurant Listing

**Screen**: RestaurantList (push from Home)

**Features**:

- **Filter bar**: Horizontal scrollable filter chips (Cuisine type, price range, minimum rating, delivery time, dietary tags, sort by)
- **Filter bottom sheet**: Full filter options in a bottom sheet (including dietary: Vegan, Halal, Gluten-free, Keto)
- **Restaurant list**: 1-column FlatList with cards
- **Each card shows**: Cover photo, restaurant name, cuisine tags, dietary badges, star rating + review count, estimated delivery time, price range indicator, active promotion badge (if any)
- **Infinite scroll** with loading footer
- **Empty state**: Illustrated "no results" with suggestion to adjust filters

**Key UI Patterns**:

- Filter chips with animated selection
- Skeleton loading cards while fetching
- Smooth list animations with Reanimated layout

### 3. Restaurant Detail

**Screen**: RestaurantDetail (push from listing/home)

**Sections**:

1. **Header**: Full-width cover photo with back button overlay, restaurant name, cuisine, rating, delivery time, open/closed badge
2. **Sticky tab bar**: Menu | Reviews | Info
3. **Menu tab**: SectionList grouped by category (Starters, Mains, Desserts, Drinks), each item shows image, name, description, price, estimated prep time, dietary tags (Vegan/Halal/GF/Keto badges), "Add" button
4. **Reviews tab**: Average rating breakdown (5-star bar chart), individual review cards with avatar, name, date, star rating, text
5. **Info tab**: Opening hours, address with map (react-native-maps), phone (tap to call), website (tap to open)

**Key UI Patterns**:

- Collapsible header with parallax on scroll (Reanimated)
- Sticky category tabs while scrolling
- Quantity selector (+/-) on menu items
- "Added to cart" haptic feedback + mini toast
- Review stars using SVG (gold fill)
- Floating cart summary bar at bottom when items in cart

### 4. Cart & Checkout

**Cart**: Bottom sheet overlay (accessible from floating bar or tab)
**Checkout**: Separate screen pushed from cart

**Cart Conflict Policy**:
When a user has items from Restaurant A and tries to add from Restaurant B, show a confirmation dialog:
- "You have items from [Restaurant A]. Adding from [Restaurant B] will clear your current cart."
- Buttons: "Clear Cart & Add" (destructive, red) | "Keep Current Cart" (default)
- This is a single-restaurant cart model (simpler, matches industry standard)

**Cart Bottom Sheet**:

- Restaurant name at top
- List of items: image thumbnail, name, quantity controls, item total, remove button
- Subtotal, delivery fee, total
- "Go to Checkout" CTA button
- Swipe-to-delete on items
- Empty cart state with illustration and "Browse Restaurants" CTA

**Checkout Screen**:

- **Delivery address**: Saved addresses list + add new (form with places autocomplete)
- **Order summary**: Collapsible item list, pricing breakdown
- **Payment**: Mock Stripe integration (card input via `@stripe/stripe-react-native`)
- **Special instructions**: Text input
- **Place Order** button with loading state
- Order confirmation with navigation to tracking

**Key UI Patterns**:

- Cart badge on tab bar with animated count update
- Swipe-to-delete with Reanimated gesture handler
- Smooth bottom sheet with @gorhom/bottom-sheet
- Form validation with inline error messages
- Haptic feedback on order placement

### 5. Order Tracking

**Screen**: OrderDetail (push from Orders tab)

**Features**:

- **Real-time status stepper**: Order Placed > Confirmed > Preparing > On the Way > Delivered
- Each step has icon, label, timestamp
- Active step with pulse animation
- **Order details**: Items, quantities, total
- **Estimated delivery time**: Countdown or ETA
- **Restaurant contact info** (tap to call)
- Powered by **Supabase real-time subscriptions**

**Key UI Patterns**:

- Animated step transitions (green fill propagating with Reanimated)
- Live status updates without screen refresh
- Confetti animation on "Delivered" state (react-native-confetti-cannon)
- Push notification on status change
- Button to leave a review after delivery

### 6. User Profile & Dashboard

**Tab**: Profile

**Sections**:

- **Order History**: FlatList of past orders with status, date, total, reorder button
- **Favorite Restaurants**: Grid of saved restaurants
- **Saved Addresses**: CRUD list of delivery addresses
- **Profile Settings**: Name, email, avatar upload (expo-image-picker), password change

**Key UI Patterns**:

- Section navigation via list items (push to sub-screens)
- "Reorder" button that populates cart with previous order items
- Empty states with helpful CTAs
- Avatar upload with camera/gallery picker

### 7. Restaurant Owner Dashboard

**Access**: Separate tab navigator (role-based, shown to owner accounts)

**Design**: Dark theme (`stone-900` background) to visually differentiate from customer-facing screens.

**Screens**:

#### 7a. Overview (Dashboard tab)

- **Revenue cards**: Today, this week, this month (with trend arrows)
- **Revenue chart**: Line/area chart (daily revenue over last 30 days) - use react-native-chart-kit or Victory Native
- **Orders today**: Count + status breakdown (donut chart)
- **Top dishes**: Leaderboard list (dish name, orders, revenue)

#### 7b. Menu Management (Menu tab)

- **Category CRUD**: Add/edit/delete menu categories
- **Item CRUD**: Name, description, price, image upload (expo-image-picker + Supabase Storage), category assignment, availability toggle
- **Drag-and-drop reorder** for items within categories (react-native-draggable-flatlist)
- **Bulk actions**: Mark multiple items as unavailable

#### 7c. Orders (Orders tab)

- **Segmented control / tabs**: New, Confirmed, Preparing, Ready, Completed
- **Each order card**: Order #, items summary, total, time since placed
- **Tap to expand**: Full order details, customer info
- **Status update buttons**: Move to next stage
- **Real-time**: New orders appear instantly via Supabase real-time
- **Push notification + sound** on new order

#### 7d. Reviews (Reviews tab)

- **Average rating display** with trend
- **Review list** with ability to respond
- **Filter by rating**

#### 7e. Promotions (Promotions tab)

- **Create Promotion**: Name, discount type (percentage/fixed), discount value, applicable items (all menu / specific categories / specific items), start date, end date, push notification toggle
- **Active Promotions**: List of running promotions with performance stats (views, orders, revenue impact)
- **Flash Deal**: Quick-create a time-limited deal (e.g., "20% off for the next 2 hours") — pushes notification to nearby customers
- **Promotion History**: Past promotions with ROI summary

**Key UI Patterns**:
- Toggle switch to activate/deactivate promotions
- Push notification preview before sending
- Real-time counter showing customers reached

#### 7f. Settings (Settings tab or sub-screen)

- Restaurant info (name, description, cover photo, logo)
- Opening hours
- Delivery settings (radius, fee, minimum order)

**Chart Library**: react-native-chart-kit or Victory Native

**Chart Types Used**:
| Data | Chart | Library |
|------|-------|---------|
| Revenue over time | Area chart | Victory Native / chart-kit |
| Orders by status | Donut chart | Victory Native / chart-kit |
| Top dishes | Horizontal bar | Victory Native / chart-kit |
| Rating distribution | Horizontal bar | Victory Native / chart-kit |

---

## Data Architecture (Supabase)

### Database Schema

```sql
-- Users (extends Supabase Auth)
profiles
  id                  uuid (FK auth.users)
  full_name           text
  avatar_url          text
  role                enum('customer', 'owner')
  push_token          text -- Expo push notification token
  dietary_preferences text[] -- ['vegan', 'halal', 'gluten_free', 'keto']
  cuisine_preferences text[] -- ['Italian', 'Japanese'] from onboarding
  loyalty_points      int DEFAULT 0
  current_streak      int DEFAULT 0 -- consecutive days with orders
  longest_streak      int DEFAULT 0
  last_order_date     date
  onboarding_complete boolean DEFAULT false
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()

-- Restaurants
restaurants
  id            uuid PK
  owner_id      uuid (FK profiles)
  name          text
  slug          text UNIQUE
  description   text
  cover_image   text
  logo          text
  cuisine_types text[] -- ['Italian', 'Pizza']
  dietary_tags  text[] -- ['vegan_options', 'halal', 'gluten_free_options']
  price_range   int (1-4)
  address       text
  city          text
  lat           float
  lng           float
  phone         text
  website       text
  delivery_fee  decimal
  delivery_radius_km decimal DEFAULT 5.0
  min_order     decimal
  avg_delivery  int -- minutes
  is_active     boolean DEFAULT true
  deleted_at    timestamptz -- soft delete
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Operating Hours (structured, replaces opening_hours JSONB)
operating_hours
  id            uuid PK
  restaurant_id uuid (FK restaurants)
  day_of_week   int (0-6) -- 0=Sunday, 6=Saturday
  open_time     time
  close_time    time
  is_closed     boolean DEFAULT false -- for holidays / special closures
  UNIQUE (restaurant_id, day_of_week)

-- Menu Categories
menu_categories
  id            uuid PK
  restaurant_id uuid (FK restaurants)
  name          text
  sort_order    int
  deleted_at    timestamptz -- soft delete
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Menu Items
menu_items
  id            uuid PK
  category_id   uuid (FK menu_categories)
  restaurant_id uuid (FK restaurants)
  name          text
  description   text
  price         decimal
  image_url     text
  dietary_tags  text[] -- ['vegan', 'gluten_free']
  est_prep_time int -- estimated prep time in minutes
  is_available  boolean DEFAULT true
  sort_order    int
  deleted_at    timestamptz -- soft delete (preserves order_items references)
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Orders
orders
  id            uuid PK
  user_id       uuid (FK profiles)
  restaurant_id uuid (FK restaurants)
  status        enum('placed', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled')
  subtotal      decimal
  delivery_fee  decimal
  discount      decimal DEFAULT 0 -- from promotions
  total         decimal
  delivery_address jsonb
  special_instructions text
  promotion_id  uuid (FK promotions, nullable)
  points_earned int DEFAULT 0 -- loyalty points for this order
  placed_at     timestamptz
  confirmed_at  timestamptz
  preparing_at  timestamptz
  on_the_way_at timestamptz
  delivered_at  timestamptz
  cancelled_at  timestamptz
  updated_at    timestamptz DEFAULT now()

-- Order Items
order_items
  id            uuid PK
  order_id      uuid (FK orders)
  menu_item_id  uuid (FK menu_items)
  name          text -- snapshot at order time
  price         decimal -- snapshot at order time
  quantity      int

-- Reviews
reviews
  id            uuid PK
  user_id       uuid (FK profiles)
  restaurant_id uuid (FK restaurants)
  order_id      uuid (FK orders)
  rating        int (1-5)
  text          text
  owner_reply   text
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Saved Addresses
addresses
  id            uuid PK
  user_id       uuid (FK profiles)
  label         text -- 'Home', 'Work'
  address       text
  city          text
  lat           float
  lng           float
  is_default    boolean DEFAULT false
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Favorites
favorites
  user_id       uuid (FK profiles)
  restaurant_id uuid (FK restaurants)
  created_at    timestamptz DEFAULT now()
  PK (user_id, restaurant_id)

-- Promotions (owner-created deals)
promotions
  id              uuid PK
  restaurant_id   uuid (FK restaurants)
  name            text
  discount_type   enum('percentage', 'fixed')
  discount_value  decimal
  applies_to      enum('all', 'category', 'item')
  target_ids      uuid[] -- category or item IDs (null if applies_to='all')
  starts_at       timestamptz
  ends_at         timestamptz
  is_active       boolean DEFAULT true
  push_sent       boolean DEFAULT false
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()

-- Loyalty Point Transactions (audit trail)
loyalty_transactions
  id            uuid PK
  user_id       uuid (FK profiles)
  order_id      uuid (FK orders, nullable)
  points        int -- positive=earned, negative=redeemed
  reason        text -- 'order_completed', 'streak_bonus', 'redeemed_discount'
  created_at    timestamptz DEFAULT now()
```

### Key Indexes

```sql
-- Fast menu lookups
CREATE INDEX idx_menu_items_restaurant ON menu_items (restaurant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_menu_items_category ON menu_items (category_id) WHERE deleted_at IS NULL;

-- Order queries (user history, restaurant dashboard)
CREATE INDEX idx_orders_user ON orders (user_id, placed_at DESC);
CREATE INDEX idx_orders_restaurant ON orders (restaurant_id, placed_at DESC);
CREATE INDEX idx_orders_status ON orders (restaurant_id, status);

-- Review lookups
CREATE INDEX idx_reviews_restaurant ON reviews (restaurant_id, created_at DESC);

-- Favorites
CREATE INDEX idx_favorites_user ON favorites (user_id);

-- Active promotions lookup
CREATE INDEX idx_promotions_active ON promotions (restaurant_id, is_active, ends_at)
  WHERE is_active = true;

-- Operating hours: "is this restaurant open now?"
CREATE INDEX idx_operating_hours_lookup ON operating_hours (restaurant_id, day_of_week);

-- Soft-delete aware restaurant listing
CREATE INDEX idx_restaurants_active ON restaurants (is_active, city)
  WHERE deleted_at IS NULL;
```

### Geo-Query Strategy

Use a **haversine RPC function** in Supabase (free-tier compatible, no PostGIS needed):

```sql
-- Supabase RPC function using haversine formula
CREATE OR REPLACE FUNCTION nearby_restaurants(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 5.0
)
RETURNS TABLE (id UUID, distance_km FLOAT) AS $$
  SELECT id,
    (6371 * acos(
      cos(radians(user_lat)) * cos(radians(lat)) *
      cos(radians(lng) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(lat))
    )) AS distance_km
  FROM restaurants
  WHERE is_active = true AND deleted_at IS NULL
  HAVING distance_km <= radius_km
  ORDER BY distance_km;
$$ LANGUAGE SQL STABLE;
```

Client-side call:

```ts
const { data } = await supabase.rpc('nearby_restaurants', {
  user_lat: latitude,
  user_lng: longitude,
  radius_km: 5
});
```

### Supabase Features Used

| Feature            | Usage                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Auth**           | Email/password signup, Google OAuth, Apple Sign-In, role-based (customer vs owner) |
| **Database**       | PostgreSQL with RLS (Row Level Security)                                           |
| **Real-time**      | Order status updates (customer tracking + owner order board)                       |
| **Storage**        | Restaurant covers, menu item photos, user avatars                                  |
| **Edge Functions** | (Optional) Push notification dispatch, scheduled cleanup                           |
| **RLS Policies**   | Customers see own orders; owners see own restaurant data                           |

### Real-time Subscriptions

```ts
// Customer: track their order status
supabase
    .channel('order-tracking')
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
        },
        (payload) => updateOrderStatus(payload.new),
    )
    .subscribe();

// Owner: listen for new orders
supabase
    .channel('new-orders')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => addNewOrder(payload.new),
    )
    .subscribe();
```

### Push Notifications

```ts
// Register for push notifications with Expo
import * as Notifications from 'expo-notifications';

// Store push token in profiles table
// Trigger notifications from Supabase Edge Functions on order status change
```

---

## Seed Data Strategy

Populate the database with realistic mock data to make the app feel alive:

- **25-30 restaurants** across 8 cuisine types (Italian, Japanese, Mexican, Indian, Thai, American, Chinese, Mediterranean)
- **Dietary tags on restaurants**: At least 5 with vegan options, 5 halal, 3 gluten-free, 3 keto-friendly
- **6-12 menu items per restaurant** with real food photos from Unsplash, dietary tags per item, estimated prep times (8-25 min range)
- **Structured operating hours** for each restaurant (varied: some closed Mondays, some late-night, some brunch-only)
- **50+ reviews** spread across restaurants with varied ratings (3-5 stars)
- **Mock orders** for dashboard demo data
- **Revenue data** seeded for the last 30 days for owner dashboard charts
- **2-3 active promotions** across different restaurants for demo
- **Loyalty data**: Demo customer with 500 points, 7-day streak
- **Geo coordinates**: Realistic lat/lng for a single city (for PostGIS demo)

**Image Sources**: Unsplash Food Collections (free, high-quality, no attribution required for demos)

---

## Tech Stack Details

| Layer          | Technology                                    | Purpose                                       |
| -------------- | --------------------------------------------- | --------------------------------------------- |
| Framework      | React Native (Expo SDK 54)                    | Cross-platform mobile app (New Architecture)  |
| Navigation     | Expo Router v6 (file-based)                   | Stack, tab, and modal navigation              |
| Styling        | NativeWind v4.2 (Tailwind for RN)             | Utility-first styling                         |
| Database       | @supabase/supabase-js v2.97                   | Auth, DB, real-time, storage                  |
| Charts         | Victory Native or react-native-chart-kit      | Owner dashboard analytics                     |
| Maps           | react-native-maps v1.27                       | Restaurant location display                   |
| Payments       | @stripe/stripe-react-native v0.58 (test mode) | Mock checkout flow                            |
| Icons          | lucide-react-native v0.575                    | Consistent SVG icons                          |
| Fonts          | @expo-google-fonts                            | Playfair Display SC + Karla                   |
| Images         | expo-image v3.0                               | Optimized image loading & caching             |
| State          | Zustand v5.0                                  | Cart state, user session, global state        |
| Forms          | React Hook Form + Zod                         | Validation                                    |
| Animations     | react-native-reanimated v4.2                  | Performant native animations (UI thread)      |
| Gestures       | react-native-gesture-handler                  | Swipe, drag interactions                      |
| Bottom Sheets  | @gorhom/bottom-sheet v5.2                     | Cart, filters, pickers (Reanimated v4 compat) |
| Notifications  | expo-notifications                            | Push notifications for orders                 |
| Build & Deploy | EAS Build + EAS Submit                        | App store builds and submissions              |

### Project Structure

```
noana/
  app/
    (onboarding)/                  # First-launch onboarding flow
      welcome.tsx                  # Welcome screen
      preferences.tsx              # Cuisine + dietary preferences
      ready.tsx                    # "Your feed is ready" transition
    (tabs)/                        # Customer tab navigator
      index.tsx                    # Home / Landing screen
      search.tsx                   # Search screen (trending, recent, discovery)
      orders.tsx                   # Orders list
      favorites.tsx                # Favorite restaurants
      profile.tsx                  # Profile home
    (auth)/
      login.tsx
      signup.tsx
    restaurant/
      [slug].tsx                   # Restaurant detail
    checkout.tsx                   # Checkout screen
    order/
      [id].tsx                     # Order tracking
    profile/
      addresses.tsx                # Saved addresses
      settings.tsx                 # Profile settings
      history.tsx                  # Order history
      rewards.tsx                  # Loyalty points & streaks
    (owner)/                       # Owner tab navigator
      dashboard.tsx                # Overview analytics
      orders.tsx                   # Order management
      menu.tsx                     # Menu management
      promotions.tsx               # Promotions & flash deals
      reviews.tsx                  # Reviews
      settings.tsx                 # Restaurant settings
    _layout.tsx                    # Root layout
  components/
    ui/                            # Shared UI (Button, Input, Badge, etc.)
    ui/EmptyState.tsx              # Reusable empty state component
    ui/DietaryBadge.tsx            # Dietary tag badge (Vegan, Halal, etc.)
    home/                          # Home screen sections
    home/SurpriseMe.tsx            # "Surprise Me" random pick card
    home/ReorderSection.tsx        # Quick reorder from past orders
    restaurant/                    # Restaurant cards, menu items
    cart/                          # Cart bottom sheet, cart items
    cart/CartConflictDialog.tsx    # Multi-restaurant cart conflict modal
    order/                         # Order tracking stepper
    profile/                       # Profile/dashboard components
    owner/                         # Owner dashboard components
    owner/PromotionCard.tsx        # Promotion management cards
    charts/                        # Chart wrapper components
    onboarding/                    # Onboarding flow components
  lib/
    supabase.ts                    # Supabase client config
    stripe.ts                      # Stripe config
    utils.ts                       # Helpers
    notifications.ts               # Push notification helpers
    geo.ts                         # Geo-query helpers (PostGIS RPC wrappers)
  hooks/
    useCart.ts                     # Cart state (Zustand)
    useRealtime.ts                 # Supabase real-time hook
    useAuth.ts                     # Auth helpers
    useLocation.ts                 # Location/GPS helpers
    useNearbyRestaurants.ts        # Geo-based restaurant fetching
    useLoyalty.ts                  # Loyalty points & streak logic
  stores/
    cartStore.ts                   # Zustand cart store
    authStore.ts                   # Zustand auth store
  types/
    index.ts                       # TypeScript interfaces
  data/
    seed.ts                        # Seed script
  assets/
    images/                        # Static image assets
    images/empty-states/           # Empty state illustrations
    fonts/                         # Custom fonts (if not using expo-google-fonts)
  constants/
    colors.ts                      # Design token colors
    typography.ts                  # Font size/weight constants
    dietary.ts                     # Dietary tag constants and labels
```

---

## Platform Considerations

### iOS Specific

- Safe area handling via `react-native-safe-area-context`
- Apple Sign-In support
- Haptic feedback via `expo-haptics`
- iOS-style navigation transitions

### Android Specific

- Material-style ripple effects
- Status bar color management
- Back button handling
- Android notification channels

### Shared

- `expo-image` for performant image loading with caching
- `expo-secure-store` for sensitive token storage
- `expo-location` for delivery address GPS
- `expo-image-picker` for camera/gallery access

---

## Empty States Design

Every empty state is a **UX opportunity** to guide user behavior. Never show a blank screen.

| Screen / Context | Empty State | CTA |
|---|---|---|
| **Favorites (first time)** | Illustration of a heart + "Save restaurants you love" | "Browse Restaurants" button |
| **Orders (first time)** | Illustration of a bag + "Your orders will appear here" | "Explore Nearby" button |
| **Cart (empty)** | Illustration of an empty plate + "Your cart is empty" | "Browse Restaurants" button |
| **Search (no results)** | Illustration of a magnifying glass + "No results for [query]" | "Try [related term]" suggestions |
| **Restaurant listing (no results)** | Illustration + "No restaurants match your filters" | "Adjust Filters" button |
| **Reviews (no reviews yet)** | "Be the first to review!" | "Write a Review" button (if user has a completed order) |
| **Favorites (all unfavorited)** | Same as first-time favorites | Same |
| **Order history (new user)** | "Place your first order!" | "Explore" button |
| **Owner: No orders today** | "No orders yet today — looking good for a promotion?" | "Create Promotion" button |
| **Owner: No reviews** | "No reviews yet. Orders usually bring reviews within a week." | — |
| **Rewards (no points)** | "Start earning points with your first order!" | "Explore Restaurants" |

**Design Guidelines**:
- Use consistent illustration style (line art or flat, match brand colors)
- Keep messages encouraging, not apologetic
- Always include a clear CTA to guide the user forward
- Animate illustration entrance (fade + slight scale, 300ms)

---

## Accessibility Checklist (Baked In From Step 1)

**Rule: Accessibility is NOT a final polish step. Every component and screen must meet these criteria as it's built.**

- [ ] Color contrast ratio 4.5:1 minimum for all text
- [ ] `accessibilityLabel` on all touchable elements and icons
- [ ] `accessibilityRole` properly set (button, link, header, etc.)
- [ ] `accessibilityState` for toggles, checkboxes, selections
- [ ] Screen reader announcement for order status updates (`AccessibilityInfo.announceForAccessibility`)
- [ ] `accessibilityHint` for non-obvious actions
- [ ] Touch targets minimum 44x44pt
- [ ] Support for dynamic type / font scaling
- [ ] Respect `AccessibilityInfo.isReduceMotionEnabled`
- [ ] Logical focus order for screen readers
- [ ] Form inputs with accessible labels
- [ ] Empty states have descriptive accessibility text
- [ ] Dietary badges announce their meaning to screen readers
- [ ] Cart conflict dialog is screen-reader friendly (focus trapped, announced)

---

## Portfolio Entry

When complete, add to portfolio:

```js
{
  id: "noana",
  name: "noana",
  categories: ["mobile"],
  description: "Restaurant discovery & food ordering app with real-time order tracking.",
  techs: ["React Native", "Expo", "NativeWind", "Supabase", "Stripe"],
  demo_link: "https://expo.dev/@username/noana", // or App Store / Play Store links
  cover: noana, // import from assets
  role: "Mobile Developer",
  year: "2026",
  inspiration:
    "Inspired by platforms like Zomato, I wanted to build a full-featured food ordering experience as a native mobile app - customer-facing storefront, real-time tracking, and a restaurant owner dashboard - to demonstrate end-to-end mobile product development.",
  features: [
    {
      image: noanaHome,
      title: "Discover",
      description: "Browse restaurants by cuisine, rating, and delivery time.",
    },
    {
      image: noanaRestaurant,
      title: "Order",
      description: "Explore menus and build your perfect order.",
    },
    {
      image: noanaTracking,
      title: "Track",
      description: "Real-time order tracking from kitchen to doorstep.",
    },
    {
      image: noanaOwner,
      title: "Manage",
      description: "Restaurant owner dashboard with live orders and analytics.",
    },
  ],
}
```

---

## LinkedIn Post Template

> Just shipped noana - a full-stack restaurant discovery & food ordering mobile app.
>
> Built with React Native (Expo), NativeWind, and Supabase:
>
> - Restaurant browsing with filters and search
> - Full menu system with cart & checkout (Stripe)
> - Real-time order tracking via Supabase subscriptions
> - Restaurant owner dashboard with revenue analytics
> - Role-based auth (customer vs restaurant owner)
> - Push notifications for order updates
>
> [Screenshot grid: Home + Restaurant Detail + Order Tracking + Owner Dashboard]
>
> Available on iOS & Android
>
> #reactnative #expo #mobile #supabase #fullstack #portfolio

---

## MVP Scope (Phase 1)

Build in this order for a working MVP. **Accessibility is baked into every step** — not a final step.

1. **Setup**: Expo project, Supabase, NativeWind, auth (email + OAuth), base accessibility utilities
2. **Navigation**: Expo Router with tab + stack navigators, onboarding flow (3 screens)
3. **Seed data**: Restaurants (with geo + dietary tags), menus (with dietary tags + prep times), structured operating hours, mock images
4. **Home screen**: Header, dietary filter chips, cuisine filters, featured restaurants, "Surprise Me" card
5. **Search screen**: Search bar, recent/trending searches, results with restaurant + dish tabs
6. **Restaurant listing**: FlatList with filter chips (including dietary), active promotion badges
7. **Restaurant detail**: Menu with dietary badges, prep times, add-to-cart
8. **Cart & Checkout**: Cart conflict dialog, bottom sheet cart, checkout screen, mock payment
9. **Order tracking**: Real-time status screen
10. **User profile**: Order history, favorites, addresses, reorder flow
11. **Loyalty system**: Points earning on orders, streak tracking, rewards display screen
12. **Owner dashboard**: Overview, menu management (with soft deletes), order board
13. **Owner promotions**: Create/manage promotions, flash deals
14. **Empty states**: Implement all empty states with illustrations and CTAs
15. **Animations & haptics**: Card press, bottom sheets, skeleton loading, order status stepper
16. **Push notifications**: Order status updates, new order alerts (owner), flash deal alerts (customer)
