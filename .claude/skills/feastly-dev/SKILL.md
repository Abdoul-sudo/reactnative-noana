---
name: noana-dev
description: Project-specific development skill for the noana mobile app (React Native / Expo). This skill should be used when building screens, components, features, or Supabase queries within the noana codebase. It provides the design system, database schema, navigation structure, file conventions, and pinned stack versions. It does NOT handle generic UI/UX advice or general app scaffolding — use ui-ux-pro-max or app-builder for those.
---

# noana Dev

## Overview

noana is a Zomato-style restaurant discovery and food ordering mobile app built with React Native (Expo), NativeWind, and Supabase. This skill provides project-specific conventions, design tokens, schema knowledge, and workflow guidance to maintain consistency across the codebase.

## When to Use

- Building or modifying any noana screen or component
- Writing Supabase queries, RLS policies, or real-time subscriptions
- Creating new navigation routes
- Applying the noana design system (colors, fonts, spacing)
- Checking pinned library versions before adding dependencies

## Project Structure

```
noana/
  app/                    # Expo Router screens (file-based routing)
    (tabs)/               # Customer tab navigator
    (auth)/               # Auth screens
    (owner)/              # Owner tab navigator
    restaurant/           # Restaurant detail [slug]
    order/                # Order tracking [id]
    profile/              # Profile sub-screens
    _layout.tsx           # Root layout
  components/
    ui/                   # Shared primitives (Button, Input, Badge, Card)
    home/                 # Home screen sections
    restaurant/           # Restaurant cards, menu items
    cart/                 # Cart bottom sheet, cart items
    order/                # Order tracking stepper
    owner/                # Owner dashboard components
    charts/               # Chart wrappers
  lib/                    # Client configs (supabase.ts, stripe.ts, utils.ts)
  hooks/                  # Custom hooks (useCart, useRealtime, useAuth, useLocation)
  stores/                 # Zustand stores (cartStore.ts, authStore.ts)
  types/                  # TypeScript interfaces
  constants/              # Design tokens (colors.ts, typography.ts)
  data/                   # Seed scripts
  assets/                 # Static images, fonts
```

## File & Naming Conventions

- **Screens**: `app/(tabs)/index.tsx` — lowercase, file-based routing via Expo Router v6
- **Components**: `components/ui/Button.tsx` — PascalCase component files
- **Hooks**: `hooks/useCart.ts` — camelCase with `use` prefix
- **Stores**: `stores/cartStore.ts` — camelCase with `Store` suffix
- **Types**: `types/index.ts` — centralized type exports
- **Constants**: `constants/colors.ts` — lowercase

## Quick Design Reference

| Token         | Value     | NativeWind   |
| ------------- | --------- | ------------ |
| Primary       | `#DC2626` | `red-600`    |
| Background    | `#FEF2F2` | `red-50`     |
| Surface       | `#FFFFFF` | `white`      |
| Text Primary  | `#450A0A` | `red-950`    |
| CTA / Ratings | `#CA8A04` | `yellow-600` |
| Success       | `#16A34A` | `green-600`  |
| Owner BG      | `#1C1917` | `stone-900`  |
| Owner Card    | `#292524` | `stone-800`  |

| Font Role | Family              | Usage                         |
| --------- | ------------------- | ----------------------------- |
| Display   | Playfair Display SC | Headings, restaurant names    |
| Body / UI | Karla               | Buttons, labels, descriptions |

For the full design system (all colors, typography scale, spacing, shadows, animations, accessibility), read `references/design-system.md`.

## Component Workflow

To build a new noana component or screen:

1. **Check location**: Determine the correct directory based on the project structure above
2. **Read the design system**: Load `references/design-system.md` for exact tokens
3. **Check the schema**: If the feature involves data, load `references/db-schema.md` for table structure and RLS patterns
4. **Use NativeWind**: Style with className strings, not StyleSheet. Use the custom font families defined in the NativeWind config
5. **Icons**: Always use `lucide-react-native`, never emojis or text characters
6. **Images**: Always use `expo-image` (the `Image` component from `expo-image`), never `<Image>` from `react-native`
7. **Lists**: Use `FlatList` or `SectionList` for any list > 5 items. Never use `.map()` inside `ScrollView` for dynamic data
8. **Animations**: Use `react-native-reanimated` for all animations. Check `AccessibilityInfo.isReduceMotionEnabled` before animating
9. **State**: Cart and auth use Zustand stores. Component-local state uses `useState`. Server data uses Supabase queries directly (or a custom hook)
10. **Forms**: React Hook Form + Zod for all forms with validation

## Supabase Patterns

- Client initialized in `lib/supabase.ts` with `@react-native-async-storage/async-storage`
- File uploads: Use ArrayBuffer from base64 (NOT Blob/FormData — broken in React Native)
- Real-time: Use `supabase.channel()` for order tracking and owner order board
- RLS: Every table has row-level security. Customers see own data; owners see own restaurant data

For the full schema, RLS policies, and query examples, read `references/db-schema.md`.

## Stack Versions

For the complete pinned versions and critical setup notes, read `references/stack-versions.md`.

Key versions at a glance:

- Expo SDK 54, Expo Router v6, NativeWind v4.2, Reanimated v4.2, Zustand v5
