// Direct Supabase Auth API implementation
// This bypasses the problematic Supabase JS client that hangs on getSession() and signInWithPassword()

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export interface AuthUser {
  id: string;
  email: string;
  aud: string;
  role?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  identities?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: AuthUser;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error?: {
    message: string;
    status?: number;
  };
}

class DirectAuth {
  private session: AuthSession | null = null;
  private listeners: ((session: AuthSession | null) => void)[] = [];

  constructor() {
    // Try to restore session from localStorage on initialization
    this.restoreSession();
  }

  private async makeAuthRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${SUPABASE_URL}/auth/v1${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a session
    if (this.session?.access_token) {
      defaultHeaders['Authorization'] = `Bearer ${this.session.access_token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.msg || errorData.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  }

  private saveSession(session: AuthSession | null) {
    if (session) {
      localStorage.setItem('supabase-auth-session', JSON.stringify(session));
      // Calculate expires_at if not provided
      if (!session.expires_at && session.expires_in) {
        session.expires_at = Date.now() + session.expires_in * 1000;
      }
    } else {
      localStorage.removeItem('supabase-auth-session');
    }
    this.session = session;
    this.notifyListeners();
  }

  private restoreSession() {
    try {
      const stored = localStorage.getItem('supabase-auth-session');
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        // Check if session is expired
        if (session.expires_at && session.expires_at > Date.now()) {
          this.session = session;
        } else {
          // Session expired, remove it
          localStorage.removeItem('supabase-auth-session');
        }
      }
    } catch (error) {
      console.warn('Failed to restore session:', error);
      localStorage.removeItem('supabase-auth-session');
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }

  public onAuthStateChange(callback: (session: AuthSession | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current session
    callback(this.session);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async getSession(): Promise<{
    data: { session: AuthSession | null };
    error: any;
  }> {
    try {
      // If we have a stored session, validate it
      if (this.session) {
        // Check if token is expired
        if (this.session.expires_at && this.session.expires_at <= Date.now()) {
          // Try to refresh the token
          try {
            await this.refreshSession();
          } catch (error) {
            // Refresh failed, clear session
            this.saveSession(null);
            return { data: { session: null }, error: null };
          }
        }
        return { data: { session: this.session }, error: null };
      }

      return { data: { session: null }, error: null };
    } catch (error) {
      return {
        data: { session: null },
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  public async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const data = await this.makeAuthRequest('/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (data.access_token && data.user) {
        const session: AuthSession = {
          access_token: data.access_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
          refresh_token: data.refresh_token,
          user: data.user,
        };

        this.saveSession(session);
        return { user: data.user, session, error: undefined };
      }

      throw new Error('Invalid response from auth server');
    } catch (error) {
      return {
        user: null,
        session: null,
        error: {
          message:
            error instanceof Error ? error.message : 'Authentication failed',
        },
      };
    }
  }

  public async refreshSession(): Promise<AuthResponse> {
    if (!this.session?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const data = await this.makeAuthRequest(
        '/token?grant_type=refresh_token',
        {
          method: 'POST',
          body: JSON.stringify({
            refresh_token: this.session.refresh_token,
          }),
        }
      );

      if (data.access_token && data.user) {
        const session: AuthSession = {
          access_token: data.access_token,
          token_type: data.token_type || 'bearer',
          expires_in: data.expires_in || 3600,
          expires_at: Date.now() + (data.expires_in || 3600) * 1000,
          refresh_token: data.refresh_token || this.session.refresh_token,
          user: data.user,
        };

        this.saveSession(session);
        return { user: data.user, session, error: undefined };
      }

      throw new Error('Invalid response from auth server');
    } catch (error) {
      // Refresh failed, clear session
      this.saveSession(null);
      throw error;
    }
  }

  public async signOut(): Promise<{ error?: any }> {
    try {
      if (this.session?.access_token) {
        await this.makeAuthRequest('/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Sign out request failed:', error);
      // Continue with local sign out even if server request fails
    }

    this.saveSession(null);
    return { error: undefined };
  }

  public getCurrentSession(): AuthSession | null {
    return this.session;
  }

  public getCurrentUser(): AuthUser | null {
    return this.session?.user || null;
  }
}

// Export singleton instance
export const directAuth = new DirectAuth();
