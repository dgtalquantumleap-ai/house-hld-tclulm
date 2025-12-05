
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Checking authentication status');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('AuthContext: Checking for existing session');
      // TODO: Check Supabase session
      // const { data: { session } } = await supabase.auth.getSession();
      // if (session) {
      //   const { data: userData } = await supabase
      //     .from('users')
      //     .select('*')
      //     .eq('id', session.user.id)
      //     .single();
      //   setUser(userData);
      // }
    } catch (error) {
      console.error('AuthContext: Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Signing in user:', email);
      // TODO: Implement Supabase sign in
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      // if (error) throw error;
      // const { data: userData } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', data.user.id)
      //   .single();
      // setUser(userData);
      
      // Mock user for now
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: email,
        role: 'Adult',
        householdId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('AuthContext: Signing up user:', email);
      // TODO: Implement Supabase sign up
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      // });
      // if (error) throw error;
      // const { data: userData } = await supabase
      //   .from('users')
      //   .insert([{
      //     id: data.user.id,
      //     name,
      //     email,
      //     role: 'Adult',
      //   }])
      //   .select()
      //   .single();
      // setUser(userData);
      
      // Mock user for now
      const mockUser: User = {
        id: '1',
        name: name,
        email: email,
        role: 'Adult',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
    } catch (error) {
      console.error('AuthContext: Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out user');
      // TODO: Implement Supabase sign out
      // await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      console.log('AuthContext: Updating user:', updates);
      if (!user) return;
      
      // TODO: Implement Supabase update
      // const { data, error } = await supabase
      //   .from('users')
      //   .update(updates)
      //   .eq('id', user.id)
      //   .select()
      //   .single();
      // if (error) throw error;
      // setUser(data);
      
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('AuthContext: Update user error:', error);
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
