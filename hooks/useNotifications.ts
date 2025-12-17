
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { realtimeCache } from '@/utils/realtimeCache';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const loadingRef = useRef(false);

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

  const loadNotifications = async (skipCache = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('useNotifications: Load already in progress, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      const cacheKey = `notifications_${user?.id}`;

      // Check cache first (unless explicitly skipped)
      if (!skipCache) {
        const cached = realtimeCache.get<Notification[]>(cacheKey);
        if (cached) {
          setNotifications(cached);
          setIsLoading(false);
          return;
        }
      }

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
        
        // Cache the results for 5 seconds (notifications are less time-sensitive)
        realtimeCache.set(cacheKey, mappedNotifications, 5000);
      }
    } catch (err: any) {
      console.error('useNotifications: Error loading notifications:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const subscribeToNotifications = () => {
    // Prevent duplicate subscriptions
    if (channelRef.current?.state === 'subscribed') {
      console.log('useNotifications: Already subscribed to real-time updates');
      return;
    }

    console.log('useNotifications: Subscribing to real-time notification updates');
    
    // Use dedicated topic for better performance
    const channel = supabase
      .channel(`user:${user?.id}:notifications`, {
        config: {
          broadcast: { self: false },
          private: false, // Will be set to true once we add RLS policies
        },
      })
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
          
          // Throttle updates to prevent excessive reloads
          // Notifications can be slightly delayed, so use 2 second throttle
          realtimeCache.throttle(
            `notifications_reload_${user?.id}`,
            () => {
              // Invalidate cache and reload
              realtimeCache.invalidate(`notifications_${user?.id}`);
              loadNotifications(true);
            },
            2000 // 2 second throttle
          );
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`notifications_${user?.id}`);
      
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`notifications_${user?.id}`);
      
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
      
      // Invalidate cache immediately for instant UI update
      realtimeCache.invalidate(`notifications_${user?.id}`);
      
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
    refreshNotifications: () => loadNotifications(true),
    getUnreadCount,
  };
}
