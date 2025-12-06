
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: string }>;
  loadUserProfile: (session: Session) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingProfileRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('AuthContext: Already initialized, skipping');
      return;
    }
    hasInitializedRef.current = true;

    console.log('AuthContext: Initializing auth state');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session ? 'Found' : 'None');
      if (session) {
        loadUserProfile(session);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('AuthContext: User signed in, loading profile');
        await loadUserProfile(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthContext: User signed out, clearing state');
        setUser(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('AuthContext: Token refreshed');
        // Don't reload profile on token refresh if we already have user data
        if (!user) {
          await loadUserProfile(session);
        }
      } else if (session) {
        // For other events with a session, load profile if we don't have user data
        if (!user) {
          await loadUserProfile(session);
        }
      } else {
        // No session, clear user
        setUser(null);
        setIsLoading(false);
      }
    });

    // Handle deep links for OAuth
    const handleDeepLink = (event: { url: string }) => {
      console.log('AuthContext: Deep link received:', event.url);
      const url = Linking.parse(event.url);
      if (url.queryParams?.access_token) {
        console.log('AuthContext: OAuth callback detected');
      }
    };

    const subscription2 = Linking.addEventListener('url', handleDeepLink);

    return () => {
      console.log('AuthContext: Cleaning up subscriptions');
      subscription.unsubscribe();
      subscription2.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const loadUserProfile = async (session: Session, retryCount = 0) => {
    // Prevent multiple simultaneous profile loads
    if (isLoadingProfileRef.current) {
      console.log('AuthContext: Profile load already in progress, skipping');
      return;
    }

    try {
      isLoadingProfileRef.current = true;
      console.log('AuthContext: Loading user profile for:', session.user.id, `(attempt ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, photo_url, role, household_id, created_at, updated_at')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('AuthContext: Error loading user profile:', error);
        
        // If the user profile doesn't exist yet (e.g., during signup before trigger completes),
        // we'll wait a bit and try again (max 10 retries over 20 seconds)
        if (error.code === 'PGRST116' && retryCount < 10) {
          console.log(`AuthContext: User profile not found, retry ${retryCount + 1}/10 in 2 seconds`);
          retryTimeoutRef.current = setTimeout(() => {
            isLoadingProfileRef.current = false;
            loadUserProfile(session, retryCount + 1);
          }, 2000);
          return;
        }
        
        // If we've exhausted retries, try to create the profile manually as a fallback
        if (error.code === 'PGRST116' && retryCount >= 10) {
          console.log('AuthContext: Profile not found after retries, attempting manual creation');
          try {
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name || '',
                role: session.user.user_metadata?.role || 'Adult',
              })
              .select()
              .single();

            if (insertError) {
              console.error('AuthContext: Failed to create profile manually:', insertError);
              setIsLoading(false);
              isLoadingProfileRef.current = false;
              return;
            }

            if (newProfile) {
              console.log('AuthContext: Profile created manually:', newProfile.name);
              setUser({
                id: newProfile.id,
                name: newProfile.name,
                email: newProfile.email,
                phone: newProfile.phone,
                photoUrl: newProfile.photo_url,
                role: newProfile.role,
                householdId: newProfile.household_id,
                createdAt: newProfile.created_at,
                updatedAt: newProfile.updated_at,
              });
              setIsLoading(false);
              isLoadingProfileRef.current = false;
              return;
            }
          } catch (fallbackError) {
            console.error('AuthContext: Exception during manual profile creation:', fallbackError);
          }
        }
        
        // If it's a different error, just continue
        console.error('AuthContext: Could not load profile');
        setIsLoading(false);
        isLoadingProfileRef.current = false;
        return;
      }

      if (data) {
        console.log('AuthContext: User profile loaded successfully:', data.email, 'Household:', data.household_id || 'None');
        const userData = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          photoUrl: data.photo_url,
          role: data.role,
          householdId: data.household_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setUser(userData);
        console.log('AuthContext: User state updated, isAuthenticated will be:', !!userData);
      }
    } catch (error) {
      console.error('AuthContext: Error in loadUserProfile:', error);
      // Don't throw - just log the error and continue
      // The user can still use the app, they just won't have their profile loaded
    } finally {
      console.log('AuthContext: Setting isLoading to false');
      setIsLoading(false);
      isLoadingProfileRef.current = false;
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      console.log('AuthContext: Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Sign in error:', error.message);
        return { error: error.message };
      }

      if (data.session) {
        console.log('AuthContext: Sign in successful, session created');
        // The onAuthStateChange listener will handle loading the profile
        // But we can also load it here to be sure
        await loadUserProfile(data.session);
      }

      return {};
    } catch (error: any) {
      console.error('AuthContext: Sign in exception:', error);
      return { error: error.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string): Promise<{ error?: string }> => {
    try {
      console.log('AuthContext: Signing up user:', email, 'with name:', name, 'and role:', role);
      
      // Sign up with Supabase Auth and pass user metadata
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            name: name,
            role: role,
          },
        },
      });

      if (authError) {
        console.error('AuthContext: Sign up error:', authError.message);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' };
      }

      console.log('AuthContext: User signed up successfully, profile will be created by trigger');
      
      // Check if email confirmation is required
      if (authData.session) {
        // User is automatically signed in (email confirmation disabled)
        await loadUserProfile(authData.session);
      } else {
        // Email confirmation required - profile was still created by trigger
        console.log('AuthContext: Email confirmation required');
      }

      return {};
    } catch (error: any) {
      console.error('AuthContext: Sign up exception:', error);
      return { error: error.message || 'Failed to sign up' };
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      console.log('AuthContext: Initiating Google OAuth');
      const redirectUrl = Linking.createURL('/');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('AuthContext: Google OAuth error:', error.message);
        return { error: error.message };
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          console.log('AuthContext: Google OAuth successful');
          return {};
        } else {
          return { error: 'OAuth cancelled or failed' };
        }
      }

      return { error: 'Failed to initiate OAuth' };
    } catch (error: any) {
      console.error('AuthContext: Google OAuth exception:', error);
      return { error: error.message || 'Failed to sign in with Google' };
    }
  };

  const signInWithApple = async (): Promise<{ error?: string }> => {
    try {
      console.log('AuthContext: Initiating Apple OAuth');
      const redirectUrl = Linking.createURL('/');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('AuthContext: Apple OAuth error:', error.message);
        return { error: error.message };
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          console.log('AuthContext: Apple OAuth successful');
          return {};
        } else {
          return { error: 'OAuth cancelled or failed' };
        }
      }

      return { error: 'Failed to initiate OAuth' };
    } catch (error: any) {
      console.error('AuthContext: Apple OAuth exception:', error);
      return { error: error.message || 'Failed to sign in with Apple' };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out user');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        // Even if there's an error, clear the user state
        setUser(null);
        throw error;
      }
      
      // Clear user state after successful sign out
      setUser(null);
      console.log('AuthContext: Sign out successful');
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
      // Ensure user state is cleared even on error
      setUser(null);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      console.log('AuthContext: Updating user:', updates);
      if (!user) return;

      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
      if (updates.householdId !== undefined) dbUpdates.household_id = updates.householdId;
      
      // Prevent role changes from client side for security
      // Role changes should be handled by household admins through a separate secure flow
      if (updates.role !== undefined && user.role !== 'Child') {
        dbUpdates.role = updates.role;
      }

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('AuthContext: Update user error:', error);
        throw error;
      }

      if (data) {
        console.log('AuthContext: User updated successfully');
        setUser({
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          photoUrl: data.photo_url,
          role: data.role,
          householdId: data.household_id,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (error) {
      console.error('AuthContext: Update user exception:', error);
      throw error;
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error?: string }> => {
    try {
      console.log('AuthContext: Resending confirmation email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });

      if (error) {
        console.error('AuthContext: Resend confirmation error:', error.message);
        return { error: error.message };
      }

      console.log('AuthContext: Confirmation email resent successfully');
      return {};
    } catch (error: any) {
      console.error('AuthContext: Resend confirmation exception:', error);
      return { error: error.message || 'Failed to resend confirmation email' };
    }
  };

  const contextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateUser,
    resendConfirmationEmail,
    loadUserProfile,
  };

  console.log('AuthContext: Rendering with state:', {
    hasUser: !!user,
    isLoading,
    isAuthenticated: !!user,
    householdId: user?.householdId || 'None',
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
