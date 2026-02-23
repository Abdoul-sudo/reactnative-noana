import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  Tag,
  Settings,
} from 'lucide-react-native';

import { HapticTab } from '@/components/haptic-tab';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#1c1917' }, // stone-900
        tabBarActiveTintColor: '#f5f5f4',            // stone-100
        tabBarInactiveTintColor: '#78716c',           // stone-500
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <UtensilsCrossed size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: 'Promotions',
          tabBarIcon: ({ color }) => <Tag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
