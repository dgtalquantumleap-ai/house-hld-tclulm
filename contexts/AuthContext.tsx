
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (session: Session) => {
    try {
      console.log('AuthContext: Loading user profile for:', session.user.id);
      const { data, error } = await supabase
        .from('users')
        .select('*')
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
      console.log('AuthContext: Signing up user:', email);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
        },
      });

      if (authError) {
        console.error('AuthContext: Sign up error:', authError.message);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name,
          email,
          role,
        }]);

      if (profileError) {
        console.error('AuthContext: Profile creation error:', profileError.message);
        return { error: 'Account created but profile setup failed' };
      }

      console.log('AuthContext: User signed up successfully');
      
      // Check if email confirmation is required
      if (authData.session) {
        await loadUserProfile(authData.session);
      }

      return {};
    } catch (error: any) {
      console.error('AuthContext: Sign up exception:', error);
      return { error: error.message || 'Failed to sign up' };
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
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.householdId !== undefined) dbUpdates.household_id = updates.householdId;

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        updateUser,
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
