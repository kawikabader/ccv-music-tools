import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { AuthProvider } from '../../utils/auth';

// Mock the auth context
jest.mock('../../utils/auth', () => ({
  ...jest.requireActual('../../utils/auth'),
  useAuth: () => ({
    login: jest.fn(),
    error: null,
    isLoading: false,
  }),
}));

describe('Login', () => {
  const renderLogin = () => {
    return render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
  };

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockLogin = jest.fn();
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      error: null,
      isLoading: false,
    }));

    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'testpass');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'testpass');
    });
  });

  it('displays error message when login fails', () => {
    const errorMessage = 'Invalid credentials';
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      login: jest.fn(),
      error: errorMessage,
      isLoading: false,
    }));

    renderLogin();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state during login', () => {
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      login: jest.fn(),
      error: null,
      isLoading: true,
    }));

    renderLogin();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });
});
