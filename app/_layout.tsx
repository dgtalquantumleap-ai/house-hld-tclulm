
import "react-native-reanimated";
import React, { useEffect, useState, useCallback } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsProvider";
import { PushNotificationsProvider } from "@/contexts/PushNotificationsProvider";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { WidgetProvider } from "@/contexts/WidgetContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (loaded) {
          // Small delay to ensure everything is mounted
          await new Promise(resolve => setTimeout(resolve, 100));
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, [loaded]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen once layout is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!appIsReady) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <NotificationsProvider>
            <PushNotificationsProvider>
              <RealtimeProvider>
                <WidgetProvider>
                  <GestureHandlerRootView onLayout={onLayoutRootView}>
                    <Stack screenOptions={{ headerShown: false }}>
                      {/* Auth screens */}
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      
                      {/* Main app with tabs */}
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                      {/* Household setup */}
                      <Stack.Screen name="household-setup" options={{ headerShown: false }} />

                      {/* Debug screens */}
                      <Stack.Screen name="auth-debug" options={{ headerShown: false }} />
                      <Stack.Screen name="error-test" options={{ headerShown: false }} />
                      <Stack.Screen name="validation-dashboard" options={{ headerShown: false }} />

                      {/* Modal Demo Screens */}
                      <Stack.Screen
                        name="modal"
                        options={{
                          presentation: "modal",
                          title: "Standard Modal",
                        }}
                      />
                      <Stack.Screen
                        name="formsheet"
                        options={{
                          presentation: "formSheet",
                          title: "Form Sheet Modal",
                          sheetGrabberVisible: true,
                          sheetAllowedDetents: [0.5, 0.8, 1.0],
                          sheetCornerRadius: 20,
                        }}
                      />
                      <Stack.Screen
                        name="transparent-modal"
                        options={{
                          presentation: "transparentModal",
                          headerShown: false,
                        }}
                      />
                    </Stack>
                    <SystemBars style={"auto"} />
                  </GestureHandlerRootView>
                </WidgetProvider>
              </RealtimeProvider>
            </PushNotificationsProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}
