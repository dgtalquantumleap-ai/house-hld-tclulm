
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  tasks: any[];
  shoppingItems: any[];
  events: any[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Use refs to track channels and prevent duplicate subscriptions
  const tasksChannelRef = useRef<RealtimeChannel | null>(null);
  const shopChannelRef = useRef<RealtimeChannel | null>(null);
  const eventsChannelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribingRef = useRef(false);

  useEffect(() => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID, clearing data and skipping subscriptions');
      setTasks([]);
      setShoppingItems([]);
      setEvents([]);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Clean up any existing channels
      cleanupChannels();
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribingRef.current) {
      console.log('[RealtimeProvider] Already subscribing, skipping...');
      return;
    }

    console.log('[RealtimeProvider] Setting up subscriptions for household:', user.householdId);
    isSubscribingRef.current = true;
    setConnectionStatus('connecting');

    // Initial data load
    loadTasks();
    loadShop();
    loadEvents();

    // Setup realtime subscriptions with broadcast
    setupRealtimeSubscriptions();

    return () => {
      console.log('[RealtimeProvider] Cleaning up subscriptions');
      cleanupChannels();
      isSubscribingRef.current = false;
    };
  }, [user?.householdId]);

  const cleanupChannels = () => {
    if (tasksChannelRef.current) {
      supabase.removeChannel(tasksChannelRef.current);
      tasksChannelRef.current = null;
    }
    if (shopChannelRef.current) {
      supabase.removeChannel(shopChannelRef.current);
      shopChannelRef.current = null;
    }
    if (eventsChannelRef.current) {
      supabase.removeChannel(eventsChannelRef.current);
      eventsChannelRef.current = null;
    }
  };

  const setupRealtimeSubscriptions = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for subscriptions');
      return;
    }

    try {
      // Set auth token before subscribing
      await supabase.realtime.setAuth();

      // Tasks Channel - using broadcast with household-specific topic
      if (!tasksChannelRef.current || tasksChannelRef.current.state === 'closed') {
        const tasksChannel = supabase.channel(`household:${user.householdId}:tasks`, {
          config: {
            broadcast: { self: false, ack: false },
            private: false, // Using public channel for now (can be made private with RLS)
          },
        });

        tasksChannel
          .on('broadcast', { event: 'task_created' }, (payload) => {
            console.log('[RealtimeProvider] Task created:', payload);
            loadTasks();
          })
          .on('broadcast', { event: 'task_updated' }, (payload) => {
            console.log('[RealtimeProvider] Task updated:', payload);
            loadTasks();
          })
          .on('broadcast', { event: 'task_deleted' }, (payload) => {
            console.log('[RealtimeProvider] Task deleted:', payload);
            loadTasks();
          })
          .subscribe((status, err) => {
            console.log('[RealtimeProvider] Tasks channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[RealtimeProvider] Tasks channel connected');
              updateConnectionStatus();
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[RealtimeProvider] Tasks channel error:', err);
              setConnectionStatus('error');
            } else if (status === 'CLOSED') {
              console.log('[RealtimeProvider] Tasks channel closed');
              setConnectionStatus('disconnected');
            }
          });

        tasksChannelRef.current = tasksChannel;
      }

      // Shopping Channel - using broadcast with household-specific topic
      if (!shopChannelRef.current || shopChannelRef.current.state === 'closed') {
        const shopChannel = supabase.channel(`household:${user.householdId}:shopping`, {
          config: {
            broadcast: { self: false, ack: false },
            private: false,
          },
        });

        shopChannel
          .on('broadcast', { event: 'shopping_item_created' }, (payload) => {
            console.log('[RealtimeProvider] Shopping item created:', payload);
            loadShop();
          })
          .on('broadcast', { event: 'shopping_item_updated' }, (payload) => {
            console.log('[RealtimeProvider] Shopping item updated:', payload);
            loadShop();
          })
          .on('broadcast', { event: 'shopping_item_deleted' }, (payload) => {
            console.log('[RealtimeProvider] Shopping item deleted:', payload);
            loadShop();
          })
          .subscribe((status, err) => {
            console.log('[RealtimeProvider] Shopping channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[RealtimeProvider] Shopping channel connected');
              updateConnectionStatus();
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[RealtimeProvider] Shopping channel error:', err);
              setConnectionStatus('error');
            } else if (status === 'CLOSED') {
              console.log('[RealtimeProvider] Shopping channel closed');
              setConnectionStatus('disconnected');
            }
          });

        shopChannelRef.current = shopChannel;
      }

      // Events Channel - using broadcast with household-specific topic
      if (!eventsChannelRef.current || eventsChannelRef.current.state === 'closed') {
        const eventsChannel = supabase.channel(`household:${user.householdId}:events`, {
          config: {
            broadcast: { self: false, ack: false },
            private: false,
          },
        });

        eventsChannel
          .on('broadcast', { event: 'event_created' }, (payload) => {
            console.log('[RealtimeProvider] Event created:', payload);
            loadEvents();
          })
          .on('broadcast', { event: 'event_updated' }, (payload) => {
            console.log('[RealtimeProvider] Event updated:', payload);
            loadEvents();
          })
          .on('broadcast', { event: 'event_deleted' }, (payload) => {
            console.log('[RealtimeProvider] Event deleted:', payload);
            loadEvents();
          })
          .subscribe((status, err) => {
            console.log('[RealtimeProvider] Events channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('[RealtimeProvider] Events channel connected');
              updateConnectionStatus();
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[RealtimeProvider] Events channel error:', err);
              setConnectionStatus('error');
            } else if (status === 'CLOSED') {
              console.log('[RealtimeProvider] Events channel closed');
              setConnectionStatus('disconnected');
            }
          });

        eventsChannelRef.current = eventsChannel;
      }

      isSubscribingRef.current = false;
    } catch (error) {
      console.error('[RealtimeProvider] Error setting up subscriptions:', error);
      setConnectionStatus('error');
      isSubscribingRef.current = false;
    }
  };

  const updateConnectionStatus = () => {
    const tasksConnected = tasksChannelRef.current?.state === 'joined';
    const shopConnected = shopChannelRef.current?.state === 'joined';
    const eventsConnected = eventsChannelRef.current?.state === 'joined';
    
    const allConnected = tasksConnected && shopConnected && eventsConnected;
    
    setIsConnected(allConnected);
    setConnectionStatus(allConnected ? 'connected' : 'connecting');
  };

  const loadTasks = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for loading tasks');
      return;
    }
    
    try {
      console.log('[RealtimeProvider] Loading tasks for household:', user.householdId);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', user.householdId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading tasks:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'tasks');
        setTasks(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading tasks:', error);
    }
  };

  const loadShop = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for loading shopping items');
      return;
    }
    
    try {
      console.log('[RealtimeProvider] Loading shopping items for household:', user.householdId);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading shopping items:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'shopping items');
        setShoppingItems(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading shopping items:', error);
    }
  };

  const loadEvents = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for loading events');
      return;
    }
    
    try {
      console.log('[RealtimeProvider] Loading events for household:', user.householdId);
      const { data, error } = await supabase
        .from('household_events')
        .select('*')
        .eq('household_id', user.householdId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading events:', error);
        return;
      }
      
      if (data) {
        console.log('[RealtimeProvider] Loaded', data.length, 'events');
        setEvents(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading events:', error);
    }
  };

  return (
    <RealtimeContext.Provider value={{ tasks, shoppingItems, events, isConnected, connectionStatus }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtimeData = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeData must be used within a RealtimeProvider');
  }
  return context;
};
