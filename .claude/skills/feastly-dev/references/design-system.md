# noana Design System

## Color Palette

| Role           | Hex       | NativeWind   | Usage                                     |
| -------------- | --------- | ------------ | ----------------------------------------- |
| Primary        | `#DC2626` | `red-600`    | Brand, active states, primary buttons     |
| Primary Light  | `#F87171` | `red-400`    | Hover/press states, secondary accents     |
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

**Rules**:

- Customer-facing screens: light theme (red-50 background, white cards)
- Owner dashboard: dark theme (stone-900 background, stone-800 cards)
- CTA gold (`yellow-600`) used sparingly — ratings and premium actions only
- Never use raw hex values — always use NativeWind classes

## Typography

### Font Families

| Role          | Font                        | NativeWind `fontFamily` |
| ------------- | --------------------------- | ----------------------- |
| Display       | Playfair Display SC Regular | `font-display`          |
| Display Bold  | Playfair Display SC Bold    | `font-display-bold`     |
| Body          | Karla Regular               | `font-sans`             |
| Body Light    | Karla Light                 | `font-sans-light`       |
| Body Medium   | Karla Medium                | `font-sans-medium`      |
| Body SemiBold | Karla SemiBold              | `font-sans-semibold`    |
| Body Bold     | Karla Bold                  | `font-sans-bold`        |

### Loading Fonts

```ts
import { useFonts, PlayfairDisplaySC_400Regular, PlayfairDisplaySC_700Bold } from '@expo-google-fonts/playfair-display-sc';
import { Karla_300Light, Karla_400Regular, Karla_500Medium, Karla_600SemiBold, Karla_700Bold } from '@expo-google-fonts/karla';
```

### NativeWind Config (tailwind.config.js)

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

### Typography Scale

| Element         | Size    | Weight | Font Class                        |
| --------------- | ------- | ------ | --------------------------------- |
| Hero title      | 36-44px | 700    | `text-4xl font-display-bold`      |
| Section title   | 28-32px | 700    | `text-3xl font-display-bold`      |
| Restaurant name | 22px    | 700    | `text-xl font-display-bold`       |
| Card title      | 17-18px | 600    | `text-lg font-sans-semibold`      |
| Body text       | 15-16px | 400    | `text-base font-sans`             |
| Caption / meta  | 13px    | 400    | `text-sm font-sans text-gray-500` |
| Small label     | 11px    | 500    | `text-xs font-sans-medium`        |

## Spacing & Layout

| Property                  | Value   | Notes                     |
| ------------------------- | ------- | ------------------------- |
| Screen horizontal padding | 16-20px | `px-4` or `px-5`          |
| Section vertical gap      | 32-40px | `gap-8` or `gap-10`       |
| Card padding              | 12-16px | `p-3` or `p-4`            |
| Card border radius        | 16px    | `rounded-2xl`             |
| Pill/badge radius         | 999px   | `rounded-full`            |
| Touch target minimum      | 44x44pt | Accessibility requirement |

## Shadows & Elevation

| Level  | Usage                 | NativeWind        | Android Elevation |
| ------ | --------------------- | ----------------- | ----------------- |
| Low    | Cards at rest         | `shadow-sm`       | 2                 |
| Medium | Cards on press        | `shadow-md`       | 4                 |
| High   | Modals, bottom sheets | `shadow-xl`       | 8                 |
| Glow   | CTA buttons           | Custom red shadow | N/A               |

## Icons

- **Library**: `lucide-react-native` (requires `react-native-svg`)
- **Tab bar icons**: 22-24px
- **UI icons**: 20px
- **Inline icons**: 16px
- **Never use emojis as icons**

## Animations

| Interaction        | Duration  | Library              | Notes                      |
| ------------------ | --------- | -------------------- | -------------------------- |
| Screen transitions | 300ms     | React Navigation     | Default Expo Router config |
| Card press scale   | 150ms     | Reanimated           | Scale to 0.97 on press     |
| Bottom sheet slide | 300ms     | @gorhom/bottom-sheet | Spring config              |
| List item enter    | 200ms     | Reanimated layout    | `FadeIn.duration(200)`     |
| Order status step  | 400ms     | Reanimated spring    | Green fill animation       |
| Pull to refresh    | Native    | FlatList             | Built-in                   |
| Skeleton pulse     | 1.5s loop | Reanimated           | Opacity 0.3-1.0            |
| Tab switch         | 200ms     | React Navigation     | Default                    |

**Performance rules**:

- All animations via `react-native-reanimated` (UI thread, not JS thread)
- Always check `AccessibilityInfo.isReduceMotionEnabled` — skip animations when true
- Skeleton screens for all async content (never blank screens)
- Activity indicators only for operations > 300ms

## Accessibility

- Color contrast ratio 4.5:1 minimum for all text
- `accessibilityLabel` on all touchable elements and icons
- `accessibilityRole` properly set (button, link, header, etc.)
- `accessibilityState` for toggles, checkboxes, selections
- Screen reader announcements for order status updates
- `accessibilityHint` for non-obvious actions
- Touch targets minimum 44x44pt
- Support dynamic type / font scaling
- Respect `isReduceMotionEnabled`
- Logical focus order for screen readers
