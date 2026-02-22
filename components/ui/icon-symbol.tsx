// Fallback for Android and web — uses Lucide icons instead of SF Symbols.
// Kept as platform-specific pattern reference.

import { Home, Send, Code, ChevronRight } from 'lucide-react-native';
import type { SymbolWeight } from 'expo-symbols';
import type { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconComponent = (props: { size?: number; color?: string | OpaqueColorValue }) => JSX.Element;

const MAPPING: Record<string, IconComponent> = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
};

type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const LucideIcon = MAPPING[name] ?? Home;
  return <LucideIcon size={size} color={color as string} />;
}
