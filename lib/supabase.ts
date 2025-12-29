
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
      console.log(`Storage GET [${key}]:`, value ? 'Found' : 'Not found');
      return value;
    } catch (error) {
      console.error(`Storage GET error [${key}]:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Storage SET [${key}]: Success`);
    } catch (error) {
      console.error(`Storage SET error [${key}]:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Storage REMOVE [${key}]: Success`);
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
    // Add debug logging for auth events
    debug: __DEV__,
  },
  realtime: {
    params: {
      // Enable info logging for debugging in development
      log_level: __DEV__ ? 'info' : 'error',
      // Optimize reconnection timing - exponential backoff starting at 1 second
      reconnectAfterMs: (tries: number) => {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        return Math.min(1000 * Math.pow(2, tries), 30000);
      },
      // Heartbeat interval to keep connection alive (30 seconds)
      heartbeatIntervalMs: 30000,
      // Timeout for establishing connection (10 seconds)
      timeout: 10000,
    },
    // Enable automatic reconnection
    reconnect: true,
  },
  global: {
    headers: {
      // Add custom headers if needed
      'x-client-info': 'househld-app',
      'x-client-platform': Platform.OS,
    },
  },
});

// Add auth state change listener with better error handling
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, clearing storage');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
    // Refresh realtime auth when token is refreshed
    supabase.realtime.setAuth(session?.access_token ?? null);
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in');
    // Set realtime auth when user signs in
    supabase.realtime.setAuth(session?.access_token ?? null);
  } else if (event === 'USER_UPDATED') {
    console.log('User updated');
  }
  
  // Log session status (without exposing tokens)
  if (session) {
    console.log('Session active for user:', session.user?.email);
  } else {
    console.log('No active session');
  }
});

// Monitor realtime connection status
if (__DEV__) {
  // Log realtime connection events in development
  const originalConnect = supabase.realtime.connect.bind(supabase.realtime);
  supabase.realtime.connect = () => {
    console.log('[Realtime] Connecting...');
    return originalConnect();
  };
}
