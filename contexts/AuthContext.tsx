
import React, { createContext, useContext, useState, useEffect } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('AuthContext: Auth state changed:', _event);
      if (session) {
        await loadUserProfile(session);
      } else {
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
      subscription.unsubscribe();
      subscription2.remove();
    };
  }, []);

  const loadUserProfile = async (session: Session) => {
    try {
      console.log('AuthContext: Loading user profile for:', session.user.id);
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, photo_url, role, household_id, created_at, updated_at')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('AuthContext: Error loading user profile:', error);
        throw error;
      }

      if (data) {
        console.log('AuthContext: User profile loaded:', data.name);
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
      console.error('AuthContext: Error in loadUserProfile:', error);
    } finally {
      setIsLoading(false);
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

      console.log('AuthContext: User signed up successfully, profile created by trigger');
      
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Sign out error:', error);
        throw error;
      }
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Sign out exception:', error);
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
