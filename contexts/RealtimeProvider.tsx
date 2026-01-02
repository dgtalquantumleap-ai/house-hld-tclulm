
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

      // CRITICAL FIX: Get the current session and set auth with the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[RealtimeProvider] Error getting session:', sessionError);
        setConnectionStatus('error');
        setIsConnected(false);
        isSubscribingRef.current = false;
        return;
      }

      if (!session?.access_token) {
        console.error('[RealtimeProvider] No access token available');
        setConnectionStatus('error');
        setIsConnected(false);
        isSubscribingRef.current = false;
        return;
      }

      // Set auth with the JWT access token (not user ID!)
      console.log('[RealtimeProvider] Setting realtime auth with access token');
      await supabase.realtime.setAuth(session.access_token);

      // Create a single channel for all household data using broadcast
      // Topic format: household:{household_id}
      const channelName = `household:${user.householdId}`;
      console.log('[RealtimeProvider] Creating broadcast channel:', channelName);

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { 
            self: false,  // Don't receive our own broadcasts (optimistic updates handle this)
            ack: false    // Don't wait for acknowledgment (faster)
          },
          private: true,  // Use private channel with RLS policies
        },
      });

      // Subscribe to INSERT events
      channel.on(
        'broadcast',
        { event: 'INSERT' },
        (payload) => {
          console.log('[RealtimeProvider] INSERT event:', payload);
          handleBroadcastEvent('INSERT', payload);
        }
      );

      // Subscribe to UPDATE events
      channel.on(
        'broadcast',
        { event: 'UPDATE' },
        (payload) => {
          console.log('[RealtimeProvider] UPDATE event:', payload);
          handleBroadcastEvent('UPDATE', payload);
        }
      );

      // Subscribe to DELETE events
      channel.on(
        'broadcast',
        { event: 'DELETE' },
        (payload) => {
          console.log('[RealtimeProvider] DELETE event:', payload);
          handleBroadcastEvent('DELETE', payload);
        }
      );

      // Subscribe to the channel
      channel.subscribe((status, err) => {
        console.log('[RealtimeProvider] Channel status:', status);
        if (!isMountedRef.current) return;
        
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeProvider] ✅ Successfully subscribed to realtime broadcast');
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
        } else if (status === 'TIMED_OUT') {
          console.warn('[RealtimeProvider] ⚠️ Channel timed out, will retry...');
          setConnectionStatus('error');
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

  // Handle broadcast events from database triggers
  const handleBroadcastEvent = useCallback((eventType: string, payload: any) => {
    if (!isMountedRef.current) return;

    // Extract data from payload
    const { table, new: newRecord, old: oldRecord } = payload.payload || {};
    
    if (!table) {
      console.warn('[RealtimeProvider] Broadcast event missing table name:', payload);
      return;
    }

    console.log(`[RealtimeProvider] Processing ${eventType} for ${table}`);

    // Route to appropriate handler based on table
    switch (table) {
      case 'tasks':
        handleTasksChange(eventType, newRecord, oldRecord);
        break;
      case 'shopping_items':
        handleShoppingChange(eventType, newRecord, oldRecord);
        break;
      case 'household_events':
        handleEventsChange(eventType, newRecord, oldRecord);
        break;
      case 'meals':
        handleMealsChange(eventType, newRecord, oldRecord);
        break;
      case 'polls':
        handlePollsChange(eventType, newRecord, oldRecord);
        break;
      default:
        console.log('[RealtimeProvider] Unknown table:', table);
    }
  }, []);

  // Optimized change handlers that update state immediately
  const handleTasksChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setTasks(prev => {
      switch (eventType) {
        case 'INSERT':
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(t => t.id === newRecord.id)) {
            console.log('[RealtimeProvider] Task already exists (optimistic), skipping:', newRecord.id);
            return prev;
          }
          console.log('[RealtimeProvider] Adding new task:', newRecord.id);
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating task:', newRecord.id);
          return prev.map(t => t.id === newRecord.id ? newRecord : t);
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting task:', oldRecord.id);
          return prev.filter(t => t.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleShoppingChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setShoppingItems(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(i => i.id === newRecord.id)) {
            console.log('[RealtimeProvider] Shopping item already exists (optimistic), skipping:', newRecord.id);
            return prev;
          }
          console.log('[RealtimeProvider] Adding new shopping item:', newRecord.id);
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating shopping item:', newRecord.id);
          return prev.map(i => i.id === newRecord.id ? newRecord : i);
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting shopping item:', oldRecord.id);
          return prev.filter(i => i.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleEventsChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setEvents(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(e => e.id === newRecord.id)) {
            console.log('[RealtimeProvider] Event already exists (optimistic), skipping:', newRecord.id);
            return prev;
          }
          console.log('[RealtimeProvider] Adding new event:', newRecord.id);
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating event:', newRecord.id);
          return prev.map(e => e.id === newRecord.id ? newRecord : e);
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting event:', oldRecord.id);
          return prev.filter(e => e.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handleMealsChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setMeals(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(m => m.id === newRecord.id)) {
            console.log('[RealtimeProvider] Meal already exists (optimistic), skipping:', newRecord.id);
            return prev;
          }
          console.log('[RealtimeProvider] Adding new meal:', newRecord.id);
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating meal:', newRecord.id);
          return prev.map(m => m.id === newRecord.id ? newRecord : m);
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting meal:', oldRecord.id);
          return prev.filter(m => m.id !== oldRecord.id);
        
        default:
          return prev;
      }
    });
  }, []);

  const handlePollsChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setPolls(prev => {
      switch (eventType) {
        case 'INSERT':
          if (prev.some(p => p.id === newRecord.id)) {
            console.log('[RealtimeProvider] Poll already exists (optimistic), skipping:', newRecord.id);
            return prev;
          }
          console.log('[RealtimeProvider] Adding new poll:', newRecord.id);
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating poll:', newRecord.id);
          return prev.map(p => p.id === newRecord.id ? newRecord : p);
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting poll:', oldRecord.id);
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
