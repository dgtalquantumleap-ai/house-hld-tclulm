
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

// Use different storage based on platform
const storage = Platform.OS === 'web' 
  ? undefined // Use default localStorage on web
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect session in URL on web
    flowType: 'pkce', // Use PKCE flow for better security
  },
  realtime: {
    params: {
      // Enable info logging for debugging (can be changed to 'error' in production)
      log_level: 'info',
      // Optimize reconnection timing
      reconnectAfterMs: 1000,
      // Heartbeat interval to keep connection alive
      heartbeatIntervalMs: 30000,
    },
  },
  global: {
    headers: {
      // Add custom headers if needed
      'x-client-info': 'househld-app',
      'x-client-platform': Platform.OS,
    },
  },
});
