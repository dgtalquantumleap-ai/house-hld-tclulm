
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      subscribeToNotifications();
    } else {
      setIsLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        console.log('useNotifications: Unsubscribing from real-time updates');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      console.log('useNotifications: Loading notifications for user:', user?.id);
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, household_id, title, message, type, read, related_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const mappedNotifications: Notification[] = data.map(notif => ({
          id: notif.id,
          userId: notif.user_id,
          householdId: notif.household_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          read: notif.read,
          relatedId: notif.related_id,
          createdAt: notif.created_at,
        }));
        setNotifications(mappedNotifications);
      }
    } catch (err: any) {
      console.error('useNotifications: Error loading notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current) {
      console.log('useNotifications: Already subscribed to real-time updates');
      return;
    }

    console.log('useNotifications: Subscribing to real-time notification updates');
    const channel = supabase
      .channel(`notifications_changes_${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('useNotifications: Real-time update received:', payload.eventType);
          loadNotifications();
        }
      )
      .subscribe((status) => {
        console.log('useNotifications: Subscription status:', status);
      });

    channelRef.current = channel;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('useNotifications: Marking notification as read:', notificationId);
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      console.log('useNotifications: Notification marked as read');
      return { error: null };
    } catch (err: any) {
      console.error('useNotifications: Error marking notification as read:', err);
      return { error: err.message };
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('useNotifications: Marking all notifications as read');
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      console.log('useNotifications: All notifications marked as read');
      return { error: null };
    } catch (err: any) {
      console.error('useNotifications: Error marking all notifications as read:', err);
      return { error: err.message };
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      console.log('useNotifications: Deleting notification:', notificationId);
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      console.log('useNotifications: Notification deleted');
      return { error: null };
    } catch (err: any) {
      console.error('useNotifications: Error deleting notification:', err);
      return { error: err.message };
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications,
    getUnreadCount,
  };
}
