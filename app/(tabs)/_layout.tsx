
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
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
      icon: 'event',
      label: 'Calendar',
    },
    {
      name: 'polls',
      route: '/(tabs)/polls',
      icon: 'poll',
      label: 'Polls',
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
        <Stack.Screen name="expenses" />
        <Stack.Screen name="polls" />
        <Stack.Screen name="meals" />
        <Stack.Screen name="household" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
