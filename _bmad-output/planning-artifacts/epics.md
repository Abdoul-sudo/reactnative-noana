---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-02-22'
inputDocuments: ['NOANA.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/project-context.md']
workflowType: 'epics-and-stories'
project_name: 'noana'
user_name: 'Abdoul'
date: '2026-02-22'
---

# noana - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for noana, decomposing the requirements from NOANA.md (serving as PRD), Architecture, and project-context.md into implementable stories.

## Requirements Inventory

### Functional Requirements

**Onboarding (FR1-FR5)**
- FR1: Show onboarding flow on first app launch (3 screens + transition)
- FR2: Users can set location permissions, cuisine preferences, and dietary preferences during onboarding
- FR3: Onboarding screens have skip functionality (top-right)
- FR4: Preferences saved to profiles table after auth
- FR5: Onboarding completion flag stored in expo-secure-store

**Home Screen (FR6-FR13)**
- FR6: Header with location selector, search bar, notification bell, loyalty points badge
- FR7: Dietary filter chips (Vegan, Halal, Gluten-free, Keto) prominently displayed and toggleable
- FR8: Cuisine categories horizontally scrollable with icons
- FR9: "Surprise Me" one-tap random restaurant + popular dish (respects active dietary filters)
- FR10: Reorder section with previous orders for one-tap reorder
- FR11: Featured restaurants horizontal card carousel
- FR12: Trending dishes section with restaurant attribution
- FR13: Top rated restaurants grid (2 columns)

**Search (FR14-FR18)**
- FR14: Search bar with auto-focus, debounced input (300ms), voice search (expo-speech)
- FR15: Recent searches (last 10, swipe to dismiss, clear all)
- FR16: Trending searches display
- FR17: Search results with segmented tabs (Restaurants | Dishes)
- FR18: Dietary filter chips available in search results view

**Restaurant Listing (FR19-FR22)**
- FR19: Filter bar with horizontal scrollable chips (cuisine, price, rating, delivery time, dietary)
- FR20: Full filter options in bottom sheet
- FR21: Restaurant cards showing cover photo, name, cuisine tags, dietary badges, rating, delivery time, price range, active promotion badge
- FR22: Infinite scroll with loading footer

**Restaurant Detail (FR23-FR27)**
- FR23: Detail screen with cover photo header, restaurant info, sticky tab bar (Menu | Reviews | Info)
- FR24: Menu tab with SectionList grouped by category, dietary tags, prep times, add button, quantity selector (+/-)
- FR25: Reviews tab with average rating breakdown (5-star bar chart) and individual review cards
- FR26: Info tab with operating hours, address/map, phone (tap to call), website (tap to open)
- FR27: Floating cart summary bar at bottom when items in cart

**Cart & Checkout (FR28-FR33)**
- FR28: Cart conflict dialog when adding items from different restaurant (clear cart or keep)
- FR29: Cart bottom sheet with items, quantity controls, subtotal, delivery fee, total, swipe-to-delete
- FR30: Checkout screen with delivery address, order summary, payment, special instructions
- FR31: Saved addresses list + add new address (with GPS auto-fill)
- FR32: Mock Stripe payment integration (test mode)
- FR33: Order confirmation with navigation to tracking screen

**Order Tracking (FR34-FR39)**
- FR34: Real-time order status stepper (Placed → Confirmed → Preparing → On the Way → Delivered)
- FR35: Each step shows icon, label, timestamp with active step pulse animation
- FR36: Estimated delivery time countdown/ETA
- FR37: Restaurant contact info (tap to call)
- FR38: Push notification on status change
- FR39: Review prompt button after delivery

**Profile (FR40-FR43)**
- FR40: Order history with status, date, total, reorder button
- FR41: Favorite restaurants grid (heart toggle on cards)
- FR42: Saved addresses CRUD
- FR43: Profile settings: name, email, avatar upload (expo-image-picker), password change

**Loyalty & Rewards (FR44-FR46)**
- FR44: Loyalty points earned on order completion (server-side trigger)
- FR45: Streak tracking (consecutive days with orders, server-side trigger)
- FR46: Rewards display screen (points balance, current streak, longest streak)

**Owner Dashboard (FR47-FR50)**
- FR47: Revenue cards (today, week, month with trend arrows)
- FR48: Revenue chart (30-day area chart)
- FR49: Orders today count + status breakdown (donut chart)
- FR50: Top dishes leaderboard

**Owner Menu Management (FR51-FR54)**
- FR51: Category CRUD (add/edit/delete categories)
- FR52: Item CRUD (name, description, price, image upload, category, availability toggle, dietary tags)
- FR53: Drag-and-drop reorder for items within categories
- FR54: Bulk actions (mark multiple items unavailable)

**Owner Orders (FR55-FR60)**
- FR55: Segmented tabs by status (New, Confirmed, Preparing, Ready, Completed)
- FR56: Order cards with order #, items summary, total, time since placed
- FR57: Tap to expand full order details + customer info
- FR58: Status update buttons (move to next stage)
- FR59: Real-time new order appearance via Supabase
- FR60: Push notification + sound on new order

**Owner Reviews (FR61-FR63)**
- FR61: Average rating display with trend
- FR62: Review list with ability to reply
- FR63: Filter reviews by rating

**Owner Promotions (FR64-FR68)**
- FR64: Create promotion (name, discount type/value, applicable items, dates, push toggle)
- FR65: Active promotions list with performance stats
- FR66: Flash deal quick-create (time-limited)
- FR67: Promotion history with ROI summary
- FR68: Toggle to activate/deactivate promotions

**Owner Settings (FR69-FR71)**
- FR69: Restaurant info edit (name, description, cover photo, logo)
- FR70: Operating hours management
- FR71: Delivery settings (radius, fee, minimum order)

**Auth (FR72-FR74)**
- FR72: Email/password signup and login
- FR73: Role-based navigation (customer vs owner)
- FR74: Session persistence and auto-refresh

**Empty States (FR75)**
- FR75: All 12 empty state contexts with illustrations, encouraging messages, and CTAs

**Push Notifications (FR76-FR77)**
- FR76: Push notification for order status changes → customer
- FR77: Push notification for new orders → owner

### NonFunctional Requirements

**Performance**
- NFR1: UI-thread animations via react-native-reanimated v4
- NFR2: Skeleton loading screens for all async content (no blank screens, no spinners)
- NFR3: FlatList/SectionList for all lists (never ScrollView + .map())
- NFR4: expo-image for all images (built-in caching)
- NFR5: React Compiler handles optimization (no manual useMemo/useCallback/React.memo)
- NFR6: Debounced search (300ms delay)
- NFR7: Pull-to-refresh on all list screens

**Accessibility**
- NFR8: Color contrast ratio 4.5:1 minimum for all text
- NFR9: accessibilityLabel on all touchable elements and icons
- NFR10: accessibilityRole properly set (button, link, header, etc.)
- NFR11: accessibilityState for toggles, checkboxes, selections
- NFR12: Touch targets minimum 44x44pt
- NFR13: Support for dynamic type / font scaling
- NFR14: Respect AccessibilityInfo.isReduceMotionEnabled for animations
- NFR15: Screen reader announcement for order status updates
- NFR16: Form inputs with accessible labels
- NFR17: Cart conflict dialog is screen-reader friendly (focus trapped)

**Security**
- NFR18: RLS enabled on every Supabase table
- NFR19: Soft deletes for restaurants, menu_items, menu_categories (deleted_at IS NULL filter)
- NFR20: Never expose service_role key on client
- NFR21: SecureStore for auth token persistence
- NFR22: Stripe test mode only (never real keys)

**UX**
- NFR23: Haptic feedback on key interactions (add to cart, place order)
- NFR24: Dark theme for owner dashboard (stone-900 background)
- NFR25: Custom fonts (Playfair Display SC + Karla) loaded via expo-font

**Constraints**
- NFR26: Expo managed workflow (no native module linking outside Expo)
- NFR27: Supabase free tier compatible (no PostGIS, limited Edge Functions)
- NFR28: Single timezone assumption for MVP (one city)
- NFR29: Mock payment only (Stripe test mode)
- NFR30: Social layer deferred to Phase 2
- NFR31: No offline support (show "No connection" screen with retry)
- NFR32: Push to nearby customers deferred to Phase 2

### Additional Requirements

**From Architecture — Starter & Setup:**
- AR1: Project initialized with create-expo-app --template tabs (already done)
- AR2: Template cleanup required (delete hello-wave, parallax-scroll-view, external-link, collapsible, explore.tsx, modal.tsx, reset-project.js, React logo images)
- AR3: Install core libraries: NativeWind v4.2, Supabase v2.97, Zustand v5, Bottom Sheet v5, Lucide, RHF+Zod, Prettier
- AR4: Create missing directories: stores/, lib/, lib/api/, types/, constants/
- AR5: Replace @expo/vector-icons with lucide-react-native
- AR6: Create .env.example and .prettierrc

**From Architecture — Database & Backend:**
- AR7: Supabase CLI local development with Docker (supabase init + supabase start)
- AR8: SQL migration files with timestamp-based naming (supabase migration new)
- AR9: Migrations split by domain: core → orders → social → growth → RLS/RPC/triggers
- AR10: SQL seed file (supabase/seed.sql) with demo data
- AR11: Supabase client singleton in lib/supabase.ts (typed with Database generic, SecureStore auth)
- AR12: Centralized data access in lib/api/*.ts (fetch/create/update/softDelete naming)
- AR13: Supabase Storage: public buckets for restaurant/menu images, private for avatars
- AR14: lib/storage.ts for centralized image upload logic
- AR15: delivery_address is jsonb snapshot (not FK to addresses table)

**From Architecture — Auth:**
- AR16: Email-only auth for MVP (OAuth deferred to post-MVP)
- AR17: Single profiles.role column with CHECK constraint ('customer' | 'owner')
- AR18: Auth hydration 3-state flow: hydrating → unauthenticated → role redirect
- AR19: Auth guard in root _layout.tsx only

**From Architecture — Navigation:**
- AR20: Route groups: (auth), (tabs) for 5 customer tabs, (owner) for 5 owner tabs
- AR21: Profile sub-screens outside (tabs): profile/addresses, profile/rewards, profile/settings
- AR22: Shared screens outside groups: restaurant/[slug], order/[id], checkout
- AR23: Tab icons assigned (customer: Home, Search, Heart, ClipboardList, User; owner: LayoutDashboard, ChefHat, UtensilsCrossed, Tag, Settings)

**From Architecture — Infrastructure:**
- AR24: 2 Edge Functions: notify-order-status, notify-new-order with _shared/push.ts
- AR25: Real-time channels: order-tracking:{orderId}, owner-orders:{restaurantId}
- AR26: EAS Build for distribution (skip OTA for MVP)
- AR27: Single Supabase project (no dev/prod separation)
- AR28: Loyalty streak calculation as Supabase DB trigger on orders table

**From Architecture — Patterns:**
- AR29: Data flow: DB → lib/api/ → hooks/ → components/ (one direction only)
- AR30: Form pattern: Zod schema → inferred type → zodResolver → Controller
- AR31: Bottom sheet: ref-based, local state, never Zustand
- AR32: Empty state: single config-driven component (constants/empty-states.ts)
- AR33: Error state: always provides retry action
- AR34: Loading: skeleton screens per domain, Reanimated opacity pulse

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1–FR5 | Epic 1 | Onboarding flow, permissions, preferences, skip, completion flag |
| FR6–FR9, FR11–FR13 | Epic 2 | Home header, dietary filters, cuisine categories, Surprise Me, featured, trending, top rated |
| FR10 | Epic 5 | Reorder section (needs orders table — moved from Epic 2) |
| FR14–FR18 | Epic 3 | Search bar, recent searches, trending, results tabs, dietary filters |
| FR19–FR22 | Epic 3 | Filter bar, bottom sheet filters, restaurant cards, infinite scroll |
| FR23–FR27 | Epic 4 | Restaurant detail, menu SectionList, reviews tab, info tab, floating cart bar |
| FR10 | Epic 5 | Reorder section on home screen (one-tap reorder from previous orders) |
| FR28–FR33 | Epic 5 | Cart conflict, cart sheet, checkout, addresses, Stripe mock, confirmation |
| FR34–FR39 | Epic 5 | Order stepper, timestamps, ETA, restaurant contact, push, review prompt |
| FR40–FR43 | Epic 6 | Order history, favorites, saved addresses, profile settings |
| FR44–FR46 | Epic 6 | Loyalty points, streaks, rewards display |
| FR47–FR50 | Epic 7 | Revenue cards, chart, orders donut, top dishes |
| FR51–FR54 | Epic 7 | Category CRUD, item CRUD, drag-and-drop, bulk actions |
| FR55–FR60 | Epic 8 | Order tabs, cards, expand details, status update, real-time, push+sound |
| FR61–FR63 | Epic 9 | Average rating, review list+reply, filter reviews |
| FR64–FR68 | Epic 9 | Create promotion, active list, flash deals, history, toggle |
| FR69–FR71 | Epic 7 | Restaurant info edit, hours, delivery settings |
| FR72–FR74 | Epic 1 | Signup/login, role routing, session persistence |
| FR75 | Epics 2–9 | Distributed as acceptance criteria per feature (12 empty state contexts) |
| FR76 | Epic 5 | Push notification on order status change |
| FR77 | Epic 8 | Push notification for new orders |

**All 77 FRs covered. Zero gaps.**

### NFR Distribution

| NFR | Scope | Notes |
|-----|-------|-------|
| NFR1–NFR7 (Performance) | All epics | Skeleton loading, FlatList, debounce, pull-to-refresh — enforced per story |
| NFR8–NFR17 (Accessibility) | All epics | Contrast, labels, roles, touch targets, dynamic type — enforced per story |
| NFR18 (RLS) | Epic 1 | Set up with initial migrations |
| NFR19–NFR22 (Security) | All epics | Soft deletes, no service_role, SecureStore, Stripe test mode |
| NFR23 (Haptics) | Epic 5 | Add to cart, place order interactions |
| NFR24 (Dark theme) | Epic 7 | Owner dashboard stone-900 background |
| NFR25 (Custom fonts) | Epic 1 | Loaded via expo-font in foundation |
| NFR26 (Expo managed) | Epic 1 | Constraint applied from start |
| NFR27–NFR30 (Constraints) | All epics | Free tier, single timezone, mock payment, social deferred |
| NFR31 (No connection) | Epic 1 | "No connection" screen with retry in foundation |
| NFR32 (Push nearby) | Deferred | Phase 2 |

### AR Distribution

| AR | Epic | Notes |
|----|------|-------|
| AR1–AR6 (Setup) | Epic 1 | Template cleanup, install libraries, directories, .env |
| AR7–AR15 (DB & Backend) | Epic 1 | Supabase CLI, migrations, client singleton, storage |
| AR16–AR19 (Auth) | Epic 1 | Email-only, role column, hydration, guard |
| AR20–AR23 (Navigation) | Epic 1 | Route groups, tab icons, shared screens |
| AR24–AR25 (Edge Functions, Real-time) | Epics 5, 8 | notify-order-status in Epic 5, notify-new-order in Epic 8 |
| AR26–AR27 (Infrastructure) | Epic 1 | EAS Build, single Supabase project |
| AR28 (Loyalty trigger) | Epic 6 | DB trigger on orders table |
| AR29–AR34 (Patterns) | All epics | First epic using a pattern owns its setup story |

### Cross-Cutting Pattern Ownership

| Pattern | First Used | Setup Story In |
|---------|-----------|----------------|
| AR30: Form pattern (Zod + RHF) | Epic 1 (signup/login) | Epic 1 |
| AR34: Skeleton loading | Epic 2 (home feed) | Epic 2 |
| AR32: Empty state component | Epic 2 (home empty) | Epic 2 |
| AR33: Error state with retry | Epic 2 (home errors) | Epic 2 |
| AR31: Bottom sheet pattern | Epic 3 (filter sheet) | Epic 3 |
| AR29: Data flow (lib/api → hooks → components) | Epic 1 (auth) | Epic 1 |

## Epic List

### Epic 1: Project Foundation, Auth & Onboarding
Users can install the app, create an account, complete personalized onboarding, and land on the correct home screen based on their role (customer vs owner).
**FRs:** FR1–FR5, FR72–FR74 (8 FRs)
**ARs:** AR1–AR28 (project setup, DB, auth, navigation, infrastructure)
**NFRs:** NFR18 (RLS), NFR25 (fonts), NFR26 (Expo managed), NFR31 (no connection screen)
**Pattern setup:** AR29 (data flow), AR30 (form pattern)
**Stories:** 5

#### Story 1.1: Project Cleanup & Core Dependencies

As a **developer**,
I want the project cleaned up from template defaults and all core libraries installed,
So that the codebase is ready for feature development.

**Acceptance Criteria:**

**Given** the existing create-expo-app tabs template
**When** the cleanup is performed
**Then** the following files are deleted: `components/HelloWave.tsx`, `components/ParallaxScrollView.tsx`, `components/ExternalLink.tsx`, `components/Collapsible.tsx`, `app/(tabs)/explore.tsx`, `app/+not-found.tsx` placeholder content, `scripts/reset-project.js`, React logo images
**And** `@expo/vector-icons` imports are replaced with `lucide-react-native`
**And** the following libraries are installed: NativeWind v4.2, @supabase/supabase-js v2.97, zustand v5, @gorhom/bottom-sheet v5, lucide-react-native, react-hook-form + @hookform/resolvers + zod, prettier
**And** NativeWind is configured with `nativewind/preset` in `tailwind.config.js`
**And** the following directories are created: `stores/`, `lib/`, `lib/api/`, `types/`, `constants/`, `hooks/`
**And** `lib/storage.ts` is created as an empty module (populated in Epics 6 and 7 to prevent parallel conflicts)
**And** `.env.example` is created with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
**And** `.prettierrc` is configured
**And** custom fonts (Playfair Display SC + Karla) are loaded via `expo-font` in root layout with `useFonts()` loading gate
**And** NativeWind fontFamily config maps display, display-bold, sans, sans-light, sans-medium, sans-semibold, sans-bold
**And** Jest is configured and the default test passes (test infrastructure ready from day 1)
**And** the app compiles and launches without errors
**And** all existing tests continue to pass

#### Story 1.2: Supabase Local Development Setup

As a **developer**,
I want Supabase running locally with a typed client singleton,
So that I can develop against a local database with full type safety.

**Acceptance Criteria:**

**Given** Docker is running
**When** `supabase init` and `supabase start` are executed
**Then** a local Supabase instance is running with Dashboard, Auth, Storage, and Realtime
**And** `lib/supabase.ts` contains a typed client singleton using `createClient<Database>()` with SecureStore for auth token persistence, `autoRefreshToken: true`, `persistSession: true`, and `detectSessionInUrl: false`
**And** `.env` is populated with local Supabase URL and anon key
**And** `supabase/config.toml` is properly configured
**And** `supabase/seed.sql` is created with structure comments (extended per epic as tables are added)
**And** the data flow pattern is established: DB → `lib/api/` → `hooks/` → `components/` (AR29)
**And** the app can connect to the local Supabase instance
**And** all existing tests continue to pass

#### Story 1.3: Email Signup & Login

As a **user**,
I want to create an account with email/password and log in,
So that I can access the app securely.

**Acceptance Criteria:**

**Given** no account exists for my email
**When** I navigate to the signup screen and submit a valid email, password, and role selection (customer/owner)
**Then** a new account is created in Supabase Auth
**And** a row is inserted in the `profiles` table with my role (CHECK constraint: 'customer' | 'owner')
**And** I am redirected to the appropriate flow

**Given** I have an existing account
**When** I enter my email and password on the login screen
**Then** I am authenticated and redirected based on my role

**Given** I submit an invalid form (empty fields, invalid email, short password)
**When** validation runs
**Then** inline error messages are displayed using Zod schema + RHF Controller pattern (AR30)
**And** form validation errors display correctly for: empty email, invalid email format, password under 8 characters

**Given** the signup or login screens
**When** they render
**Then** they use the design system: `red-50` background, `red-600` primary buttons, Playfair Display SC for headings, Karla for body text

**DB migration:** Creates `profiles` table with `id (uuid, FK to auth.users)`, `role (text, CHECK 'customer'|'owner')`, `display_name`, `email`, `avatar_url`, `cuisine_preferences (jsonb)`, `dietary_preferences (jsonb)`, `onboarding_completed (boolean default false)`, `created_at`, `updated_at`
**RLS:** Users can only read/update their own profile row (NFR18)
**Seed:** Test user accounts added to `supabase/seed.sql` (1 customer, 1 owner)
**Pattern setup:** First use of Zod + RHF + Controller form pattern (AR30)
**And** all existing tests continue to pass

#### Story 1.4: Role-Based Navigation & Session Persistence

As a **user**,
I want to stay logged in across app restarts and see the correct interface for my role,
So that I don't need to log in repeatedly and I always see relevant content.

**Acceptance Criteria:**

**Given** I am not authenticated
**When** the app launches
**Then** I see the login/signup screens in the `(auth)` route group

**Given** I am authenticated as a customer
**When** the app launches or I complete login
**Then** I am redirected to `(tabs)` with 5 tabs: Home, Search, Favorites, Orders, Profile (icons: Home, Search, Heart, ClipboardList, User from Lucide)

**Given** I am authenticated as an owner
**When** the app launches or I complete login
**Then** I am redirected to `(owner)` with 5 tabs: Dashboard, Orders, Menu, Promotions, Settings (icons: LayoutDashboard, ChefHat, UtensilsCrossed, Tag, Settings from Lucide)

**Given** auth state is loading (hydrating)
**When** the app launches
**Then** a splash/loading screen is shown (3-state: hydrating → unauthenticated → role redirect) (AR18)

**Given** I refresh/restart the app while authenticated
**When** the app relaunches
**Then** I land directly on my role-appropriate tab layout without seeing the login screen (no flash)

**Given** the device has no internet connection
**When** the app launches
**Then** a "No connection" screen is shown with a retry button (NFR31)

**Route files created with placeholder content (correct structure from day 1):**
- `(auth)/login.tsx`, `(auth)/signup.tsx`, `(auth)/onboarding.tsx`
- `(tabs)/index.tsx`, `(tabs)/search.tsx`, `(tabs)/favorites.tsx`, `(tabs)/orders.tsx`, `(tabs)/profile.tsx`
- `(owner)/index.tsx`, `(owner)/orders.tsx`, `(owner)/menu.tsx`, `(owner)/promotions.tsx`, `(owner)/settings.tsx`
- `restaurant/[slug].tsx`, `order/[id].tsx`, `checkout.tsx`
- `profile/addresses.tsx`, `profile/rewards.tsx`, `profile/settings.tsx`

**And** auth guard logic lives in root `_layout.tsx` only (AR19)
**And** session auto-refreshes silently (FR74)
**And** all existing tests continue to pass
**Note:** Heaviest story in Epic 1 (~2 days)

#### Story 1.5: Onboarding Flow

As a **new user**,
I want a guided onboarding experience to set my preferences,
So that the app is personalized for me from the start.

**Acceptance Criteria:**

**Given** I just signed up and haven't completed onboarding
**When** I am redirected after signup
**Then** I see a 3-screen onboarding flow with smooth Reanimated transitions between screens (FR1, NFR1)

**Given** I am on the location permissions screen
**When** I grant or skip location permissions
**Then** my choice is recorded and I advance to the next screen (FR2)

**Given** I am on the cuisine preferences screen
**When** I select my preferred cuisines (multi-select chips) or skip
**Then** my selections are recorded and I advance to the next screen (FR2)

**Given** I am on the dietary preferences screen
**When** I select my dietary preferences (Vegan, Halal, Gluten-free, Keto as toggleable chips with `red-600` active state) or skip
**Then** my selections are saved to the `profiles` table `cuisine_preferences` and `dietary_preferences` jsonb columns (FR4)

**Given** any onboarding screen
**When** I tap "Skip" in the top-right corner
**Then** that screen is skipped and I advance (FR3)

**Given** I complete or skip all onboarding screens
**When** onboarding finishes
**Then** `onboarding_completed` is set to `true` in the profiles table
**And** a completion flag is stored in `expo-secure-store` (FR5)
**And** I am redirected to the home screen
**And** subsequent app launches skip onboarding
**And** all existing tests continue to pass

### Epic 2: Home & Discovery Feed
Customers can browse the home screen with featured restaurants, trending dishes, top rated grid, cuisine categories, dietary filter chips, and "Surprise Me".
**FRs:** FR6–FR9, FR11–FR13 (7 FRs)
**FR75:** Home empty states as acceptance criteria
**Pattern setup:** AR34 (skeleton loading), AR32 (empty state component), AR33 (error state with retry)
**Note:** FR10 (Reorder) moved to Epic 5 — requires orders table.
**Stories:** 6

#### Story 2.1: Restaurant & Menu Database Schema

As a **developer**,
I want the restaurant and menu database tables created with seed data and location-based RPC,
So that the home screen has real data to display and location-aware queries work.

**Acceptance Criteria:**

**Given** the Supabase local instance is running
**When** the migration is applied
**Then** the following tables are created:
- `restaurants` (id, owner_id, name, slug, description, cover_image_url, logo_url, cuisine_type, price_range, rating, delivery_time_min, delivery_fee, minimum_order, address, latitude, longitude, phone, website, dietary_options jsonb, is_open, deleted_at, created_at, updated_at)
- `menu_categories` (id, restaurant_id, name, sort_order, deleted_at, created_at)
- `menu_items` (id, category_id, restaurant_id, name, description, price integer, image_url, dietary_tags jsonb, prep_time_min, is_available, deleted_at, created_at, updated_at)
**And** RLS policies are created: customers can read active restaurants/items (`deleted_at IS NULL`), owners can CRUD their own restaurant's data (NFR18, NFR19)
**And** a `nearby_restaurants` RPC function is created using Haversine formula, accepting latitude, longitude, radius_km, and optional dietary_options filter
**And** `supabase/seed.sql` is extended with 4-6 demo restaurants (varied cuisines, dietary options, ratings), each with 2-3 menu categories and 5-8 menu items with varied dietary tags
**And** `lib/api/restaurants.ts` is created with `fetchRestaurants()`, `fetchNearbyRestaurants()`, `fetchRestaurantBySlug()` following AR12 naming
**And** `lib/api/menu.ts` is created with `fetchMenuByRestaurant()` following AR12 naming
**And** data access functions throw on error and return data directly (AR29)
**And** all existing tests continue to pass

#### Story 2.2: Skeleton Loading & Empty State Components

As a **customer**,
I want to see loading skeletons while content loads and helpful empty states when no content exists,
So that the app feels responsive and guides me when there's nothing to show.

**Acceptance Criteria:**

**Given** any async content is loading on the home screen
**When** data is being fetched
**Then** skeleton loading placeholders are shown (Reanimated opacity pulse animation) — never blank screens, never spinners (NFR2, AR34)

**Given** a section has no content (e.g., no featured restaurants, no trending dishes)
**When** the section renders
**Then** a config-driven empty state component displays an illustration, encouraging message, and CTA (AR32, FR75)
**And** empty state config is defined in `constants/empty-states.ts`

**Given** a data fetch fails
**When** an error occurs
**Then** an error state is shown with a retry action button (AR33)

**And** skeleton components are co-located with their real components (e.g., `components/ui/restaurant-card.tsx` alongside `components/ui/restaurant-card-skeleton.tsx`)
**And** `components/ui/empty-state.tsx` is a reusable config-driven component
**And** `components/ui/error-state.tsx` is a reusable component with retry prop
**And** all existing tests continue to pass

#### Story 2.3: Home Screen Header & Dietary Filters

As a **customer**,
I want a home screen header with location, search access, notifications, and dietary filter chips,
So that I can quickly filter restaurants by my dietary needs and access key features.

**Acceptance Criteria:**

**Given** I am on the home screen
**When** the header renders
**Then** I see a location selector (displays current location or "Select location"), search bar (tappable, navigates to search screen), notification bell icon (tapping navigates to notifications placeholder screen showing "No notifications yet" empty state), and loyalty points badge showing "0 pts" fallback (real data in Epic 6) (FR6)

**Given** the dietary filter chips are displayed
**When** I tap a chip (Vegan, Halal, Gluten-free, Keto)
**Then** it toggles on/off with `red-600` active state and `red-200` border inactive state (FR7)
**And** active filters are applied to all sections below (featured, trending, top rated)
**And** multiple filters can be active simultaneously
**And** filters persist within the session

**And** dietary filter state is managed via `hooks/use-dietary-filters.ts` custom hook (reusable in Epic 3 search)
**And** the header uses Playfair Display SC for the app title, Karla for labels
**And** skeleton loading shows while data is fetching
**And** pull-to-refresh is supported (NFR7)
**And** all touchable elements have `accessibilityLabel` and minimum 44x44pt touch targets (NFR9, NFR12)
**And** all existing tests continue to pass

#### Story 2.4: Cuisine Categories & Featured Restaurants

As a **customer**,
I want to browse cuisine categories and see featured restaurants,
So that I can discover restaurants by cuisine type and find promoted options.

**Acceptance Criteria:**

**Given** I am on the home screen
**When** the cuisine categories section renders
**Then** I see a horizontally scrollable FlatList of cuisine category icons with labels (FR8)
**And** tapping a category navigates to filtered restaurant listing

**Given** I am on the home screen
**When** the featured restaurants section renders
**Then** I see a horizontal card carousel (FlatList, horizontal) of restaurant cards (FR11)
**And** each card shows: cover photo (expo-image), restaurant name, cuisine tags, dietary badges, rating (yellow-600 stars), delivery time, price range
**And** tapping a card navigates to `restaurant/[slug]`

**And** dietary filters from Story 2.3 are applied to featured restaurants
**And** both sections use skeleton loading while fetching
**And** empty states are shown when no data exists
**And** all images use `expo-image` for caching (NFR4)
**And** all existing tests continue to pass

#### Story 2.5: Trending Dishes & Top Rated Restaurants

As a **customer**,
I want to see trending dishes and top rated restaurants,
So that I can discover popular food and highly-rated places.

**Acceptance Criteria:**

**Given** I am on the home screen
**When** the trending dishes section renders
**Then** I see dish cards with restaurant attribution in a horizontal FlatList (FR12)
**And** each card shows: dish image, dish name, price, restaurant name
**And** tapping a dish card navigates to the restaurant detail page

**Given** I am on the home screen
**When** the top rated restaurants section renders
**Then** I see a 2-column grid of restaurant cards (FlatList with numColumns=2) (FR13)
**And** cards show: cover photo, name, rating, cuisine, delivery time

**And** dietary filters from Story 2.3 are applied to both sections
**And** skeleton loading for both sections
**And** empty states when no data matches active filters
**And** all existing tests continue to pass

#### Story 2.6: "Surprise Me" Feature

As a **customer**,
I want a one-tap "Surprise Me" button that picks a random restaurant and popular dish,
So that I can discover something new when I'm feeling adventurous.

**Acceptance Criteria:**

**Given** I am on the home screen
**When** I tap the "Surprise Me" button
**Then** the app selects a random restaurant and its most popular dish (FR9)
**And** the selection respects my currently active dietary filters
**And** a visually engaging reveal animation plays (Reanimated)
**And** I can tap to navigate to the selected restaurant's detail page

**Given** no restaurants match my active dietary filters
**When** I tap "Surprise Me"
**Then** an appropriate message is shown suggesting I adjust filters

**And** the button is prominently placed on the home screen
**And** `accessibilityLabel="Surprise me with a random restaurant"` is set (NFR9)
**And** all existing tests continue to pass

### Epic 3: Search & Restaurant Listing
Customers can search with debounced input, view recent/trending searches, see segmented results, and browse filtered restaurant listings with infinite scroll.
**FRs:** FR14–FR22 (9 FRs)
**FR75:** Search/listing empty states as acceptance criteria
**Pattern setup:** AR31 (bottom sheet pattern for filters)
**Note:** FR14 voice search deferred — no Expo managed-compatible speech recognition package. Text search only for MVP.
**Stories:** 4

#### Story 3.1: Search Screen & Debounced Input

As a **customer**,
I want to search for restaurants and dishes with instant suggestions,
So that I can quickly find what I'm looking for.

**Acceptance Criteria:**

**Given** I tap the search bar on the home screen
**When** the search screen opens
**Then** the search input auto-focuses with keyboard visible (FR14)

**Given** I type in the search input
**When** I pause typing for 300ms
**Then** search results are fetched (debounced, NFR6, FR14)

**Given** the search input is empty
**When** the search screen is open
**Then** I see recent searches and trending searches (pre-search state)

**Note:** Voice search (FR14 partial) deferred — no Expo managed-compatible speech recognition package available. Search input is text-only for MVP.
**And** skeleton loading shows while results are fetching
**And** the search input has `accessibilityLabel="Search restaurants and dishes"` (NFR9)
**And** all existing tests continue to pass

#### Story 3.2: Recent & Trending Searches

As a **customer**,
I want to see my recent searches and trending searches,
So that I can quickly repeat past searches or discover what's popular.

**Acceptance Criteria:**

**Given** I have previous searches
**When** the search screen opens (before typing)
**Then** I see my last 10 recent searches displayed (FR15)

**Given** I see a recent search item
**When** I swipe it to dismiss
**Then** it is removed from recent searches (FR15)

**Given** recent searches are displayed
**When** I tap "Clear all"
**Then** all recent searches are removed (FR15)

**Given** the search screen opens
**When** trending searches data is available
**Then** I see a trending searches section below recent searches (FR16)

**And** recent searches are stored locally using AsyncStorage (not SecureStore — not sensitive data)
**And** empty state shown when no recent or trending searches exist (FR75)
**DB migration:** Creates `trending_searches` table (id, query text, display_order integer)
**Seed:** 5-8 trending search terms added to `supabase/seed.sql`
**And** all existing tests continue to pass

#### Story 3.3: Search Results with Segmented Tabs

As a **customer**,
I want search results organized into Restaurants and Dishes tabs with dietary filters,
So that I can find exactly what I need.

**Acceptance Criteria:**

**Given** I have entered a search query
**When** results are returned
**Then** I see segmented tabs: Restaurants | Dishes (FR17)
**And** the Restaurants tab shows restaurant cards matching the query
**And** the Dishes tab shows dish cards with restaurant attribution matching the query

**Given** I am on the search results view
**When** dietary filter chips are displayed
**Then** I can toggle Vegan, Halal, Gluten-free, Keto to filter results (FR18)
**And** filters use `hooks/use-dietary-filters.ts` (same hook as home screen)

**Given** the search returns no results
**When** the results area renders
**Then** an empty state is shown with suggestion to try different keywords (FR75)

**And** `lib/api/restaurants.ts` adds `fetchRestaurantsBySearch(query, filters?)` using Supabase `.ilike()` for MVP text matching
**And** `lib/api/menu.ts` adds `fetchDishesBySearch(query, filters?)` using Supabase `.ilike()`
**And** result lists use FlatList for performance (NFR3)
**And** skeleton loading while switching tabs
**And** all existing tests continue to pass

#### Story 3.4: Restaurant Listing with Filters, Cards & Infinite Scroll

As a **customer**,
I want to browse a full restaurant listing with filter chips, detailed cards, and infinite scroll,
So that I can narrow down options and browse extensively without performance issues.

**Acceptance Criteria:**

**Given** I navigate to the restaurant listing (from cuisine category, search, or filter)
**When** the listing screen renders
**Then** I see a horizontal scrollable filter chip bar at the top with: cuisine, price range, rating, delivery time, dietary (FR19)
**And** tapping a chip toggles that filter with `red-600` active styling

**Given** I want more filter options
**When** I tap "Filters" (funnel icon)
**Then** a bottom sheet opens with full filter options (FR20)
**And** the bottom sheet uses `useRef<BottomSheetModal>(null)` with snap points `['50%', '80%']` (AR31)
**And** backdrop dimming with touch-to-dismiss is enabled
**And** filter state is local to the bottom sheet, applied on "Apply" button tap

**Given** the restaurant listing is displayed
**When** each restaurant card renders
**Then** it shows: cover photo (expo-image), restaurant name, cuisine tags, dietary badges, rating (yellow-600), delivery time, price range, active promotion badge if applicable (FR21)
**And** tapping a card navigates to `restaurant/[slug]`

**Given** I scroll to the bottom of the listing
**When** more restaurants are available
**Then** a loading footer appears and the next page loads automatically (infinite scroll) (FR22)
**And** pagination uses Supabase `.range()` with `{ count: 'exact' }` returning `{ data, hasMore }` pattern

**Given** all restaurants have been loaded
**When** I scroll to the bottom
**Then** no loading footer appears (end of list)

**And** `lib/api/restaurants.ts` adds `fetchRestaurantsPaginated({ page, limit, filters })` with `.range()` pagination
**And** the listing uses FlatList with `onEndReached` and `onEndReachedThreshold={0.5}` (NFR3)
**And** pull-to-refresh resets to page 0 (NFR7)
**And** skeleton loading while filters are applied
**And** empty state when no restaurants match filters (FR75)
**And** all images use `expo-image` for caching (NFR4)
**And** cards have `accessibilityLabel` with restaurant name, rating, and cuisine (NFR9)
**And** all existing tests continue to pass
**Pattern setup:** First use of bottom sheet ref-based pattern (AR31)

### Epic 4: Restaurant Experience & Menu
Customers can view full restaurant details with sticky tab bar (Menu | Reviews | Info), browse categorized menus with dietary tags, read reviews, and see the floating cart bar.
**FRs:** FR23–FR27 (5 FRs)
**FR75:** Restaurant detail empty states as acceptance criteria
**Stories:** 4

#### Story 4.1: Restaurant Detail Header & Sticky Tab Bar

As a **customer**,
I want to see a restaurant's cover photo, key info, and navigate between Menu, Reviews, and Info tabs,
So that I can explore everything about a restaurant in one place.

**Acceptance Criteria:**

**Given** I tap a restaurant card from any listing
**When** the `restaurant/[slug]` screen loads
**Then** I see a cover photo header with the restaurant's cover image (expo-image) (FR23)
**And** below the photo: restaurant name (Playfair Display SC), cuisine tags, dietary badges, rating (yellow-600), delivery time, price range
**And** a sticky tab bar is displayed with three tabs: Menu | Reviews | Info (FR23)
**And** tapping a tab switches the displayed content
**And** the tab bar sticks to the top when scrolling past the header

**Implementation pattern:** Single SectionList approach to avoid nested virtualized lists:
- `ListHeaderComponent` = cover photo + restaurant info
- Tab bar rendered as sticky element via `stickyHeaderIndices`
- `sections` data swaps based on active tab (Menu: category sections, Reviews: review list, Info: info content)

**And** data is fetched via `fetchRestaurantBySlug(slug)` with PostgREST cascading query:
```
restaurants → menu_categories → menu_items
           → reviews → profiles:user_id (display_name, avatar_url)
```
Single query, all data (AR29 cascading data pattern)
**And** skeleton loading while data loads
**And** `accessibilityRole="header"` on restaurant name (NFR10)
**And** all existing tests continue to pass

#### Story 4.2: Menu Tab with Categories & Items

As a **customer**,
I want to browse the restaurant's menu organized by category with dietary tags and an add button,
So that I can find dishes I want and start building my order.

**Acceptance Criteria:**

**Given** I am on the Menu tab of a restaurant
**When** the menu renders
**Then** I see sections grouped by menu category in the SectionList (FR24)
**And** each section header shows the category name
**And** each item shows: name, description, price (formatted), dietary tags (badges), prep time, and an "Add" button

**Given** I tap the "Add" button on a menu item
**When** the item is added
**Then** a quantity selector (+/-) appears in place of the Add button (FR24)
**And** the item is added to the cart (Zustand cart store)

**Given** I adjust quantity with +/-
**When** quantity reaches 0
**Then** the item is removed from cart and the Add button reappears

**And** Zustand cart store created in `stores/cart.ts` with: addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount, restaurant_id tracking
**And** items with `is_available: false` are shown greyed out with "Unavailable" label
**And** dietary tag badges use consistent styling (e.g., green for Vegan, etc.)
**And** empty state if restaurant has no menu items (FR75)
**And** all existing tests continue to pass

#### Story 4.3: Reviews Tab & Info Tab

As a **customer**,
I want to read reviews and see restaurant information,
So that I can make an informed decision before ordering.

**Acceptance Criteria:**

**Given** I am on the Reviews tab
**When** reviews render
**Then** I see an average rating breakdown with a 5-star bar chart showing distribution (FR25)
**And** below the breakdown, individual review cards are displayed with: reviewer name, avatar, rating, date, review text

**Given** the restaurant has no reviews
**When** the Reviews tab renders
**Then** an empty state is shown encouraging the first review (FR75)

**Given** I am on the Info tab
**When** the info renders
**Then** I see: operating hours (highlighted if currently open/closed), address with map preview, phone number (tap to call via `Linking.openURL`), website (tap to open in browser) (FR26)

**DB migration:** Creates `reviews` table (id, restaurant_id, user_id, rating integer, comment text, owner_reply text, owner_reply_at timestamp, created_at)
**Note:** `owner_reply` columns created now (used by Epic 9, Story 9.2) to avoid ALTER TABLE later.
**RLS:** Users can read all reviews. Review creation RLS added in Epic 5 (FR39 — review after delivery).
**Seed:** 5-10 demo reviews spread across seeded restaurants added to `supabase/seed.sql`
**And** `lib/api/reviews.ts` created with `fetchReviewsByRestaurant(restaurantId)`
**Note:** Reviews tab is read-only in this epic. Review creation comes in Epic 5 (FR39).
**And** all existing tests continue to pass

#### Story 4.4: Floating Cart Summary Bar

As a **customer**,
I want to see a floating cart summary at the bottom when I have items in my cart,
So that I can quickly see my total and proceed to checkout.

**Acceptance Criteria:**

**Given** I have items in my cart from this restaurant
**When** the restaurant detail screen is displayed
**Then** a floating bar appears at the bottom showing: item count, subtotal, and a "View Cart" button (FR27)

**Given** my cart is empty
**When** the restaurant detail screen is displayed
**Then** no floating bar is shown

**Given** I tap "View Cart"
**When** the action triggers
**Then** a placeholder alert/toast shows cart summary (full cart bottom sheet implemented in Epic 5)

**And** the floating bar reads from Zustand cart store (created in Story 4.2)
**And** the floating bar uses Reanimated for slide-in/slide-out animation
**And** `accessibilityLabel` includes item count and total (e.g., "View cart, 3 items, $24.50") (NFR9)
**And** all existing tests continue to pass

### Epic 5: Cart, Checkout & Order Tracking
Customers can build a cart, handle restaurant conflicts, checkout with mock payment, track orders in real-time with status stepper, ETA countdown, and push notifications.
**FRs:** FR10, FR28–FR39, FR76 (14 FRs)
**ARs:** AR24 (notify-order-status Edge Function), AR25 (real-time: order-tracking channel)
**NFR23:** Haptic feedback on add-to-cart, place order
**FR75:** Cart/checkout/tracking empty states as acceptance criteria
**Note:** Largest epic (~8 stories, estimate 3+ sprints). This is the marathon epic.
**Stories:** 8

#### Story 5.1: Cart Conflict Dialog & Cart Bottom Sheet

As a **customer**,
I want to manage my cart in a bottom sheet and be warned when mixing restaurants,
So that I can review items before checkout and avoid order confusion.

**Acceptance Criteria:**

**Given** I have items from Restaurant A in my cart
**When** I try to add an item from Restaurant B
**Then** a cart conflict Modal dialog appears asking: "Clear cart and add new item?" or "Keep current items" (FR28)
**And** the conflict check lives inside Zustand `addItem` action in `stores/cart.ts`
**And** the dialog is screen-reader friendly with focus trapped (NFR17)

**Given** I tap "View Cart" (from floating bar or any entry point)
**When** the cart bottom sheet opens
**Then** I see: list of items with name, quantity controls (+/-), per-item total, swipe-to-delete, subtotal, delivery fee, total (FR29)
**And** the bottom sheet uses ref-based pattern with snap points (AR31)

**Given** I swipe an item in the cart
**When** the swipe completes
**Then** the item is removed from cart with animation

**And** haptic feedback triggers on add-to-cart actions (NFR23)
**Note:** This story is client-only (Zustand + UI). No database needed.
**And** all existing tests continue to pass

#### Story 5.2: Orders & Addresses Database Schema

As a **developer**,
I want the orders and addresses database tables created,
So that checkout and order tracking have the backend they need.

**Acceptance Criteria:**

**Given** the Supabase local instance is running
**When** the migration is applied
**Then** the following tables are created:
- `addresses` (id, user_id, label, street, city, state, postal_code, latitude, longitude, is_default, created_at, updated_at)
- `orders` (id, user_id, restaurant_id, status text CHECK ('placed','confirmed','preparing','on_the_way','delivered','cancelled'), items jsonb, delivery_address jsonb, subtotal integer, delivery_fee integer, total integer, special_instructions text, estimated_delivery_at, created_at, updated_at)
**And** NO separate `order_items` table — items are stored as jsonb snapshot in `orders.items` array: `[{ menu_item_id, name, price, quantity, dietary_tags }]` (consistent with `delivery_address` jsonb pattern, AR15)
**And** RLS: users can read/create their own orders and addresses, owners can read orders for their restaurant
**And** `lib/api/orders.ts` created with `createOrder()`, `fetchOrderById()`, `fetchOrdersByUser()`, `updateOrderStatus()`
**And** `lib/api/addresses.ts` created with `fetchAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()`
**And** seed data extended with sample orders for test customer
**And** all existing tests continue to pass

#### Story 5.3: Saved Addresses & GPS Auto-fill

As a **customer**,
I want to manage saved addresses and auto-fill my current location,
So that I can quickly select a delivery address.

**Acceptance Criteria:**

**Given** I am selecting a delivery address
**When** the address selector renders
**Then** I see my saved addresses list with a default highlighted (FR31)

**Given** I tap "Add new address"
**When** the address form opens
**Then** I can enter address manually or tap "Use current location" for GPS auto-fill (FR31)
**And** GPS auto-fill uses `expo-location` requesting `foregroundPermissions`
**And** if location permission denied, GPS button is disabled with message "Location permission required"
**And** reverse geocoding converts coordinates to address fields

**Given** I have saved addresses
**When** I want to manage them
**Then** I can edit, delete, and set a default address

**And** address form uses Zod + RHF validation (AR30)
**And** all existing tests continue to pass

#### Story 5.4: Checkout Screen

As a **customer**,
I want to review my order, select delivery address, add instructions, and pay,
So that I can place my order confidently.

**Acceptance Criteria:**

**Given** I proceed from cart to checkout
**When** the `checkout.tsx` screen loads
**Then** I see: delivery address selector, order summary (items, quantities, prices), special instructions text input, payment section, and "Place Order" button (FR30)

**Given** I have a saved default address
**When** checkout loads
**Then** the default address is pre-selected

**Given** the payment section renders
**When** I see the card input
**Then** a mock Stripe UI is displayed with test card pre-filled (`4242 4242 4242 4242`, `12/34`, `567`) (FR32, NFR22)
**And** tapping "Place Order" shows a "Processing..." animation (1-2 second delay for realistic feel)
**And** payment always succeeds in test mode

**Given** payment completes
**When** the order is created
**Then** an order is inserted in the database with status 'placed' and `items` jsonb snapshot
**And** the cart is cleared
**And** haptic feedback triggers (NFR23)
**And** I am navigated to the order tracking screen (FR33)

**And** checkout screen has no tab bar visible (outside (tabs) group — AR22)
**And** `accessibilityLabel` on "Place Order" button (NFR9)
**And** all existing tests continue to pass

#### Story 5.5: Order Tracking Screen with Real-Time Status

As a **customer**,
I want to track my order in real-time with a visual status stepper,
So that I know exactly where my order is.

**Acceptance Criteria:**

**Given** I have a placed order
**When** the `order/[id]` screen loads
**Then** I see a status stepper: Placed → Confirmed → Preparing → On the Way → Delivered (FR34)
**And** each step shows: icon, label, timestamp when completed (FR35)
**And** the active step has a pulse animation (Reanimated) (FR35)

**Given** the order status changes in the database
**When** a Supabase real-time event fires
**Then** the stepper updates in real-time without page refresh

**And** real-time subscription implemented in `hooks/use-order-tracking.ts`:
```ts
supabase.channel(`order-tracking:${orderId}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, callback)
  .subscribe()
```
**Pattern setup:** First real-time subscription hook (AR25). Pattern reused in Epic 8 for owner orders.
**And** estimated delivery time countdown/ETA is displayed (FR36)
**And** restaurant contact info shown with tap-to-call via `Linking.openURL` (FR37)
**And** `accessibilityLiveRegion` for screen reader announcements on status changes (NFR15)
**And** skeleton loading on initial load
**And** all existing tests continue to pass

#### Story 5.6: Push Notifications for Order Status

As a **customer**,
I want push notifications when my order status changes,
So that I'm informed even when the app is in the background.

**Acceptance Criteria:**

**Given** my order status changes (e.g., confirmed, preparing, on the way, delivered)
**When** the owner updates the status (Epic 8)
**Then** the owner's client calls `supabase.functions.invoke('notify-order-status', { body: { orderId } })` which sends a push notification to my device (FR38, FR76)

**And** Edge Function created at `supabase/functions/notify-order-status/index.ts` (AR24)
**And** shared push helper at `supabase/functions/_shared/push.ts` (AR24)
**And** push token registration using `expo-notifications` on app launch
**And** `push_token text` column added to `profiles` table (migration)
**And** notification payload includes order status and restaurant name
**Note:** Edge Function is invoked from client (owner app) via `supabase.functions.invoke()` — no `pg_net` dependency needed for MVP.
**And** all existing tests continue to pass

#### Story 5.7: Review Prompt After Delivery

As a **customer**,
I want to be prompted to review a restaurant after my order is delivered,
So that I can share my experience and help other customers.

**Acceptance Criteria:**

**Given** my order status changes to 'delivered'
**When** the tracking screen updates
**Then** a "Leave a Review" button appears (FR39)

**Given** I tap "Leave a Review"
**When** the review form opens (bottom sheet)
**Then** I can select a star rating (1-5) and write an optional comment
**And** the form uses Zod + RHF validation (AR30)

**Given** I submit the review
**When** the review is saved
**Then** the review is inserted into the `reviews` table
**And** a success confirmation is shown

**And** RLS updated: users can create reviews for restaurants they have a 'delivered' order for
**And** `lib/api/reviews.ts` adds `createReview(restaurantId, rating, comment)`
**And** all existing tests continue to pass

#### Story 5.8: Reorder from Home Screen

As a **customer**,
I want to quickly reorder a previous meal from the home screen,
So that I can repeat a favorite order with one tap.

**Acceptance Criteria:**

**Given** I have previous orders
**When** the home screen reorder section renders
**Then** I see a horizontal FlatList of previous order cards with: restaurant name, items summary, total, and "Reorder" button (FR10)

**Given** I have no previous orders
**When** the reorder section renders
**Then** the section is hidden or shows an empty state (FR75)

**Given** I tap "Reorder"
**When** the action triggers
**Then** the items from that order are added to cart (checking availability)
**And** if items are unavailable, a message indicates which items were skipped
**And** I am navigated to the cart/checkout flow

**And** uses `fetchOrdersByUser()` from `lib/api/orders.ts`
**Note:** Cross-screen story — adds reorder section to home screen `(tabs)/index.tsx` built in Epic 2.
**And** all existing tests continue to pass

### Epic 6: Customer Profile, Favorites & Loyalty
Customers can manage their profile, view order history with reorder, save favorite restaurants, manage addresses, upload avatar, and earn loyalty points/streaks.
**FRs:** FR40–FR46 (7 FRs)
**ARs:** AR28 (loyalty streak DB trigger)
**FR75:** Profile/favorites/orders empty states as acceptance criteria
**Split dependency:** FR40–FR43 (profile, favorites, addresses) need only Epic 1. FR44–FR46 (loyalty) need Epic 5 (order completion triggers points). Loyalty stories should be last in this epic.
**Parallelization note:** Stories 6.2 and 6.3 can start before Epic 5 completes (only need auth). Stories 6.1, 6.4, 6.5 need Epic 5.
**Stories:** 5

#### Story 6.1: Order History Screen

As a **customer**,
I want to see my past orders with status, date, total, and a reorder button,
So that I can track my order history and easily repeat orders.

**Acceptance Criteria:**

**Given** I am on the Orders tab (`(tabs)/orders.tsx`)
**When** the screen loads
**Then** I see a FlatList of my orders sorted by date (most recent first) (FR40)
**And** each order card shows: restaurant name, order status badge, date, total, and "Reorder" button

**Given** I tap an order card
**When** the action triggers
**Then** I navigate to `order/[id]` to see full order details

**Given** I tap "Reorder" on an order
**When** the action triggers
**Then** reorder logic uses cart store's `reorderFromOrder(order)` action (shared with Story 5.8)

**Given** I have no orders
**When** the screen loads
**Then** an empty state is shown encouraging first order (FR75)

**And** pull-to-refresh supported (NFR7)
**And** skeleton loading while data fetches
**Depends on:** Epic 5 (needs order data)
**And** all existing tests continue to pass

#### Story 6.2: Favorite Restaurants

As a **customer**,
I want to save and browse my favorite restaurants,
So that I can quickly access places I love.

**Acceptance Criteria:**

**Given** I am on the Favorites tab (`(tabs)/favorites.tsx`)
**When** the screen loads
**Then** I see a grid (FlatList, numColumns=2) of my favorite restaurant cards (FR41)

**Given** I see a restaurant card (anywhere in the app)
**When** I tap the heart icon
**Then** the restaurant is added/removed from favorites with optimistic UI: visual state updates immediately, reverts on API error (FR41)

**Given** I have no favorites
**When** the Favorites tab loads
**Then** an empty state is shown encouraging exploration (FR75)

**DB migration:** Creates `favorites` table (id, user_id, restaurant_id, created_at, UNIQUE constraint on user_id + restaurant_id)
**RLS:** Users can read/create/delete their own favorites
**And** `lib/api/favorites.ts` created with `fetchFavorites()`, `toggleFavorite(restaurantId)`
**And** favorites state managed via Zustand store (`stores/favorites.ts`) with `favoriteIds` Set, hydrated on auth, updated optimistically on toggle
**And** heart icon component reusable across all restaurant cards
**Can start before Epic 5** — only needs auth (Epic 1)
**And** all existing tests continue to pass

#### Story 6.3: Profile Settings & Avatar Upload

As a **customer**,
I want to edit my profile information and upload a profile picture,
So that my account reflects who I am.

**Acceptance Criteria:**

**Given** I am on the Profile tab (`(tabs)/profile.tsx`)
**When** the screen loads
**Then** I see my avatar, display name, email, and links to: Edit Profile, Saved Addresses, Rewards, Settings

**Given** I tap "Edit Profile"
**When** the profile form opens (`profile/settings.tsx`)
**Then** I can edit: display name, email (FR43)
**And** the form uses Zod + RHF validation (AR30)

**Given** I want to change my password
**When** I enter new password and confirmation
**Then** password is updated via `supabase.auth.updateUser({ password: newPassword })` (FR43)
**And** new password field has confirmation field with match validation

**Given** I tap my avatar
**When** the image picker opens (expo-image-picker)
**Then** I can select or take a photo with `quality: 0.8` for compression (FR43)
**And** the image is uploaded to Supabase Storage `avatars` private bucket at path `avatars/{userId}/avatar.{ext}` (AR13, AR14)
**And** `avatar_url` is updated in my profile

**And** `avatars` private bucket created (via migration or dashboard)
**And** `lib/storage.ts` created with `uploadAvatar(userId, imageUri)` returning the stored URL (AR14)
**Can start before Epic 5** — only needs auth (Epic 1)
**And** all existing tests continue to pass

#### Story 6.4: Saved Addresses Management

As a **customer**,
I want to view and manage my saved addresses from my profile,
So that I can keep my delivery addresses up to date.

**Acceptance Criteria:**

**Given** I navigate to `profile/addresses.tsx`
**When** the screen loads
**Then** I see my saved addresses list with default highlighted (FR42)

**Given** I want to add, edit, or delete an address
**When** I interact with the address management
**Then** CRUD operations work using address components and `lib/api/addresses.ts` from Story 5.3 (FR42)

**Given** I have no saved addresses
**When** the screen loads
**Then** an empty state encourages adding a first address (FR75)

**Note:** Small story (~half day). Reuses address components from Story 5.3. Primarily creates wrapper screen `profile/addresses.tsx`.
**Depends on:** Story 5.3 (address components)
**And** all existing tests continue to pass

#### Story 6.5: Loyalty Points, Streaks & Rewards Display

As a **customer**,
I want to see my loyalty points, order streaks, and rewards,
So that I feel rewarded for my loyalty and motivated to order more.

**Acceptance Criteria:**

**Given** I complete an order (status changes to 'delivered')
**When** the DB trigger fires
**Then** loyalty points are awarded: **flat 10 points per completed order** (FR44)
**And** streak logic: if `last_order_date` = yesterday → increment `current_streak`; if today → no change; if older → reset to 1. Update `longest_streak` if current exceeds it. (FR45)

**Given** I navigate to `profile/rewards.tsx`
**When** the screen loads
**Then** I see: current points balance, current streak (days), longest streak, and a rewards summary (FR46)

**Given** the home screen header shows the loyalty badge
**When** points are earned
**Then** the badge updates to show current points (replaces "0 pts" from Epic 2)

**DB migration:** Adds `loyalty_points integer default 0`, `current_streak integer default 0`, `longest_streak integer default 0`, `last_order_date date` columns to `profiles` table
**And** DB trigger created on `orders` table: on status update to 'delivered', execute loyalty calculation function (AR28)
**And** `lib/api/rewards.ts` created with `fetchRewards(userId)`
**Depends on:** Epic 5 (order completion triggers points). This is the last story in Epic 6.
**And** all existing tests continue to pass

### Epic 7: Owner Restaurant Setup & Menu Management
Owners can view dashboard analytics (revenue, orders, top dishes), manage full menu (category + item CRUD, drag-and-drop, bulk actions), and configure restaurant settings.
**FRs:** FR47–FR54, FR69–FR71 (11 FRs)
**NFR24:** Dark theme for owner dashboard (stone-900 background)
**ARs:** AR13–AR14 (Storage buckets, image upload)
**FR75:** Owner dashboard/menu empty states as acceptance criteria
**Seed data note:** Dashboard analytics (FR47-FR50) use seed data from AR10 (supabase/seed.sql) to display meaningful numbers during development. Dashboard reads data — it doesn't need live orders to function.
**Stories:** 6

#### Story 7.1: Owner Dashboard — Revenue Cards & Charts

As a **restaurant owner**,
I want to see my revenue overview and order statistics at a glance,
So that I can monitor business performance.

**Acceptance Criteria:**

**Given** I am on the Owner Dashboard tab (`(owner)/index.tsx`)
**When** the screen loads
**Then** I see revenue cards: today, this week, this month — each with amount and trend arrow (up/down vs previous period) (FR47)
**And** a 30-day revenue area chart is displayed below using VictoryArea (FR48)
**And** orders today count + status breakdown shown as a donut chart using VictoryPie (FR49)

**And** `victory-native` added to project dependencies
**And** charts rendered using victory-native (VictoryArea for revenue, VictoryPie for orders donut)
**DB migrations:** Creates 3 RPC functions:
- `revenue_summary(restaurant_id)` → returns today/week/month totals with previous period comparison
- `revenue_chart(restaurant_id, days)` → returns daily revenue array for chart
- `order_stats(restaurant_id)` → returns order counts by status
**And** `lib/api/owner-analytics.ts` created with `fetchRevenueSummary(restaurantId)`, `fetchRevenueChart(restaurantId, days)`, `fetchOrderStats(restaurantId)` calling the RPCs
**And** dashboard uses dark theme: `stone-900` background, `stone-800` cards (NFR24)
**And** skeleton loading while data loads
**And** empty state when no orders exist yet (FR75) — "Your first order is around the corner!"
**And** all existing tests continue to pass

#### Story 7.2: Owner Dashboard — Top Dishes Leaderboard

As a **restaurant owner**,
I want to see my most popular dishes ranked,
So that I can understand what customers love and optimize my menu.

**Acceptance Criteria:**

**Given** I am on the Owner Dashboard
**When** the top dishes section renders
**Then** I see a ranked FlatList of top 10 dishes by order count with dish name and order count (FR50)

**DB migration:** Creates `top_dishes_by_restaurant(restaurant_id uuid)` RPC function querying `orders.items` jsonb
**And** `lib/api/owner-analytics.ts` adds `fetchTopDishes(restaurantId)` calling the RPC
**And** dark theme styling consistent with dashboard (NFR24)
**And** empty state when no order data exists (FR75)
**And** all existing tests continue to pass

#### Story 7.3: Menu Category Management

As a **restaurant owner**,
I want to create, edit, and delete menu categories,
So that I can organize my menu structure.

**Acceptance Criteria:**

**Given** I am on the Menu tab (`(owner)/menu.tsx`)
**When** the screen loads
**Then** I see a list of my menu categories with item counts (FR51)

**Given** I tap "Add Category"
**When** the category form opens
**Then** I can enter a category name and save (FR51)
**And** the form uses Zod + RHF validation (AR30)

**Given** I tap edit on a category
**When** the edit form opens
**Then** I can update the category name (FR51)

**Given** I tap delete on a category
**When** confirmation dialog appears and I confirm
**Then** the category is soft-deleted (`deleted_at` set) (FR51, NFR19)
**And** all items in that category are also soft-deleted

**And** dark theme styling (NFR24)
**And** `lib/api/owner-menu.ts` created with `fetchCategories(restaurantId)`, `createCategory()`, `updateCategory()`, `softDeleteCategory()`
**And** all existing tests continue to pass

#### Story 7.4: Menu Item CRUD & Image Upload

As a **restaurant owner**,
I want to create, edit, and manage menu items with photos and dietary tags,
So that customers see an appealing and accurate menu.

**Acceptance Criteria:**

**Given** I am in a menu category
**When** I tap "Add Item"
**Then** a form opens with: name, description, price, image upload, category selector, availability toggle, dietary tags multi-select (FR52)
**And** the form uses Zod + RHF validation (AR30)

**Given** I upload an item image
**When** the image is selected via expo-image-picker with `quality: 0.8`
**Then** the image is uploaded to Supabase Storage `menu-images` public bucket at path `menu-images/{restaurantId}/{itemId}/{timestamp}.{ext}` (AR13, AR14)
**And** `lib/storage.ts` adds `uploadMenuImage(restaurantId, itemId, imageUri)`
**And** old image deleted from storage when a new image replaces it

**Given** I toggle item availability
**When** the toggle changes
**Then** `is_available` is updated immediately (FR52)

**Given** I want to edit an existing item
**When** I tap the item
**Then** the edit form opens pre-populated with current values (FR52)

**And** `restaurant-images` public bucket and `menu-images` public bucket created
**And** `lib/api/owner-menu.ts` adds `createMenuItem()`, `updateMenuItem()`, `softDeleteMenuItem()`, `toggleItemAvailability()`
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

#### Story 7.5: Menu Drag-and-Drop Reorder & Bulk Actions

As a **restaurant owner**,
I want to reorder items by dragging and mark multiple items unavailable at once,
So that I can quickly organize my menu and manage availability during rushes.

**Acceptance Criteria:**

**Given** I am viewing items in a category
**When** I long-press and drag an item
**Then** the item reorders within the category with visual feedback (FR53)
**And** the new `sort_order` is saved to the database

**Given** I enter bulk selection mode
**When** I select multiple items
**Then** I can mark them all unavailable with one tap (FR54)
**And** a confirmation shows how many items will be affected

**And** drag-and-drop uses `react-native-draggable-flatlist` (wraps reanimated + gesture handler)
**And** `react-native-draggable-flatlist` added to project dependencies
**And** `lib/api/owner-menu.ts` adds `reorderMenuItems(categoryId, orderedIds[])`, `bulkToggleAvailability(itemIds[], isAvailable)`
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

#### Story 7.6: Owner Restaurant Settings

As a **restaurant owner**,
I want to edit my restaurant info, operating hours, and delivery settings,
So that customers see accurate information.

**Acceptance Criteria:**

**Given** I am on the Settings tab (`(owner)/settings.tsx`)
**When** the screen loads
**Then** I see sections for: Restaurant Info, Operating Hours, Delivery Settings

**Given** I edit restaurant info
**When** I update name, description, cover photo, or logo
**Then** changes are saved to the `restaurants` table (FR69)
**And** cover photo and logo uploaded to `restaurant-images` public bucket at `restaurant-images/{restaurantId}/{type}/{timestamp}.{ext}` (AR13)

**Given** I edit operating hours
**When** I set open/close times per day of week
**Then** hours are saved to `operating_hours` jsonb column (FR70)
**And** format: `{ "monday": { "open": "09:00", "close": "22:00", "closed": false }, ... }`
**And** `is_open` status computed client-side by comparing current time against today's hours

**Given** I edit delivery settings
**When** I update delivery radius, fee, or minimum order
**Then** values are saved to the `restaurants` table (FR71)

**DB migration:** Adds `operating_hours jsonb` column to `restaurants` table
**And** all forms use Zod + RHF validation (AR30)
**And** `lib/api/owner-settings.ts` created with `updateRestaurantInfo()`, `updateOperatingHours()`, `updateDeliverySettings()`
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

### Epic 8: Owner Order Operations
Owners can receive, view, and process orders in real-time with status progression tabs, push notifications with sound alerts for new orders.
**FRs:** FR55–FR60, FR77 (7 FRs)
**ARs:** AR24 (notify-new-order Edge Function), AR25 (real-time: owner-orders channel)
**Depends on:** Epic 5 (needs real orders to manage)
**Stories:** 4

#### Story 8.1: Owner Orders Screen with Status Tabs

As a **restaurant owner**,
I want to see incoming orders organized by status,
So that I can manage my order pipeline efficiently.

**Acceptance Criteria:**

**Given** I am on the Orders tab (`(owner)/orders.tsx`)
**When** the screen loads
**Then** I see segmented tabs: New | Confirmed | Preparing | Ready | Completed (FR55)
**And** each tab shows a FlatList of order cards for that status

**Given** an order card is displayed
**When** I view it
**Then** it shows: order #, items summary, total, time since placed (FR56)

**And** dark theme styling (NFR24)
**And** skeleton loading while data fetches
**And** empty states per tab when no orders in that status (FR75)
**And** pull-to-refresh supported (NFR7)
**And** `lib/api/owner-orders.ts` created with `fetchOrdersByStatus(restaurantId, status)`
**And** all existing tests continue to pass

#### Story 8.2: Order Details & Status Updates

As a **restaurant owner**,
I want to view full order details and advance orders through stages,
So that I can process each order step by step.

**Acceptance Criteria:**

**Given** I tap an order card
**When** the order expands
**Then** I see full details: all items with quantities, customer name, delivery address, special instructions, order total (FR57)

**Given** an order is in a non-terminal status
**When** I tap the status update button
**Then** the order moves to the next stage (e.g., New → Confirmed → Preparing → Ready → Completed) (FR58)
**And** the order card moves to the appropriate tab
**And** after SUCCESSFUL DB status update, `supabase.functions.invoke('notify-order-status', { body: { orderId } })` is called to push notify the customer

**And** push notification is fire-and-forget: Edge Function failure does not block or rollback the status update
**And** status update button shows the next status label (e.g., "Confirm Order", "Start Preparing", "Mark Ready")
**And** `lib/api/owner-orders.ts` adds `updateOrderStatus(orderId, newStatus)`
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

#### Story 8.3: Real-Time New Order Appearance

As a **restaurant owner**,
I want new orders to appear instantly without refreshing,
So that I never miss an incoming order.

**Acceptance Criteria:**

**Given** I am on the Owner Orders screen
**When** a customer places a new order for my restaurant
**Then** the order appears in the "New" tab in real-time without page refresh (FR59)

**And** real-time subscription implemented in `hooks/use-owner-orders.ts`:
```ts
supabase.channel(`owner-orders:${restaurantId}`)
  .on('postgres_changes', {
    event: '*',  // INSERT (new orders) + UPDATE (status changes for tab sync)
    schema: 'public',
    table: 'orders',
    filter: `restaurant_id=eq.${restaurantId}`
  }, callback)
  .subscribe()
```
**And** reuses real-time subscription hook pattern established in Story 5.5 (AR25)
**And** new order card appears at the top of the "New" tab with a highlight animation (Reanimated)
**And** status updates from current device also sync via real-time (keeps tab lists consistent)
**And** all existing tests continue to pass

#### Story 8.4: Push Notification & Sound on New Order

As a **restaurant owner**,
I want a push notification with sound when a new order arrives,
So that I'm alerted even when the app is in the background.

**Acceptance Criteria:**

**Given** a customer places an order for my restaurant
**When** the order is created in the database
**Then** the `notify-new-order` Edge Function sends a push notification to the owner's device (FR60, FR77)

**And** Edge Function created at `supabase/functions/notify-new-order/index.ts` (AR24)
**And** reuses `_shared/push.ts` helper from Story 5.6
**And** Edge Function verifies caller authorization before sending notification (checks order exists and caller is the order creator)
**And** notification includes order summary (item count, total)
**And** notification plays default system sound alert (FR60). Custom sound deferred to post-MVP.
**And** checkout flow (Story 5.4) updated to call `supabase.functions.invoke('notify-new-order', { body: { orderId } })` after order creation
**And** Story 5.6 Edge Function (`notify-order-status`) also updated to verify caller is restaurant owner for the order
**And** all existing tests continue to pass

**Cross-epic notification flow:**
- **Order creation (Story 5.4)** → calls `notify-new-order` → owner receives push
- **Status updates (Story 8.2)** → calls `notify-order-status` → customer receives push
- Clean separation: each Edge Function has one caller and one recipient

### Epic 9: Owner Reviews & Promotions
Owners can view and reply to customer reviews, filter by rating, create/manage promotions and flash deals, track promotion performance and ROI.
**FRs:** FR61–FR68 (8 FRs)
**FR75:** Reviews/promotions empty states as acceptance criteria
**Depends on:** Epic 7 (restaurant setup), Epic 8 (orders for reviews)
**Stories:** 6

#### Story 9.1: Owner Reviews Display & Filtering

As a **restaurant owner**,
I want to see all customer reviews with rating trends and filter by stars,
So that I can monitor customer satisfaction.

**Acceptance Criteria:**

**Given** I navigate to reviews (pushed from dashboard)
**When** the `(owner)/reviews.tsx` screen loads
**Then** I see average rating display with trend indicator (up/down vs previous 30-day period) (FR61)
**And** below, a FlatList of individual review cards with: customer name, avatar, rating, date, comment

**Given** I want to filter reviews
**When** I select a star rating filter (1-5 stars)
**Then** the list filters to show only reviews with that rating (FR63)

**DB migration:** Creates `rating_trend(restaurant_id)` RPC returning `current_avg` (last 30 days) and `previous_avg` (30-60 days ago)
**And** `lib/api/owner-reviews.ts` created with `fetchReviewsByRestaurant(restaurantId, ratingFilter?)`, `fetchRatingTrend(restaurantId)`
**And** dark theme styling (NFR24)
**And** empty state when no reviews exist (FR75) — "Your first review is on its way!"
**And** skeleton loading while data fetches
**And** all existing tests continue to pass

#### Story 9.2: Reply to Reviews

As a **restaurant owner**,
I want to reply to customer reviews,
So that I can engage with feedback and show customers I care.

**Acceptance Criteria:**

**Given** I see a review card
**When** I tap "Reply"
**Then** a reply form opens inline or in a bottom sheet (FR62)
**And** I can write and submit a reply

**Given** a review already has my reply
**When** the review card renders
**Then** the reply is displayed below the customer's comment with "Owner reply" label and timestamp

**Note:** `owner_reply` and `owner_reply_at` columns already exist from Story 4.3 — no migration needed.
**RLS:** Restaurant owner can update `owner_reply` on reviews for their restaurant (new RLS policy)
**And** `lib/api/owner-reviews.ts` adds `replyToReview(reviewId, reply)`
**And** reply form uses Zod + RHF validation (AR30)
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

#### Story 9.3: Create & Manage Promotions

As a **restaurant owner**,
I want to create promotions with discounts for my menu items,
So that I can attract more customers and boost sales.

**Acceptance Criteria:**

**Given** I am on the Promotions tab (`(owner)/promotions.tsx`)
**When** I tap "Create Promotion"
**Then** a form opens with: promotion name, discount type (percentage/fixed), discount value, applicable items (multi-select), start date, end date, push notification toggle (FR64)
**And** the form uses Zod + RHF validation (AR30)

**Given** I have active promotions
**When** the promotions list renders
**Then** I see active promotions with performance stats: orders using promo, revenue generated (FR65)
**Note:** "Views" metric dropped for MVP — no analytics tracking. Stats come from orders with matching `promotion_id`.

**Given** I want to toggle a promotion
**When** I tap activate/deactivate
**Then** the promotion status changes immediately (FR68)

**DB migration:** Creates `promotions` table (id, restaurant_id, name, discount_type CHECK ('percentage'|'fixed'), discount_value integer, applicable_item_ids jsonb, start_date, end_date, is_active boolean, push_enabled boolean, created_at, updated_at)
**And** `orders` table updated: adds `promotion_id uuid` nullable FK to `promotions`
**RLS:** Owners can CRUD their own promotions, customers can read active promotions
**And** `lib/api/owner-promotions.ts` created with `fetchPromotions(restaurantId)`, `createPromotion()`, `updatePromotion()`, `togglePromotion(promotionId, isActive)`
**And** dark theme styling (NFR24)
**And** empty state when no promotions exist (FR75)
**Note:** `push_enabled` flag stored but not acted upon for MVP (NFR32 — push to nearby customers deferred to Phase 2)
**And** all existing tests continue to pass

#### Story 9.4: Flash Deals & Promotion History

As a **restaurant owner**,
I want to create time-limited flash deals and view promotion history with ROI,
So that I can run urgent promotions and understand their impact.

**Acceptance Criteria:**

**Given** I want to create a flash deal
**When** I tap "Flash Deal"
**Then** a simplified form opens: deal name, discount, duration (hours), applicable items (FR66)
**And** flash deal `end_date` calculated from creation time + hours

**Given** I want to see past promotions
**When** I navigate to promotion history
**Then** I see completed/expired promotions with ROI summary: total orders using promo, revenue generated, discount cost (FR67)

**And** active promotions filtered by `is_active = true AND (end_date IS NULL OR end_date > now())` in queries — no server-side cron needed
**And** expired promotions automatically appear in history when `end_date` passes
**And** `lib/api/owner-promotions.ts` adds `createFlashDeal()`, `fetchPromotionHistory(restaurantId)`
**And** dark theme styling (NFR24)
**And** all existing tests continue to pass

#### Story 9.5: Promotion Badges on Restaurant & Menu Cards

As a **customer**,
I want to see active promotions on restaurant cards and menu items,
So that I know about deals when browsing.

**Acceptance Criteria:**

**Given** a restaurant has an active promotion
**When** the restaurant card renders (home, search, listing)
**Then** an "active promotion badge" is displayed on the card (FR21 completion)

**Given** I am viewing a restaurant's menu
**When** a menu item is part of an active promotion
**Then** the original price is struck through and the discounted price is shown

**Files modified (cross-screen story):**
- `components/ui/restaurant-card.tsx` — add promotion badge
- Restaurant detail menu item component — struck-through price + discounted price display
- `lib/api/restaurants.ts` — join active promotions (`WHERE is_active AND (end_date IS NULL OR end_date > now())`) in restaurant queries
- `fetchRestaurantBySlug` query (Story 4.1) — add promotions join

**And** promotion data joined in restaurant queries where applicable
**And** all existing tests continue to pass

#### Story 9.6: Apply Promotions at Checkout

As a **customer**,
I want promotions automatically applied to my order at checkout,
So that I get the advertised discount.

**Acceptance Criteria:**

**Given** my cart contains items that are part of an active promotion
**When** the checkout screen renders
**Then** the discounted prices are shown in the order summary
**And** the promotion name and discount are displayed as a line item

**Given** I place an order with promoted items
**When** the order is created
**Then** `promotion_id` is saved on the order record
**And** the total reflects the discounted prices

**Files modified (cross-epic story):**
- `checkout.tsx` (Story 5.4) — apply promotion discount to cart items, save `promotion_id`
- `stores/cart.ts` — add promotion-aware price calculation in `getTotal`

**And** if multiple promotions apply, the best single discount is used (no stacking for MVP)
**And** all existing tests continue to pass

## Implementation Phases & Dependency Graph

### Dependency Graph

```
Epic 1 (Foundation) ──┬── Epic 2 (Home) ──── Epic 3 (Search) ──── Epic 4 (Restaurant)
                      │                                                    │
                      ├── Epic 7 (Owner Setup) ─────────────────┐    Epic 5 (Cart/Orders)
                      │                                         │         │
                      └── Epic 6 (Profile)*                     ├── Epic 8 (Owner Orders)
                                                                │         │
                                                                └── Epic 9 (Reviews & Promos)
```
*Epic 6: Profile/Favorites after Epic 1, Loyalty stories after Epic 5

### Implementation Phases

| Phase | Epics | Track | Notes |
|-------|-------|-------|-------|
| Phase 1 | Epic 1 | Foundation | Sequential — everything depends on this |
| Phase 2 | Epics 2, 3 | Customer Discovery | Sequential (Home → Search) |
| Phase 2 | Epic 7 | Owner Setup | Parallel track with customer discovery |
| Phase 3 | Epic 4 | Restaurant Detail | Gateway to ordering flow |
| Phase 4 | Epic 5 | Cart & Orders | Longest epic (~3 sprints) |
| Phase 4 | Epic 6 | Profile & Loyalty | Parallel, loyalty stories after Epic 5 |
| Phase 5 | Epic 8 | Owner Orders | Needs Epic 5 for real orders |
| Phase 6 | Epic 9 | Reviews & Promotions | Final customer-owner loop |

### Summary

| Epic | Title | FRs | Count |
|------|-------|-----|-------|
| 1 | Foundation, Auth & Onboarding | FR1–5, FR72–74 | 8 |
| 2 | Home & Discovery Feed | FR6–9, FR11–13 | 7 |
| 3 | Search & Restaurant Listing | FR14–22 | 9 |
| 4 | Restaurant Experience & Menu | FR23–27 | 5 |
| 5 | Cart, Checkout & Order Tracking | FR10, FR28–39, FR76 | 14 |
| 6 | Customer Profile, Favorites & Loyalty | FR40–46 | 7 |
| 7 | Owner Restaurant Setup & Menu Management | FR47–54, FR69–71 | 11 |
| 8 | Owner Order Operations | FR55–60, FR77 | 7 |
| 9 | Owner Reviews & Promotions | FR61–68 | 8 |
| | FR75 (empty states) | Distributed as AC | — |
| | **Total** | | **77 FRs / 48 Stories** |
