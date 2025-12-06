
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://tkavowbmakdnqekweoro.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYXZvd2JtYWtkbnFla3dlb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTMxOTgsImV4cCI6MjA4MDUyOTE5OH0.3tzrUDtmiMRAnyrXUDDnaLo0bUFVQqWJZy8KRRyNy1M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
