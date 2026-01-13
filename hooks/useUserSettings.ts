
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserSettings } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      console.log('useUserSettings: Loading settings');
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          pushNotificationsEnabled: data.push_notifications_enabled,
          emailNotificationsEnabled: data.email_notifications_enabled,
          taskNotifications: data.task_notifications,
          eventNotifications: data.event_notifications,
          shoppingNotifications: data.shopping_notifications,
          pollNotifications: data.poll_notifications,
          mealNotifications: data.meal_notifications,
          showPersonalCalendarEvents: data.show_personal_calendar_events,
          isPremium: data.is_premium || false, // Added for AI feature gating
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        // Create default settings
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('useUserSettings: Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          push_notifications_enabled: true,
          email_notifications_enabled: true,
          task_notifications: true,
          event_notifications: true,
          shopping_notifications: true,
          poll_notifications: true,
          meal_notifications: true,
          show_personal_calendar_events: true,
          is_premium: false, // Default to free tier
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          pushNotificationsEnabled: data.push_notifications_enabled,
          emailNotificationsEnabled: data.email_notifications_enabled,
          taskNotifications: data.task_notifications,
          eventNotifications: data.event_notifications,
          shoppingNotifications: data.shopping_notifications,
          pollNotifications: data.poll_notifications,
          mealNotifications: data.meal_notifications,
          showPersonalCalendarEvents: data.show_personal_calendar_events,
          isPremium: data.is_premium || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('useUserSettings: Error creating default settings:', error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      console.log('useUserSettings: Updating settings');
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: any = {};
      if (updates.pushNotificationsEnabled !== undefined) 
        dbUpdates.push_notifications_enabled = updates.pushNotificationsEnabled;
      if (updates.emailNotificationsEnabled !== undefined) 
        dbUpdates.email_notifications_enabled = updates.emailNotificationsEnabled;
      if (updates.taskNotifications !== undefined) 
        dbUpdates.task_notifications = updates.taskNotifications;
      if (updates.eventNotifications !== undefined) 
        dbUpdates.event_notifications = updates.eventNotifications;
      if (updates.shoppingNotifications !== undefined) 
        dbUpdates.shopping_notifications = updates.shoppingNotifications;
      if (updates.pollNotifications !== undefined) 
        dbUpdates.poll_notifications = updates.pollNotifications;
      if (updates.mealNotifications !== undefined) 
        dbUpdates.meal_notifications = updates.mealNotifications;
      if (updates.showPersonalCalendarEvents !== undefined) 
        dbUpdates.show_personal_calendar_events = updates.showPersonalCalendarEvents;
      if (updates.isPremium !== undefined) 
        dbUpdates.is_premium = updates.isPremium;

      const { data, error } = await supabase
        .from('user_settings')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          userId: data.user_id,
          pushNotificationsEnabled: data.push_notifications_enabled,
          emailNotificationsEnabled: data.email_notifications_enabled,
          taskNotifications: data.task_notifications,
          eventNotifications: data.event_notifications,
          shoppingNotifications: data.shopping_notifications,
          pollNotifications: data.poll_notifications,
          mealNotifications: data.meal_notifications,
          showPersonalCalendarEvents: data.show_personal_calendar_events,
          isPremium: data.is_premium || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }

      console.log('useUserSettings: Settings updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('useUserSettings: Error updating settings:', error);
      return { error: error.message };
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    refreshSettings: loadSettings,
  };
}
