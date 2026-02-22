// Fallback for Android and web — uses Lucide icons instead of SF Symbols.
// Kept as platform-specific pattern reference.

import { Home, Send, Code, ChevronRight } from 'lucide-react-native';
import type { SymbolWeight } from 'expo-symbols';
import type { StyleProp, TextStyle } from 'react-native';

type IconComponent = (props: { size?: number; color?: string }) => JSX.Element;

const MAPPING = {
  'house.fill': Home,
  'paperplane.fill': Send,
  'chevron.left.forwardslash.chevron.right': Code,
  'chevron.right': ChevronRight,
} satisfies Record<string, IconComponent>;

type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const LucideIcon = MAPPING[name];
  return <LucideIcon size={size} color={color} />;
}
