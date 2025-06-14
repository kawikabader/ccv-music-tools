import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Profile } from '../types/supabase';
import type { AuthError, Session } from '@supabase/supabase-js';
import * as logger from './logger';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  connectionError: boolean;
  isSessionValid: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const SESSION_STORAGE_KEY = 'ccv-roster-session-preference';
const REMEMBER_ME_KEY = 'ccv-roster-remember-me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // Load user profile data with timeout and retry logic
  const loadProfile = async (userId: string, retryCount = 0) => {
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
      setConnectionError(false); // Clear connection error on successful profile load
    } catch (err: unknown) {
      logger.error(logger.LogCategory.AUTH, `Error loading profile (attempt ${retryCount + 1}): ${err}`);

      // Only retry up to 2 times for network/timeout errors
      if (retryCount < 2 && (
        err instanceof Error && (
          err.message.includes('timeout') ||
          err.message.includes('network') ||
          err.message.includes('fetch')
        )
      )) {
        // Retry after a short delay
        setTimeout(() => {
          loadProfile(userId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
        return;
      }

      // Only set profile to null if this is the first load attempt
      // This prevents flickering when profile is already loaded
      if (!profile) {
        setProfile(null);
      }

      // Set connection error for persistent failures
      if (retryCount >= 2) {
        setConnectionError(true);
      }
    }
  };

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        // Session refreshed successfully
        setIsSessionValid(true);
        setConnectionError(false);
      }
    } catch (err: any) {
      logger.error(logger.LogCategory.AUTH, 'Session refresh failed', { error: err.message });
      setIsSessionValid(false);
      setConnectionError(true);
    }
  }, []);

  // Check if session is still valid
  const checkSessionValidity = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        logger.warn(logger.LogCategory.AUTH, 'Session validation failed', { error: error.message });
        setIsSessionValid(false);
        return false;
      }

      if (user) {
        setIsSessionValid(true);
        return true;
      }

      setIsSessionValid(false);
      return false;
    } catch (err: any) {
      logger.error(logger.LogCategory.AUTH, 'Session validation error', { error: err.message });
      setIsSessionValid(false);
      return false;
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;
    let sessionCheckInterval: NodeJS.Timeout;

    const initTimeout = setTimeout(() => {
      if (mounted) {
        logger.warn(logger.LogCategory.AUTH, 'Auth initialization timeout reached');
        setLoading(false);
        setConnectionError(true);
      }
    }, 3000); // 3 second timeout - faster feedback

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        // Create a race between the session request and a timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session request timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          logger.error(logger.LogCategory.AUTH, 'Auth session error', { error });
          throw error;
        }

        if (mounted) {
          if (session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
            };
            setUser(user);
            setIsSessionValid(true);
            await loadProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setIsSessionValid(false);
          }
          clearTimeout(initTimeout);
          setLoading(false);
          setConnectionError(false);
        }
      } catch (err: any) {
        if (mounted) {
          logger.error(logger.LogCategory.AUTH, 'Auth initialization error', { error: err.message || err });
          clearTimeout(initTimeout);
          setLoading(false);
          setConnectionError(true);
          setIsSessionValid(false);
        }
      }
    };

    initAuth();

    // Set up periodic session validation (every 5 minutes)
    sessionCheckInterval = setInterval(async () => {
      if (user && mounted) {
        await checkSessionValidity();
      }
    }, 5 * 60 * 1000); // 5 minutes

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
          setIsSessionValid(true);
          await loadProfile(session.user.id);

          // Store session preference for remember me functionality
          const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
          if (rememberMe) {
            localStorage.setItem(SESSION_STORAGE_KEY, 'persistent');
          } else {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'temporary');
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsSessionValid(false);

          // Clean up session storage
          localStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        setLoading(false);
        setError(null);
        setConnectionError(false);
      } catch (err: any) {
        logger.error(logger.LogCategory.AUTH, 'Auth state change error', { error: err.message || err, event });
        setLoading(false);
        setConnectionError(true);
        setIsSessionValid(false);
      }
    });

    // Handle visibility change to refresh session when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && user && mounted) {
        checkSessionValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [user, checkSessionValidity]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);



      // Store remember me preference before signing in
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);

      if (error) throw error;

      // User and profile will be set by the auth state change listener
    } catch (err: any) {
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
    } catch (err: any) {
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

      // Clean up local storage
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign out');
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    profile,
    loading,
    error,
    connectionError,
    isSessionValid,
    signIn,
    signUp,
    signOut,
    clearError,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  // Try to get context, if it fails, provide fallback
  try {
    const context = useContext(AuthContext);
    if (context === undefined) {
      // Fallback for when no provider is available
      return {
        user: { id: 'guest', email: 'guest@example.com' },
        profile: { name: 'Guest User', role: 'user' as const },
        loading: false,
        error: null,
        connectionError: false,
        isSessionValid: true,
        signIn: async () => { },
        signUp: async () => { },
        signOut: async () => { },
        clearError: () => { },
        refreshSession: async () => { }
      };
    }
    return context;
  } catch {
    // Fallback for any errors
    return {
      user: { id: 'guest', email: 'guest@example.com' },
      profile: { name: 'Guest User', role: 'user' as const },
      loading: false,
      error: null,
      connectionError: false,
      isSessionValid: true,
      signIn: async () => { },
      signUp: async () => { },
      signOut: async () => { },
      clearError: () => { },
      refreshSession: async () => { }
    };
  }
}

// Helper function to check if user has admin role
export function useIsAdmin() {
  try {
    const { profile } = useAuth();
    return profile?.role === 'admin';
  } catch {
    return false;
  }
}

// Helper function to check if user has admin or director role
export function useCanViewMusicians() {
  try {
    const { profile, loading } = useAuth();
    if (loading) return false;
    return profile?.role === 'admin' || profile?.role === 'director';
  } catch {
    return true; // Allow viewing for guests
  }
} 