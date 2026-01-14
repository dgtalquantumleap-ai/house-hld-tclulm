
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface PushNotificationsContextType {
  expoPushToken: string | null;
}

const PushNotificationsContext = createContext<PushNotificationsContextType>({
  expoPushToken: null,
});

export const PushNotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = React.useState<string | null>(null);

  useEffect(() => {
    console.log('PushNotificationsProvider: User authentication changed', { userId: user?.id });
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  useEffect(() => {
    console.log('PushNotificationsProvider: Setting up notification response listener');
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('PushNotificationsProvider: Notification tapped', { data });
      
      if (data.type === 'task') {
        console.log('PushNotificationsProvider: Navigating to tasks tab');
        router.push('/(tabs)/tasks');
      } else if (data.type === 'event') {
        console.log('PushNotificationsProvider: Navigating to calendar tab');
        router.push('/(tabs)/calendar');
      } else if (data.type === 'shopping') {
        console.log('PushNotificationsProvider: Navigating to shopping tab');
        router.push('/(tabs)/shopping');
      }
    });
    
    return () => {
      console.log('PushNotificationsProvider: Cleaning up notification listener');
      subscription.remove();
    };
  }, []);

  async function registerForPushNotifications() {
    try {
      console.log('PushNotificationsProvider: Starting push notification registration');
      
      if (!Device.isDevice) {
        console.log('PushNotificationsProvider: Not a physical device, skipping registration');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('PushNotificationsProvider: Existing permission status', { existingStatus });
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        console.log('PushNotificationsProvider: Requesting push notification permissions');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('PushNotificationsProvider: Permission request result', { finalStatus });
      }

      if (finalStatus !== 'granted') {
        console.log('PushNotificationsProvider: Push notification permission denied');
        return;
      }

      console.log('PushNotificationsProvider: Getting Expo push token');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '5aad831f',
      });
      const token = tokenData.data;
      console.log('PushNotificationsProvider: Expo push token obtained', { token });
      
      setExpoPushToken(token);

      if (user) {
        console.log('PushNotificationsProvider: Saving push token to database', { 
          userId: user.id, 
          platform: Platform.OS 
        });
        
        await supabase.from('push_tokens').upsert({
          user_id: user.id,
          token: token,
          platform: Platform.OS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,token' });
        
        console.log('PushNotificationsProvider: Push token saved successfully');
      }
    } catch (error) {
      console.error('PushNotificationsProvider: Error during push notification registration', error);
    }
  }

  return (
    <PushNotificationsContext.Provider value={{ expoPushToken }}>
      {children}
    </PushNotificationsContext.Provider>
  );
};

export const usePushNotifications = () => useContext(PushNotificationsContext);
