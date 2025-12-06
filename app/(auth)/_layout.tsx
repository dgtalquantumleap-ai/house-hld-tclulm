
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  // If authenticated and has household, go to tabs
  if (isAuthenticated && user?.householdId) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  // If authenticated but no household, go to onboarding
  if (isAuthenticated && !user?.householdId) {
    return <Redirect href="/(auth)/onboarding" />;
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
