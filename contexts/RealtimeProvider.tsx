
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  tasks: any[];
  shoppingItems: any[];
  events: any[];
  meals: any[];
  polls: any[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  refreshAll: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [shoppingItems, setShoppingItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Use a single channel ref for the household
  const householdChannelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribingRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<{ [key: string]: number }>({});

  // Debounce data fetching to prevent excessive queries
  const debouncedFetch = useCallback((key: string, fetchFn: () => Promise<void>, delay = 500) => {
    const now = Date.now();
    const lastFetch = lastFetchRef.current[key] || 0;
    
    if (now - lastFetch < delay) {
      console.log(`[RealtimeProvider] Debouncing ${key} fetch`);
      return;
    }
    
    lastFetchRef.current[key] = now;
    fetchFn();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID, clearing data and skipping subscriptions');
      setTasks([]);
      setShoppingItems([]);
      setEvents([]);
      setMeals([]);
      setPolls([]);
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

    console.log('[RealtimeProvider] ========================================');
    console.log('[RealtimeProvider] Setting up realtime for household:', user.householdId);
    console.log('[RealtimeProvider] ========================================');
    
    isSubscribingRef.current = true;
    setConnectionStatus('connecting');

    // Initial data load
    loadAllData();

    // Setup realtime subscriptions
    setupRealtimeSubscriptions();

    return () => {
      console.log('[RealtimeProvider] Cleaning up subscriptions');
      isMountedRef.current = false;
      cleanupChannels();
      isSubscribingRef.current = false;
    };
  }, [user?.householdId]);

  const cleanupChannels = () => {
    try {
      if (householdChannelRef.current) {
        console.log('[RealtimeProvider] Removing household channel');
        supabase.removeChannel(householdChannelRef.current);
        householdChannelRef.current = null;
      }
    } catch (error) {
      console.error('[RealtimeProvider] Error cleaning up channels:', error);
    }
  };

  const setupRealtimeSubscriptions = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for subscriptions');
      return;
    }

    try {
      // Clean up existing channel first
      if (householdChannelRef.current) {
        supabase.removeChannel(householdChannelRef.current);
        householdChannelRef.current = null;
      }

      // Create a single channel for all household data
      const channelName = `household:${user.householdId}:all`;
      console.log('[RealtimeProvider] Creating channel:', channelName);

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false, ack: false },
          private: false,
        },
      });

      // Subscribe to tasks changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${user.householdId}`,
        },
        (payload) => {
          console.log('[RealtimeProvider] Tasks change:', payload.eventType);
          handleTasksChange(payload);
        }
      );

      // Subscribe to shopping items changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `household_id=eq.${user.householdId}`,
        },
        (payload) => {
          console.log('[RealtimeProvider] Shopping change:', payload.eventType);
          handleShoppingChange(payload);
        }
      );

      // Subscribe to events changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_events',
          filter: `household_id=eq.${user.householdId}`,
        },
        (payload) => {
          console.log('[RealtimeProvider] Events change:', payload.eventType);
          handleEventsChange(payload);
        }
      );

      // Subscribe to meals changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `household_id=eq.${user.householdId}`,
        },
        (payload) => {
          console.log('[RealtimeProvider] Meals change:', payload.eventType);
          handleMealsChange(payload);
        }
      );

      // Subscribe to polls changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls',
          filter: `household_id=eq.${user.householdId}`,
        },
        (payload) => {
          console.log('[RealtimeProvider] Polls change:', payload.eventType);
          handlePollsChange(payload);
        }
      );

      // Subscribe to the channel
      channel.subscribe((status, err) => {
        console.log('[RealtimeProvider] Channel status:', status);
        if (!isMountedRef.current) return;
        
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeProvider] ✅ Successfully subscribed to realtime');
          setIsConnected(true);
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeProvider] ❌ Channel error:', err);
          setConnectionStatus('error');
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          console.log('[RealtimeProvider] Channel closed');
          setConnectionStatus('disconnected');
          setIsConnected(false);
        }
      });

      householdChannelRef.current = channel;
      isSubscribingRef.current = false;
    } catch (error) {
      console.error('[RealtimeProvider] Error setting up subscriptions:', error);
      if (isMountedRef.current) {
        setConnectionStatus('error');
        setIsConnected(false);
      }
      isSubscribingRef.current = false;
    }
  };

  // Optimized change handlers that update state immediately
  const handleTasksChange = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setTasks(prev => {
      switch (eventType) {
        case 'INSERT':
          // Check if already exists (prevent duplicates)
          if (prev.some(t => t.id === newRecord.id)) {
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(t => t.id === newRecord.id ? newRecord : t);
        
        case 'DELETE':
          return prev.filter(t => t.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleShoppingChange = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setShoppingItems(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(i => i.id === newRecord.id)) {
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(i => i.id === newRecord.id ? newRecord : i);
        
        case 'DELETE':
          return prev.filter(i => i.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleEventsChange = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setEvents(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(e => e.id === newRecord.id)) {
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(e => e.id === newRecord.id ? newRecord : e);
        
        case 'DELETE':
          return prev.filter(e => e.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleMealsChange = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setMeals(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(m => m.id === newRecord.id)) {
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(m => m.id === newRecord.id ? newRecord : m);
        
        case 'DELETE':
          return prev.filter(m => m.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handlePollsChange = useCallback((payload: any) => {
    if (!isMountedRef.current) return;

    const { eventType, new: newRecord, old: oldRecord } = payload;

    setPolls(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(p => p.id === newRecord.id)) {
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          return prev.map(p => p.id === newRecord.id ? newRecord : p);
        
        case 'DELETE':
          return prev.filter(p => p.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const loadAllData = async () => {
    if (!user?.householdId || !isMountedRef.current) {
      return;
    }

    console.log('[RealtimeProvider] Loading all data for household:', user.householdId);

    // Load all data in parallel
    await Promise.all([
      loadTasks(),
      loadShoppingItems(),
      loadEvents(),
      loadMeals(),
      loadPolls(),
    ]);
  };

  const loadTasks = async () => {
    if (!user?.householdId || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', user.householdId)
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading tasks:', error);
        return;
      }
      
      if (data && isMountedRef.current) {
        console.log('[RealtimeProvider] Loaded', data.length, 'tasks');
        setTasks(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading tasks:', error);
    }
  };

  const loadShoppingItems = async () => {
    if (!user?.householdId || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading shopping items:', error);
        return;
      }
      
      if (data && isMountedRef.current) {
        console.log('[RealtimeProvider] Loaded', data.length, 'shopping items');
        setShoppingItems(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading shopping items:', error);
    }
  };

  const loadEvents = async () => {
    if (!user?.householdId || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('household_events')
        .select('*')
        .eq('household_id', user.householdId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading events:', error);
        return;
      }
      
      if (data && isMountedRef.current) {
        console.log('[RealtimeProvider] Loaded', data.length, 'events');
        setEvents(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading events:', error);
    }
  };

  const loadMeals = async () => {
    if (!user?.householdId || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('household_id', user.householdId)
        .order('meal_date', { ascending: true });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading meals:', error);
        return;
      }
      
      if (data && isMountedRef.current) {
        console.log('[RealtimeProvider] Loaded', data.length, 'meals');
        setMeals(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading meals:', error);
    }
  };

  const loadPolls = async () => {
    if (!user?.householdId || !isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('household_id', user.householdId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RealtimeProvider] Error loading polls:', error);
        return;
      }
      
      if (data && isMountedRef.current) {
        console.log('[RealtimeProvider] Loaded', data.length, 'polls');
        setPolls(data);
      }
    } catch (error) {
      console.error('[RealtimeProvider] Exception loading polls:', error);
    }
  };

  const refreshAll = useCallback(async () => {
    console.log('[RealtimeProvider] Manual refresh requested');
    await loadAllData();
  }, [user?.householdId]);

  return (
    <RealtimeContext.Provider value={{ 
      tasks, 
      shoppingItems, 
      events, 
      meals,
      polls,
      isConnected, 
      connectionStatus,
      refreshAll,
    }}>
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
