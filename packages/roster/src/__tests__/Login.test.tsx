import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Login } from '../components/Auth/Login';
import { AuthProvider } from '../utils/authSupabase';

// Mock Supabase
const mockSignIn = vi.fn();
const mockClearError = vi.fn();

vi.mock('../utils/authSupabase', async () => {
  const actual = await vi.importActual('../utils/authSupabase');
  return {
    ...actual,
    useAuth: () => ({
      signIn: mockSignIn,
      loading: false,
      error: null,
      clearError: mockClearError,
      user: null,
    }),
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const LoginWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginWrapper />);

    expect(screen.getByText(/team roster/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginWrapper />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<LoginWrapper />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.blur(emailInput);

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it('submits form with valid credentials', async () => {
    render(<LoginWrapper />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during sign in', () => {
    // Mock loading state
    vi.doMock('../utils/authSupabase', () => ({
      ...vi.importActual('../utils/authSupabase'),
      useAuth: () => ({
        signIn: mockSignIn,
        loading: true,
        error: null,
        clearError: mockClearError,
        user: null,
      }),
    }));

    render(<LoginWrapper />);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('displays error message when auth fails', () => {
    // Mock error state
    vi.doMock('../utils/authSupabase', () => ({
      ...vi.importActual('../utils/authSupabase'),
      useAuth: () => ({
        signIn: mockSignIn,
        loading: false,
        error: 'Invalid credentials',
        clearError: mockClearError,
        user: null,
      }),
    }));

    render(<LoginWrapper />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
}); 