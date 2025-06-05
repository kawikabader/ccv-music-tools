import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Profile } from '../types/supabase';
import type { AuthError, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  connectionError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  // Load user profile data with timeout
  const loadProfile = async (userId: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) throw error;
      setProfile(data);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading profile:', err);
      }
      setProfile(null);
      // Don't set error for profile loading failures - continue with limited functionality
    }
  };

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;
    const initTimeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setConnectionError(true);
        // Don't set a blocking error - just mark connection as problematic
      }
    }, 15000); // 15 second timeout for initial auth check

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
            };
            setUser(user);
            await loadProfile(session.user.id);
          }
          clearTimeout(initTimeout);
          setLoading(false);
          setConnectionError(false);
        }
      } catch (err) {
        if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth initialization error:', err);
          }
          clearTimeout(initTimeout);
          setLoading(false);
          setConnectionError(true);
          // Don't block the app - just mark connection issues
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
          };
          setUser(user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
        setError(null); // Clear any connection errors on successful auth change
        setConnectionError(false);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth state change error:', err);
        }
        setLoading(false);
        setConnectionError(true);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      // User and profile will be set by the auth state change listener
    } catch (err) {
      const authError = err as AuthError;
      if (authError.name === 'AbortError') {
        setError('Sign in timed out. Please check your connection and try again.');
        setConnectionError(true);
      } else {
        setError(authError.message || 'An error occurred during sign in');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      // Check if user needs to confirm email
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      const authError = err as AuthError;
      if (authError.name === 'AbortError') {
        setError('Sign up timed out. Please check your connection and try again.');
        setConnectionError(true);
      } else {
        setError(authError.message || 'An error occurred during sign up');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setConnectionError(false);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Don't manually set user/profile to null here - let the auth state change listener handle it
      // This prevents race conditions between manual state updates and Supabase's auth state changes
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'An error occurred during sign out');
      setLoading(false); // Only set loading to false on error
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
    setConnectionError(false);
  };

  const value = {
    user,
    profile,
    loading,
    error,
    connectionError,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to check if user has admin role
export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.role === 'admin';
}

// Helper function to check if user has admin or director role
export function useCanViewMusicians() {
  const { profile } = useAuth();
  return profile?.role === 'admin' || profile?.role === 'director';
} 