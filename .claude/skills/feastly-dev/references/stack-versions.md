# noana Stack Versions (Pinned February 2026)

## Core Stack

| Library      | Version             | Notes                                        |
| ------------ | ------------------- | -------------------------------------------- |
| Expo SDK     | **54** (`~54.0.33`) | Stable. New Architecture enabled by default. |
| React Native | **0.81**            | Bundled with SDK 54.                         |
| React        | **19.1.0**          | Bundled with SDK 54.                         |
| Expo Router  | **v6** (`~6.0.23`)  | File-based routing. Bundled with SDK 54.     |
| NativeWind   | **v4.2.2**          | Stable. Do NOT use v5 (preview only).        |
| TypeScript   | **5.x**             | Bundled with Expo.                           |

## Backend

| Library               | Version    | Notes                                                                                 |
| --------------------- | ---------- | ------------------------------------------------------------------------------------- |
| @supabase/supabase-js | **2.97.x** | Requires `@react-native-async-storage/async-storage` and `react-native-url-polyfill`. |

## UI & Animation

| Library                        | Version     | Notes                                                                 |
| ------------------------------ | ----------- | --------------------------------------------------------------------- |
| react-native-reanimated        | **4.2.x**   | New Architecture only. Babel plugin now from `react-native-worklets`. |
| react-native-gesture-handler   | **latest**  | Required by bottom-sheet and navigation.                              |
| @gorhom/bottom-sheet           | **5.2.x**   | Must be >= 5.1.8 for Reanimated v4 compatibility.                     |
| lucide-react-native            | **0.575.x** | Requires `react-native-svg`.                                          |
| expo-image                     | **3.0.x**   | Recommended image component. Never use RN `<Image>`.                  |
| react-native-safe-area-context | **latest**  | Use instead of RN `<SafeAreaView>` (deprecated).                      |

## State & Forms

| Library         | Version    | Notes                                                                                                                      |
| --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| zustand         | **5.0.x**  | Breaking: use named imports, not default. Use `createWithEqualityFn` from `zustand/traditional` if custom equality needed. |
| react-hook-form | **latest** | Form management.                                                                                                           |
| zod             | **latest** | Schema validation.                                                                                                         |

## Maps, Payments, Charts

| Library                                 | Version    | Notes                                    |
| --------------------------------------- | ---------- | ---------------------------------------- |
| react-native-maps                       | **1.27.x** | `expo-maps` is still alpha — do not use. |
| @stripe/stripe-react-native             | **0.58.x** | Test mode for mock checkout.             |
| victory-native / react-native-chart-kit | **latest** | Owner dashboard charts.                  |

## Expo Modules

| Module                         | Usage                                     |
| ------------------------------ | ----------------------------------------- |
| expo-font / @expo-google-fonts | Font loading (Playfair Display SC, Karla) |
| expo-image-picker              | Camera/gallery for avatar and menu photos |
| expo-haptics                   | Haptic feedback on interactions           |
| expo-notifications             | Push notifications for order updates      |
| expo-location                  | GPS for delivery addresses                |
| expo-secure-store              | Sensitive token storage                   |
| expo-file-system               | Base64 file reading for Supabase uploads  |

## Critical Setup Notes

### New Architecture (mandatory)

SDK 54 enables New Architecture by default. SDK 55 will remove the legacy architecture entirely. All libraries in this stack support it.

### Reanimated v4 Babel Plugin

The Babel plugin moved to a separate package. If using `babel-preset-expo` (default in Expo), this is handled automatically. If using a custom Babel config:

```js
// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: ['react-native-worklets/plugin'], // NOT 'react-native-reanimated/plugin'
    };
};
```

### Zustand v5 Import Pattern

```ts
// CORRECT (v5)
import { create } from 'zustand';

// WRONG (v4 pattern, will error)
// import create from 'zustand';
```

### Supabase File Upload

Blob/File/FormData are broken in React Native. Always use base64 → ArrayBuffer:

```ts
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
});
await supabase.storage.from('bucket').upload(path, decode(base64), {
    contentType: 'image/jpeg',
});
```

### SafeAreaView

`<SafeAreaView>` from `react-native` is deprecated. Always use:

```ts
import { SafeAreaView } from 'react-native-safe-area-context';
```

### Expo Router v6 Navigation

`router.navigate()` now behaves like `router.push()`. To go back to an existing route, use `router.back()` or `router.replace()`.
