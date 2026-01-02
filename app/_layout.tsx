
import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Platform } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupGlobalErrorHandlers } from "@/utils/globalErrorHandler";

// Prevent auto-hide to control splash screen manually
SplashScreen.preventAutoHideAsync();

// Configure splash screen animation (optional fade effect)
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('RootNavigator: Auth state changed', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      householdId: user?.householdId,
      currentSegments: segments.join('/'),
    });

    if (isLoading) {
      console.log('RootNavigator: Still loading, waiting...');
      return;
    }

    // Determine which group we're in
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const onHouseholdSetup = segments[0] === 'household-setup';

    console.log('RootNavigator: Current location', { inAuthGroup, inTabsGroup, onHouseholdSetup });

    // Handle navigation based on auth state
    if (!isAuthenticated) {
      // Not authenticated - should be in auth group
      if (!inAuthGroup) {
        console.log('RootNavigator: Not authenticated, redirecting to auth');
        setTimeout(() => {
          router.replace('/(auth)/');
        }, 100);
      }
    } else if (isAuthenticated && user) {
      // Authenticated - check household status
      if (!user.householdId) {
        // No household - should be on household-setup
        if (!onHouseholdSetup) {
          console.log('RootNavigator: No household, redirecting to household-setup');
          setTimeout(() => {
            router.replace('/household-setup');
          }, 100);
        }
      } else {
        // Has household - should be in tabs
        if (!inTabsGroup) {
          console.log('RootNavigator: Has household, redirecting to home');
          setTimeout(() => {
            router.replace('/(tabs)/(home)/');
          }, 100);
        }
      }
    }
  }, [isAuthenticated, isLoading, user?.householdId, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="household-setup" 
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen 
        name="modal" 
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Initialize global error handlers
    setupGlobalErrorHandlers();
  }, []);

  useEffect(() => {
    // Hide splash screen immediately when fonts are loaded
    // This ensures no delay in app startup
    if (loaded) {
      console.log('RootLayout: Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Error hiding splash screen:', error);
      });
    }
  }, [loaded]);

  useEffect(() => {
    // Log platform information for debugging
    console.log('RootLayout: Platform:', Platform.OS);
    console.log('RootLayout: Color scheme:', colorScheme);
  }, []);

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "#4CAF50",
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#333333",
      border: "#E0E0E0",
      notification: "#FF9800",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#4CAF50",
      background: "#1A1A1A",
      card: "#2A2A2A",
      text: "#FFFFFF",
      border: "#3A3A3A",
      notification: "#FF9800",
    },
  };

  return (
    <ErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <AuthProvider>
          <RealtimeProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootNavigator />
              <SystemBars style="auto" />
            </GestureHandlerRootView>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
