import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthProvider, useAuth, useRequireAuth, useRequireRole } from '../auth';
import type { User, AuthContextType } from '../../types';
import { UserRole } from '../../types';

// Mock the auth context
const mockAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
};

// Mock the auth provider
jest.mock('../auth', () => ({
  ...jest.requireActual('../auth'),
  AuthProvider: ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <div data-testid="mock-auth-provider">{children}</div>
  ),
  useAuth: () => mockAuthContext,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
const originalLocation = window.location;
delete window.location;
window.location = { ...originalLocation, href: '' };

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button onClick={() => login('test@example.com', 'testpass')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const RequireAuthComponent = () => {
  const auth = useRequireAuth();
  return <div data-testid="require-auth">{auth.isAuthenticated.toString()}</div>;
};

const RequireRoleComponent = () => {
  const auth = useRequireRole('director');
  return <div data-testid="require-role">{auth.user?.role}</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
    localStorage.clear();
    window.location.href = '';
  });

  it('renders login button when not authenticated', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
    expect(screen.getByText('Login with GitHub')).toBeInTheDocument();
  });

  it('renders welcome message and logout button when authenticated', async () => {
    const mockUser: User = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'director',
      githubId: '123',
    };

    mockAuthContext.user = mockUser;
    mockAuthContext.isAuthenticated = true;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, John Doe!/i)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login with GitHub'));
    });

    expect(mockAuthContext.login).toHaveBeenCalledWith('mock-code');
  });

  it('handles logout', () => {
    const mockUser: User = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'director',
      githubId: '123',
    };

    mockAuthContext.user = mockUser;
    mockAuthContext.isAuthenticated = true;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Logout'));

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('provides authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('handles login and logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(localStorage.setItem).toHaveBeenCalled();
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    // Logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('redirects when using useRequireAuth without authentication', () => {
    render(
      <AuthProvider>
        <RequireAuthComponent />
      </AuthProvider>
    );

    expect(window.location.href).toBe('/login');
  });

  it('redirects when using useRequireRole without correct role', () => {
    render(
      <AuthProvider>
        <RequireRoleComponent />
      </AuthProvider>
    );

    expect(window.location.href).toBe('/unauthorized');
  });
}); 