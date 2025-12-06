
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // Only redirect if we're in the auth group and haven't redirected yet
    if (!inAuthGroup) {
      hasRedirectedRef.current = false;
      return;
    }

    // If authenticated and has household, go to tabs
    if (isAuthenticated && user?.householdId && !hasRedirectedRef.current) {
      console.log('AuthLayout: Redirecting to tabs (has household)');
      hasRedirectedRef.current = true;
      setTimeout(() => {
        router.replace('/(tabs)/(home)');
      }, 0);
      return;
    }

    // If authenticated but no household, go to onboarding
    if (isAuthenticated && !user?.householdId && segments[1] !== 'onboarding' && !hasRedirectedRef.current) {
      console.log('AuthLayout: Redirecting to onboarding (no household)');
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
