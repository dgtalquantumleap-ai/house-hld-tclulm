
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // If authenticated and has household, go to tabs
    if (isAuthenticated && user?.householdId && inAuthGroup) {
      console.log('AuthLayout: Redirecting to tabs (has household)');
      router.replace('/(tabs)/(home)');
      return;
    }

    // If authenticated but no household, go to onboarding
    if (isAuthenticated && !user?.householdId && inAuthGroup && segments[1] !== 'onboarding') {
      console.log('AuthLayout: Redirecting to onboarding (no household)');
      router.replace('/(auth)/onboarding');
      return;
    }
  }, [isAuthenticated, isLoading, user?.householdId, segments]);

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
