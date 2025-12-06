
import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inTabsGroup = segments[0] === '(tabs)';

    // Only redirect if we're in the tabs group and haven't redirected yet
    if (!inTabsGroup) {
      hasRedirectedRef.current = false;
      return;
    }

    if (!isAuthenticated && !hasRedirectedRef.current) {
      console.log('TabLayout: Redirecting to auth (not authenticated)');
      hasRedirectedRef.current = true;
      setTimeout(() => {
        router.replace('/(auth)');
      }, 0);
      return;
    }

    // Redirect to onboarding if user doesn't have a household
    if (isAuthenticated && user && !user.householdId && !hasRedirectedRef.current) {
      console.log('TabLayout: Redirecting to onboarding (no household)');
      hasRedirectedRef.current = true;
      setTimeout(() => {
        router.replace('/(auth)/onboarding');
      }, 0);
      return;
    }
  }, [isAuthenticated, isLoading, user?.householdId, segments]);

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
      name: 'shopping',
      route: '/(tabs)/shopping',
      icon: 'shopping-cart',
      label: 'Shopping',
    },
    {
      name: 'expenses',
      route: '/(tabs)/expenses',
      icon: 'attach-money',
      label: 'Expenses',
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
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </React.Fragment>
  );
}
