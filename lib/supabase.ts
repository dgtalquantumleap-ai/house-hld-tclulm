
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// CRITICAL: Get environment variables with proper fallback chain
// Priority: 1. app.json extra config, 2. process.env, 3. hardcoded fallback
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  'https://tkavowbmakdnqekweoro.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYXZvd2JtYWtkbnFla3dlb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTMxOTgsImV4cCI6MjA4MDUyOTE5OH0.3tzrUDtmiMRAnyrXUDDnaLo0bUFVQqWJZy8KRRyNy1M';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables');
  console.error('supabaseUrl:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('supabaseAnonKey:', supabaseAnonKey ? 'Present' : 'MISSING');
  throw new Error('Supabase configuration is missing. Please check your configuration.');
}

// Log configuration (without exposing full key) - PRODUCTION SAFE
console.log('✅ Supabase Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Key configured:', supabaseAnonKey ? 'Yes' : 'No');
console.log('  Key length:', supabaseAnonKey?.length || 0);
console.log('  Platform:', Platform.OS);
console.log('  Environment:', __DEV__ ? 'Development' : 'Production');

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
    debug: __DEV__, // Enable debug logging in development only
  },
  realtime: {
    params: {
      // Enable info logging for debugging in development only
      log_level: __DEV__ ? 'info' : 'error',
      // Optimize reconnection timing - exponential backoff starting at 1 second
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, tries), 30000);
        if (__DEV__) {
          console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${tries + 1})`);
        }
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

// CRITICAL FIX: Global auth state change listener
// This is the SINGLE SOURCE OF TRUTH for realtime auth management
// All realtime channels will use the auth set here
supabase.auth.onAuthStateChange(async (event, session) => {
  if (__DEV__) {
    console.log('[Supabase] ========================================');
    console.log('[Supabase] Auth state changed:', event);
    console.log('[Supabase] Session:', session ? 'exists' : 'null');
    console.log('[Supabase] ========================================');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out, clearing realtime auth');
    // CRITICAL: Clear realtime auth on sign out
    try {
      // Pass null to clear the auth
      await supabase.realtime.setAuth(null);
      console.log('[Supabase] ✅ Realtime auth cleared successfully');
    } catch (error) {
      console.error('[Supabase] ❌ Error clearing realtime auth:', error);
    }
  } else if (event === 'TOKEN_REFRESHED') {
    if (__DEV__) {
      console.log('[Supabase] Token refreshed, updating realtime auth');
    }
    // CRITICAL: Update realtime auth when token is refreshed
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        if (__DEV__) {
          console.log('[Supabase] ✅ Realtime auth updated with new token');
        }
      } catch (error) {
        console.error('[Supabase] ❌ Error updating realtime auth:', error);
      }
    } else {
      console.error('[Supabase] ❌ TOKEN_REFRESHED but no access_token in session');
    }
  } else if (event === 'SIGNED_IN') {
    console.log('[Supabase] User signed in, setting realtime auth');
    // CRITICAL: Set realtime auth when user signs in
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        console.log('[Supabase] ✅ Realtime auth set for new session');
      } catch (error) {
        console.error('[Supabase] ❌ Error setting realtime auth:', error);
      }
    } else {
      console.error('[Supabase] ❌ SIGNED_IN but no access_token in session');
    }
  } else if (event === 'USER_UPDATED') {
    if (__DEV__) {
      console.log('[Supabase] User updated, refreshing realtime auth');
    }
    // CRITICAL: Ensure realtime auth is still valid on user update
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        if (__DEV__) {
          console.log('[Supabase] ✅ Realtime auth refreshed on user update');
        }
      } catch (error) {
        console.error('[Supabase] ❌ Error refreshing realtime auth:', error);
      }
    }
  } else if (event === 'INITIAL_SESSION') {
    if (__DEV__) {
      console.log('[Supabase] Initial session loaded');
    }
    // CRITICAL: Set realtime auth for initial session
    if (session?.access_token) {
      try {
        await supabase.realtime.setAuth(session.access_token);
        console.log('[Supabase] ✅ Realtime auth set for initial session');
      } catch (error) {
        console.error('[Supabase] ❌ Error setting realtime auth for initial session:', error);
      }
    }
  }
  
  // Log session status (without exposing tokens) - only in dev
  if (__DEV__ && session) {
    console.log('[Supabase] Session active for user:', session.user?.email);
    console.log('[Supabase] Access token present:', !!session.access_token);
    console.log('[Supabase] Access token length:', session.access_token?.length || 0);
  } else if (__DEV__) {
    console.log('[Supabase] No active session');
  }
  
  if (__DEV__) {
    console.log('[Supabase] ========================================');
  }
});

// Monitor realtime connection status in development only
if (__DEV__) {
  console.log('[Supabase] Realtime monitoring enabled (dev mode)');
  
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
    } else {
      console.error('[Realtime] No valid session for reconnection');
    }
    // Channels will automatically reconnect
    return true;
  } catch (error) {
    console.error('[Realtime] Error reconnecting:', error);
    return false;
  }
};
