
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('AuthLayout: Effect triggered', {
      isLoading,
      isAuthenticated,
      hasHousehold: !!user?.householdId,
      segments: segments.join('/'),
    });

    if (isLoading) {
      console.log('AuthLayout: Still loading, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    console.log('AuthLayout: In auth group?', inAuthGroup);

    // If not in auth group, don't do anything
    if (!inAuthGroup) {
      return;
    }

    // If authenticated and has household, redirect to home
    if (isAuthenticated && user?.householdId) {
      console.log('AuthLayout: User authenticated with household, redirecting to home');
      // Use replace to prevent back navigation to auth screens
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
      }, 100);
      return;
    }

    // If authenticated but no household, redirect to onboarding
    if (isAuthenticated && !user?.householdId) {
      console.log('AuthLayout: User authenticated without household, redirecting to onboarding');
      // Only redirect if not already on onboarding
      if (segments[1] !== 'onboarding') {
        setTimeout(() => {
          router.replace('/(auth)/onboarding');
        }, 100);
      }
      return;
    }

    // If not authenticated and not on welcome/login/signup, redirect to welcome
    if (!isAuthenticated && segments[1] !== 'index' && segments[1] !== 'login' && segments[1] !== 'signup') {
      console.log('AuthLayout: Not authenticated, redirecting to welcome');
      setTimeout(() => {
        router.replace('/(auth)/');
      }, 100);
    }
  }, [isAuthenticated, isLoading, user?.householdId, segments, router]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
