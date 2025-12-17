
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('TabLayout: Effect triggered', {
      isLoading,
      isAuthenticated,
      hasHousehold: !!user?.householdId,
      segments: segments.join('/'),
    });

    if (isLoading) {
      console.log('TabLayout: Still loading, waiting...');
      return;
    }

    const inTabsGroup = segments[0] === '(tabs)';
    console.log('TabLayout: In tabs group?', inTabsGroup);

    // Only check if we're in the tabs group
    if (!inTabsGroup) {
      return;
    }

    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      console.log('TabLayout: Not authenticated, redirecting to auth');
      setTimeout(() => {
        router.replace('/(auth)');
      }, 100);
      return;
    }

    // Redirect to onboarding if user doesn't have a household
    if (isAuthenticated && user && !user.householdId) {
      console.log('TabLayout: No household, redirecting to onboarding');
      setTimeout(() => {
        router.replace('/(auth)/onboarding');
      }, 100);
      return;
    }
  }, [isAuthenticated, isLoading, user?.householdId, segments, router]);

  if (isLoading) {
    return null;
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
