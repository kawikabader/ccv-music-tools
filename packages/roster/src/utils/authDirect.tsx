import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { directAuth, type AuthUser, type AuthSession } from '../lib/directAuth';
import { supabase } from '../lib/supabase'; // Still need this for database operations
import type { Profile } from '../types/supabase';
import * as logger from './logger';

interface AuthContextType {
  user: AuthUser | null;
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
  const [user, setUser] = useState<AuthUser | null>(null);
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
      const result = await directAuth.refreshSession();
      if (result.error) throw new Error(result.error.message);

      if (result.session) {
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
      const { data, error } = await directAuth.getSession();

      if (error) {
        logger.warn(logger.LogCategory.AUTH, 'Session validation failed', { error: error.message });
        setIsSessionValid(false);
        return false;
      }

      if (data.session) {
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

    const initAuth = async () => {
      try {
        logger.info(logger.LogCategory.AUTH, 'Initializing direct auth...');

        // Get initial session using direct auth
        const { data, error } = await directAuth.getSession();

        if (error) {
          logger.error(logger.LogCategory.AUTH, 'Auth session error', { error });
          throw error;
        }

        if (mounted) {
          if (data.session?.user) {
            const user: AuthUser = data.session.user;
            setUser(user);
            setIsSessionValid(true);
            await loadProfile(user.id);
            logger.info(logger.LogCategory.AUTH, 'User session restored', { userId: user.id });
          } else {
            setUser(null);
            setProfile(null);
            setIsSessionValid(false);
            logger.info(logger.LogCategory.AUTH, 'No active session found');
          }
          setLoading(false);
          setConnectionError(false);
        }
      } catch (err: any) {
        if (mounted) {
          logger.error(logger.LogCategory.AUTH, 'Auth initialization error', { error: err.message || err });
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

    // Listen for auth changes using direct auth
    const unsubscribe = directAuth.onAuthStateChange(async (session) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          const user: AuthUser = session.user;
          setUser(user);
          setIsSessionValid(true);
          await loadProfile(user.id);

          // Handle remember me functionality based on current session
          const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
          const sessionPreference = localStorage.getItem(SESSION_STORAGE_KEY);

          // If user previously selected "remember me", maintain persistent session
          if (rememberMe || sessionPreference === 'persistent') {
            localStorage.setItem(SESSION_STORAGE_KEY, 'persistent');
          } else {
            // For temporary sessions, store in sessionStorage
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'temporary');
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsSessionValid(false);

          // Clean up session storage
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
        setLoading(false);
        setError(null);
        setConnectionError(false);
      } catch (err: any) {
        logger.error(logger.LogCategory.AUTH, 'Auth state change error', { error: err.message || err });
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
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribe();
    };
  }, [user, checkSessionValidity]);

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(false);

      // Store remember me preference before signing in
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());

      logger.info(logger.LogCategory.AUTH, 'Attempting sign in', { email });

      const result = await directAuth.signInWithPassword({ email, password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.user || !result.session) {
        throw new Error('Invalid authentication response');
      }

      // Handle remember me logic after successful login
      if (rememberMe) {
        // Store session preference for persistent login
        localStorage.setItem(SESSION_STORAGE_KEY, 'persistent');
        logger.info(logger.LogCategory.AUTH, 'Persistent session enabled');
      } else {
        // For temporary sessions, we'll rely on the natural session expiration
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'temporary');
        // Clear any existing persistent session data
        localStorage.removeItem(SESSION_STORAGE_KEY);
        logger.info(logger.LogCategory.AUTH, 'Temporary session enabled');
      }

      logger.info(logger.LogCategory.AUTH, 'Sign in successful', { userId: result.user.id });

      // User and profile will be set by the auth state change listener
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during sign in';
      logger.error(logger.LogCategory.AUTH, 'Sign in failed', { error: errorMessage });
      setError(errorMessage);
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

      // Note: Direct auth doesn't implement signUp yet, would need to add this
      // For now, throw an error to indicate it's not implemented
      throw new Error('Sign up not implemented with direct auth yet');
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred during sign up';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setConnectionError(false);

      logger.info(logger.LogCategory.AUTH, 'Signing out');

      const result = await directAuth.signOut();
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Clean up all session storage on explicit sign out
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);

      logger.info(logger.LogCategory.AUTH, 'Sign out successful');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign out';
      setError(errorMessage);
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Admin check hook - simplified for direct auth
export function useIsAdmin() {
  const { user } = useAuth();
  // For now, just return false since we don't have admin logic implemented
  // This would need to be implemented based on your admin user logic
  return false;
}

// View musicians permission hook - simplified for direct auth
export function useCanViewMusicians() {
  const { user } = useAuth();
  // For now, just return true if user is authenticated
  return !!user;
} 