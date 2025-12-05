
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from './IconSymbol';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    return pathname.startsWith(route);
  };

  const getIconName = (icon: string, active: boolean) => {
    const iconMap: { [key: string]: { ios: string; iosFilled: string; android: string } } = {
      'home': { ios: 'house', iosFilled: 'house.fill', android: 'home' },
      'check-circle': { ios: 'checkmark.circle', iosFilled: 'checkmark.circle.fill', android: 'check_circle' },
      'calendar': { ios: 'calendar', iosFilled: 'calendar.circle.fill', android: 'calendar_today' },
      'shopping-cart': { ios: 'cart', iosFilled: 'cart.fill', android: 'shopping_cart' },
      'person': { ios: 'person', iosFilled: 'person.fill', android: 'person' },
    };

    const iconData = iconMap[icon] || { ios: 'circle', iosFilled: 'circle.fill', android: 'circle' };
    
    if (Platform.OS === 'ios') {
      return active ? iconData.iosFilled : iconData.ios;
    }
    return iconData.android;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
            >
              <IconSymbol
                ios_icon_name={getIconName(tab.icon, active)}
                android_material_icon_name={getIconName(tab.icon, active)}
                size={24}
                color={active ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
