
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment variables with fallback for development
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://tkavowbmakdnqekweoro.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYXZvd2JtYWtkbnFla3dlb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTMxOTgsImV4cCI6MjA4MDUyOTE5OH0.3tzrUDtmiMRAnyrXUDDnaLo0bUFVQqWJZy8KRRyNy1M';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

// Log configuration (without exposing full key)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key configured:', supabaseAnonKey ? 'Yes' : 'No');
console.log('Platform:', Platform.OS);

// Custom storage adapter with better error handling
const customStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error(`Storage GET error [${key}]:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Storage SET error [${key}]:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage REMOVE error [${key}]:`, error);
    }
  },
};

// Use different storage based on platform
const storage = Platform.OS === 'web' 
  ? undefined // Use default localStorage on web
  : customStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect session in URL on web
    flowType: 'pkce', // Use PKCE flow for better security
    debug: __DEV__, // Enable debug logging in development
  },
  realtime: {
    params: {
      // Enable info logging for debugging in development
      log_level: __DEV__ ? 'info' : 'error',
      // Optimize reconnection timing - exponential backoff starting at 1 second
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, tries), 30000);
        console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${tries + 1})`);
        return delay;
      },
      // Heartbeat interval to keep connection alive (30 seconds)
      heartbeatIntervalMs: 30000,
      // Timeout for establishing connection (10 seconds)
      timeout: 10000,
      // Enable presence tracking
      eventsPerSecond: 10,
    },
    // Enable automatic reconnection
    reconnect: true,
  },
  global: {
    headers: {
      // Add custom headers
      'x-client-info': 'househld-app',
      'x-client-platform': Platform.OS,
    },
  },
});

// Add auth state change listener with better error handling
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('[Supabase] Auth state changed:', event);
  
  if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out, clearing realtime auth');
    // Clear realtime auth - pass null to clear
    try {
      await supabase.realtime.setAuth(null);
    } catch (error) {
      console.error('[Supabase] Error clearing realtime auth:', error);
    }
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase] Token refreshed, updating realtime auth');
    // Refresh realtime auth when token is refreshed
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        console.log('[Supabase] Realtime auth updated with new token');
      } catch (error) {
        console.error('[Supabase] Error updating realtime auth:', error);
      }
    }
  } else if (event === 'SIGNED_IN') {
    console.log('[Supabase] User signed in, setting realtime auth');
    // Set realtime auth when user signs in
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        console.log('[Supabase] Realtime auth set for new session');
      } catch (error) {
        console.error('[Supabase] Error setting realtime auth:', error);
      }
    }
  } else if (event === 'USER_UPDATED') {
    console.log('[Supabase] User updated');
  }
  
  // Log session status (without exposing tokens)
  if (session) {
    console.log('[Supabase] Session active for user:', session.user?.email);
  } else {
    console.log('[Supabase] No active session');
  }
});

// Monitor realtime connection status in development
if (__DEV__) {
  console.log('[Supabase] Realtime monitoring enabled');
  
  // Log when realtime connects
  const originalConnect = supabase.realtime.connect.bind(supabase.realtime);
  supabase.realtime.connect = () => {
    console.log('[Realtime] Connecting to Supabase Realtime...');
    return originalConnect();
  };
  
  // Log when realtime disconnects
  const originalDisconnect = supabase.realtime.disconnect.bind(supabase.realtime);
  supabase.realtime.disconnect = () => {
    console.log('[Realtime] Disconnecting from Supabase Realtime...');
    return originalDisconnect();
  };
}

// Export helper function to check realtime connection
export const checkRealtimeConnection = () => {
  const channels = supabase.getChannels();
  console.log('[Realtime] Active channels:', channels.length);
  channels.forEach(channel => {
    console.log(`[Realtime] Channel: ${channel.topic}, State: ${channel.state}`);
  });
  return channels;
};

// Export helper function to manually reconnect realtime
export const reconnectRealtime = async () => {
  console.log('[Realtime] Manual reconnection requested');
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Set auth with access token
      await supabase.realtime.setAuth(session.access_token);
      console.log('[Realtime] Auth refreshed with access token');
    }
    // Channels will automatically reconnect
    return true;
  } catch (error) {
    console.error('[Realtime] Error reconnecting:', error);
    return false;
  }
};
