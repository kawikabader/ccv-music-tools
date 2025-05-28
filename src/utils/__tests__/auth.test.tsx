import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth';
import type { User, AuthContextType } from '../../types';

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

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <div>Welcome, {user?.name}!</div>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <button onClick={() => login('mock-code')}>Login with GitHub</button>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext.user = null;
    mockAuthContext.isAuthenticated = false;
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
}); 