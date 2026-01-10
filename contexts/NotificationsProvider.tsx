
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationsContextType {
  expoPushToken: string | null;
}

const NotificationsContext = createContext<NotificationsContextType>({
  expoPushToken: null,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, [user]);

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'HouseHLD',
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    console.log('Push token registered:', token.data);
    return token.data;
  }

  async function savePushToken(token: string) {
    try {
      await supabase.from('push_tokens').upsert({
        user_id: user?.id,
        token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });
      console.log('Push token saved to database');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  return (
    <NotificationsContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
