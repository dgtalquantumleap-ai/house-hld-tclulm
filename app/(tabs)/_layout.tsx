
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'tasks',
      route: '/(tabs)/tasks',
      icon: 'check-circle',
      label: 'Tasks',
    },
    {
      name: 'calendar',
      route: '/(tabs)/calendar',
      icon: 'calendar',
      label: 'Calendar',
    },
    {
      name: 'shopping',
      route: '/(tabs)/shopping',
      icon: 'shopping-cart',
      label: 'Shopping',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <React.Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="shopping" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
