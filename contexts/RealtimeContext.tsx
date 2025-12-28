
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  isConnected: boolean;
  activeChannels: number;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  activeChannels: 0,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeChannels, setActiveChannels] = useState(0);
  
  const channelsRef = useRef<{
    tasks?: RealtimeChannel;
    shopping?: RealtimeChannel;
    events?: RealtimeChannel;
    notifications?: RealtimeChannel;
    polls?: RealtimeChannel;
  }>({});

  useEffect(() => {
    if (!user?.householdId) {
      console.log('[REALTIME] No household, skipping subscriptions');
      return;
    }

    console.log('[REALTIME] ========================================');
    console.log('[REALTIME] Initializing centralized subscriptions');
    console.log('[REALTIME] Household ID:', user.householdId);
    console.log('[REALTIME] User ID:', user.id);
    console.log('[REALTIME] ========================================');
    
    // Subscribe to all essential channels
    subscribeToTasks();
    subscribeToShopping();
    subscribeToEvents();
    subscribeToNotifications();
    subscribeToPolls();

    setIsConnected(true);

    // CRITICAL CLEANUP - This is the most important part
    return () => {
      console.log('[REALTIME] ========================================');
      console.log('[REALTIME] CLEANING UP ALL SUBSCRIPTIONS');
      console.log('[REALTIME] ========================================');
      
      Object.entries(channelsRef.current).forEach(([name, channel]) => {
        if (channel) {
          console.log(`[UNSUB] Removing channel: ${name}`);
          supabase.removeChannel(channel);
        }
      });
      
      channelsRef.current = {};
      setActiveChannels(0);
      setIsConnected(false);
      
      console.log('[REALTIME] All subscriptions cleaned up successfully');
    };
  }, [user?.householdId, user?.id]);

  const subscribeToTasks = () => {
    if (channelsRef.current.tasks) {
      console.log('[SUB] Tasks: Already subscribed, skipping');
      return;
    }

    console.log('[SUB] Starting: household-tasks');
    
    const channel = supabase
      .channel(`household:${user?.householdId}:tasks`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('[REALTIME] Tasks update:', payload.eventType, payload.new?.title || payload.old?.title);
          // Dispatch custom event for hooks to listen to
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tasks-updated', { detail: payload }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Tasks status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => {
            const newCount = prev + 1;
            console.log('[REALTIME] Active channels:', newCount);
            return newCount;
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SUB] Tasks subscription error');
        }
      });

    channelsRef.current.tasks = channel;
  };

  const subscribeToShopping = () => {
    if (channelsRef.current.shopping) {
      console.log('[SUB] Shopping: Already subscribed, skipping');
      return;
    }

    console.log('[SUB] Starting: household-shopping');
    
    const channel = supabase
      .channel(`household:${user?.householdId}:shopping`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('[REALTIME] Shopping update:', payload.eventType, payload.new?.name || payload.old?.name);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('shopping-updated', { detail: payload }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Shopping status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => {
            const newCount = prev + 1;
            console.log('[REALTIME] Active channels:', newCount);
            return newCount;
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SUB] Shopping subscription error');
        }
      });

    channelsRef.current.shopping = channel;
  };

  const subscribeToEvents = () => {
    if (channelsRef.current.events) {
      console.log('[SUB] Events: Already subscribed, skipping');
      return;
    }

    console.log('[SUB] Starting: household-events');
    
    const channel = supabase
      .channel(`household:${user?.householdId}:events`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_events',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('[REALTIME] Events update:', payload.eventType, payload.new?.title || payload.old?.title);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('events-updated', { detail: payload }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Events status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => {
            const newCount = prev + 1;
            console.log('[REALTIME] Active channels:', newCount);
            return newCount;
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SUB] Events subscription error');
        }
      });

    channelsRef.current.events = channel;
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;
    
    if (channelsRef.current.notifications) {
      console.log('[SUB] Notifications: Already subscribed, skipping');
      return;
    }

    console.log('[SUB] Starting: user-notifications');
    
    const channel = supabase
      .channel(`user:${user.id}:notifications`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[REALTIME] Notifications update:', payload.eventType);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications-updated', { detail: payload }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Notifications status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => {
            const newCount = prev + 1;
            console.log('[REALTIME] Active channels:', newCount);
            return newCount;
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SUB] Notifications subscription error');
        }
      });

    channelsRef.current.notifications = channel;
  };

  const subscribeToPolls = () => {
    if (channelsRef.current.polls) {
      console.log('[SUB] Polls: Already subscribed, skipping');
      return;
    }

    console.log('[SUB] Starting: household-polls');
    
    const channel = supabase
      .channel(`household:${user?.householdId}:polls`, {
        config: {
          broadcast: { self: false },
          private: false,
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `household_id=eq.${user?.householdId}`,
        },
        (payload) => {
          console.log('[REALTIME] Polls update:', payload.eventType, payload.new?.title || payload.old?.title);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('polls-updated', { detail: payload }));
          }
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Polls status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => {
            const newCount = prev + 1;
            console.log('[REALTIME] Active channels:', newCount);
            return newCount;
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SUB] Polls subscription error');
        }
      });

    channelsRef.current.polls = channel;
  };

  const contextValue = {
    isConnected,
    activeChannels,
  };

  console.log('[REALTIME] Provider render - Active channels:', activeChannels, 'Connected:', isConnected);

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
