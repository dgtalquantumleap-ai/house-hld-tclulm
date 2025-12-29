
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

/**
 * Clears all auth-related data from AsyncStorage
 * Use this when auth tokens are corrupted or causing issues
 */
export async function clearAuthStorage(): Promise<void> {
  try {
    console.log('AuthRecovery: Clearing auth storage');
    
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    
    // Filter for Supabase auth keys
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') ||
      key.includes('sb-')
    );
    
    console.log('AuthRecovery: Found auth keys:', authKeys.length);
    
    // Remove all auth keys
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
      console.log('AuthRecovery: Cleared', authKeys.length, 'auth keys');
    }
    
    // Also sign out from Supabase to clear any in-memory state
    await supabase.auth.signOut();
    
    console.log('AuthRecovery: Auth storage cleared successfully');
  } catch (error) {
    console.error('AuthRecovery: Error clearing auth storage:', error);
    throw error;
  }
}

/**
 * Attempts to recover from auth errors by clearing storage and signing out
 */
export async function recoverFromAuthError(error: any): Promise<void> {
  try {
    console.log('AuthRecovery: Attempting to recover from auth error:', error.message);
    
    // Check if it's a refresh token error
    if (
      error.message?.includes('refresh') ||
      error.message?.includes('token') ||
      error.message?.includes('session')
    ) {
      console.log('AuthRecovery: Detected token/session error, clearing storage');
      await clearAuthStorage();
    }
  } catch (recoveryError) {
    console.error('AuthRecovery: Error during recovery:', recoveryError);
  }
}

/**
 * Validates the current session and clears storage if invalid
 */
export async function validateAndRecoverSession(): Promise<boolean> {
  try {
    console.log('AuthRecovery: Validating session');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('AuthRecovery: Session validation error:', error);
      await recoverFromAuthError(error);
      return false;
    }
    
    if (!session) {
      console.log('AuthRecovery: No session found');
      return false;
    }
    
    console.log('AuthRecovery: Session is valid');
    return true;
  } catch (error) {
    console.error('AuthRecovery: Exception during session validation:', error);
    return false;
  }
}
