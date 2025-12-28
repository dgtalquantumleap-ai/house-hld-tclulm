
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

    console.log('[REALTIME] Initializing centralized subscriptions for household:', user.householdId);
    
    // Subscribe to all essential channels
    subscribeToTasks();
    subscribeToShopping();
    subscribeToEvents();
    subscribeToNotifications();
    subscribeToPolls();

    setIsConnected(true);

    // Cleanup all subscriptions on unmount
    return () => {
      console.log('[REALTIME] Cleaning up all subscriptions');
      
      Object.entries(channelsRef.current).forEach(([name, channel]) => {
        if (channel) {
          console.log(`[UNSUB] Removing channel: ${name}`);
          supabase.removeChannel(channel);
        }
      });
      
      channelsRef.current = {};
      setActiveChannels(0);
      setIsConnected(false);
    };
  }, [user?.householdId, user?.id]);

  const subscribeToTasks = () => {
    if (channelsRef.current.tasks?.state === 'subscribed') {
      console.log('[SUB] Tasks: Already subscribed');
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
          console.log('[REALTIME] Tasks update:', payload.eventType);
          // Dispatch custom event for hooks to listen to
          window.dispatchEvent(new CustomEvent('tasks-updated', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Tasks status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => prev + 1);
        }
      });

    channelsRef.current.tasks = channel;
  };

  const subscribeToShopping = () => {
    if (channelsRef.current.shopping?.state === 'subscribed') {
      console.log('[SUB] Shopping: Already subscribed');
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
          console.log('[REALTIME] Shopping update:', payload.eventType);
          window.dispatchEvent(new CustomEvent('shopping-updated', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Shopping status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => prev + 1);
        }
      });

    channelsRef.current.shopping = channel;
  };

  const subscribeToEvents = () => {
    if (channelsRef.current.events?.state === 'subscribed') {
      console.log('[SUB] Events: Already subscribed');
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
          console.log('[REALTIME] Events update:', payload.eventType);
          window.dispatchEvent(new CustomEvent('events-updated', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Events status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => prev + 1);
        }
      });

    channelsRef.current.events = channel;
  };

  const subscribeToNotifications = () => {
    if (!user?.id) return;
    
    if (channelsRef.current.notifications?.state === 'subscribed') {
      console.log('[SUB] Notifications: Already subscribed');
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
          window.dispatchEvent(new CustomEvent('notifications-updated', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Notifications status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => prev + 1);
        }
      });

    channelsRef.current.notifications = channel;
  };

  const subscribeToPolls = () => {
    if (channelsRef.current.polls?.state === 'subscribed') {
      console.log('[SUB] Polls: Already subscribed');
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
          console.log('[REALTIME] Polls update:', payload.eventType);
          window.dispatchEvent(new CustomEvent('polls-updated', { detail: payload }));
        }
      )
      .subscribe((status) => {
        console.log('[SUB] Polls status:', status);
        if (status === 'SUBSCRIBED') {
          setActiveChannels(prev => prev + 1);
        }
      });

    channelsRef.current.polls = channel;
  };

  const contextValue = {
    isConnected,
    activeChannels,
  };

  console.log('[REALTIME] Provider state:', {
    isConnected,
    activeChannels,
    hasUser: !!user,
    householdId: user?.householdId || 'None',
  });

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
