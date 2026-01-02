
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
  const authListenerRef = useRef<{ data: { subscription: any } } | null>(null);
  const currentHouseholdIdRef = useRef<string | null>(null);

  // CRITICAL FIX: Listen to auth state changes and manage realtime lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    console.log('[RealtimeProvider] Setting up auth state listener');

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[RealtimeProvider] Auth event:', event, 'Session:', session ? 'exists' : 'null');

      if (event === 'SIGNED_OUT') {
        console.log('[RealtimeProvider] User signed out - cleaning up all channels');
        cleanupChannels();
        clearAllData();
        setConnectionStatus('disconnected');
        setIsConnected(false);
        currentHouseholdIdRef.current = null;
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[RealtimeProvider] Token refreshed - recreating channels with new JWT');
        // CRITICAL: The global auth listener in lib/supabase.ts already updated realtime auth
        // We just need to recreate channels if we have a household
        if (user?.householdId && session?.access_token) {
          // Tear down existing channels
          cleanupChannels();
          // Wait a bit for the new token to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          // Recreate channels - auth is already set globally
          await setupRealtimeSubscriptions();
        }
      } else if (event === 'SIGNED_IN') {
        console.log('[RealtimeProvider] User signed in - waiting for user context');
        // CRITICAL: The global auth listener in lib/supabase.ts already set realtime auth
        // Wait for user context to update with household info
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Setup will happen in the household effect below
      }
    });

    authListenerRef.current = { data: { subscription } };

    return () => {
      console.log('[RealtimeProvider] Cleaning up auth listener');
      isMountedRef.current = false;
      subscription.unsubscribe();
      cleanupChannels();
    };
  }, []);

  // CRITICAL FIX: Separate effect for household changes (after auth is established)
  useEffect(() => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID, clearing data and skipping subscriptions');
      clearAllData();
      cleanupChannels();
      setConnectionStatus('disconnected');
      setIsConnected(false);
      currentHouseholdIdRef.current = null;
      return;
    }

    // Check if household changed
    if (currentHouseholdIdRef.current === user.householdId) {
      console.log('[RealtimeProvider] Household unchanged, skipping setup');
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribingRef.current) {
      console.log('[RealtimeProvider] Already subscribing, skipping...');
      return;
    }

    console.log('[RealtimeProvider] ========================================');
    console.log('[RealtimeProvider] Household changed:', user.householdId);
    console.log('[RealtimeProvider] ========================================');

    currentHouseholdIdRef.current = user.householdId;

    // Initial data load
    loadAllData();

    // Setup realtime subscriptions
    // CRITICAL: We don't pass access_token anymore - it's managed globally
    const initializeRealtime = async () => {
      // Verify we have a valid session before subscribing
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        console.log('[RealtimeProvider] Valid session found, setting up subscriptions');
        await setupRealtimeSubscriptions();
      } else {
        console.error('[RealtimeProvider] No valid session found');
        setConnectionStatus('error');
      }
    };

    initializeRealtime();
  }, [user?.householdId]);

  const clearAllData = () => {
    console.log('[RealtimeProvider] Clearing all data');
    setTasks([]);
    setShoppingItems([]);
    setEvents([]);
    setMeals([]);
    setPolls([]);
  };

  const cleanupChannels = () => {
    try {
      if (householdChannelRef.current) {
        console.log('[RealtimeProvider] Removing household channel');
        supabase.removeChannel(householdChannelRef.current);
        householdChannelRef.current = null;
      }
      isSubscribingRef.current = false;
    } catch (error) {
      console.error('[RealtimeProvider] Error cleaning up channels:', error);
    }
  };

  // CRITICAL FIX: Removed accessToken parameter - auth is managed globally in lib/supabase.ts
  const setupRealtimeSubscriptions = async () => {
    if (!user?.householdId) {
      console.log('[RealtimeProvider] No household ID for subscriptions');
      return;
    }

    // Prevent concurrent subscription attempts
    if (isSubscribingRef.current) {
      console.log('[RealtimeProvider] Subscription already in progress');
      return;
    }

    try {
      isSubscribingRef.current = true;
      setConnectionStatus('connecting');

      // Clean up existing channel first
      if (householdChannelRef.current) {
        console.log('[RealtimeProvider] Cleaning up existing channel before recreating');
        supabase.removeChannel(householdChannelRef.current);
        householdChannelRef.current = null;
      }

      // CRITICAL FIX: Verify session exists before subscribing
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[RealtimeProvider] ❌ No valid session - cannot subscribe');
        setConnectionStatus('error');
        setIsConnected(false);
        isSubscribingRef.current = false;
        return;
      }

      console.log('[RealtimeProvider] ✅ Valid session confirmed, proceeding with subscription');

      // CRITICAL FIX: Auth is already set globally in lib/supabase.ts
      // We don't need to call setAuth here - it's managed by the global listener
      // Just wait a moment to ensure auth has propagated
      await new Promise(resolve => setTimeout(resolve, 200));

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
          isSubscribingRef.current = false;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeProvider] ❌ Channel error:', err);
          setConnectionStatus('error');
          setIsConnected(false);
          isSubscribingRef.current = false;
        } else if (status === 'CLOSED') {
          console.log('[RealtimeProvider] Channel closed');
          setConnectionStatus('disconnected');
          setIsConnected(false);
          isSubscribingRef.current = false;
        } else if (status === 'TIMED_OUT') {
          console.warn('[RealtimeProvider] ⚠️ Channel timed out');
          setConnectionStatus('error');
          setIsConnected(false);
          isSubscribingRef.current = false;
        }
      });

      householdChannelRef.current = channel;
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

  // CRITICAL FIX: Add explicit null checks to ALL cases to prevent "Cannot read property 'id' of undefined"
  const handleTasksChange = useCallback((eventType: string, newRecord: any, oldRecord: any) => {
    if (!isMountedRef.current) return;

    setTasks(prev => {
      switch (eventType) {
        case 'INSERT':
          console.log('[RealtimeProvider] Inserting task...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid insert record, skipping');
            return prev;
          }
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(t => t && t.id === newRecord.id)) {
            console.log('[RealtimeProvider] Record already exists, skipping');
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating task...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid update record, skipping');
            return prev;
          }
          return prev.map(t => (t && t.id === newRecord.id ? newRecord : t));
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting task...');
          // CRITICAL: Check if oldRecord and id exist
          if (!oldRecord || !oldRecord.id) {
            console.log('[RealtimeProvider] Invalid delete record, skipping');
            return prev;
          }
          return prev.filter(t => t && t.id !== oldRecord.id);
        
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
          console.log('[RealtimeProvider] Inserting shopping item...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid insert record, skipping');
            return prev;
          }
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(i => i && i.id === newRecord.id)) {
            console.log('[RealtimeProvider] Record already exists, skipping');
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating shopping item...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid update record, skipping');
            return prev;
          }
          return prev.map(i => (i && i.id === newRecord.id ? newRecord : i));
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting shopping item...');
          // CRITICAL: Check if oldRecord and id exist
          if (!oldRecord || !oldRecord.id) {
            console.log('[RealtimeProvider] Invalid delete record, skipping');
            return prev;
          }
          return prev.filter(i => i && i.id !== oldRecord.id);
        
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
          console.log('[RealtimeProvider] Inserting event...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid insert record, skipping');
            return prev;
          }
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(e => e && e.id === newRecord.id)) {
            console.log('[RealtimeProvider] Record already exists, skipping');
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating event...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid update record, skipping');
            return prev;
          }
          return prev.map(e => (e && e.id === newRecord.id ? newRecord : e));
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting event...');
          // CRITICAL: Check if oldRecord and id exist
          if (!oldRecord || !oldRecord.id) {
            console.log('[RealtimeProvider] Invalid delete record, skipping');
            return prev;
          }
          return prev.filter(e => e && e.id !== oldRecord.id);
        
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
          console.log('[RealtimeProvider] Inserting meal...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid insert record, skipping');
            return prev;
          }
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(m => m && m.id === newRecord.id)) {
            console.log('[RealtimeProvider] Record already exists, skipping');
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating meal...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid update record, skipping');
            return prev;
          }
          return prev.map(m => (m && m.id === newRecord.id ? newRecord : m));
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting meal...');
          // CRITICAL: Check if oldRecord and id exist
          if (!oldRecord || !oldRecord.id) {
            console.log('[RealtimeProvider] Invalid delete record, skipping');
            return prev;
          }
          return prev.filter(m => m && m.id !== oldRecord.id);
        
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
          console.log('[RealtimeProvider] Inserting poll...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid insert record, skipping');
            return prev;
          }
          // Check if already exists (prevent duplicates from optimistic updates)
          if (prev.some(p => p && p.id === newRecord.id)) {
            console.log('[RealtimeProvider] Record already exists, skipping');
            return prev;
          }
          return [newRecord, ...prev];
        
        case 'UPDATE':
          console.log('[RealtimeProvider] Updating poll...');
          // CRITICAL: Check if newRecord and id exist
          if (!newRecord || !newRecord.id) {
            console.log('[RealtimeProvider] Invalid update record, skipping');
            return prev;
          }
          return prev.map(p => (p && p.id === newRecord.id ? newRecord : p));
        
        case 'DELETE':
          console.log('[RealtimeProvider] Deleting poll...');
          // CRITICAL: Check if oldRecord and id exist
          if (!oldRecord || !oldRecord.id) {
            console.log('[RealtimeProvider] Invalid delete record, skipping');
            return prev;
          }
          return prev.filter(p => p && p.id !== oldRecord.id);
        
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
