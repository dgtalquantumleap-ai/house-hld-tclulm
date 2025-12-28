
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeCache } from '@/utils/realtimeCache';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      // Listen to centralized realtime events
      const handleUpdate = () => {
        console.log('useNotifications: Received realtime update event');
        realtimeCache.throttle(
          `notifications_reload_${user?.id}`,
          () => {
            realtimeCache.invalidate(`notifications_${user?.id}`);
            loadNotifications(true);
          },
          2000 // 2 second throttle for notifications
        );
      };

      window.addEventListener('notifications-updated', handleUpdate as EventListener);

      return () => {
        window.removeEventListener('notifications-updated', handleUpdate as EventListener);
      };
    } else {
      setIsLoading(false);
    }
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
    unreadCount: getUnreadCount(),
  };
}
