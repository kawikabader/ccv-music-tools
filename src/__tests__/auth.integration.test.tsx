import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../utils/auth';
import { Login } from '../components/Auth/Login';
import { PrivateRoute } from '../components/Auth/PrivateRoute';
import { Dashboard } from '../pages/Dashboard';

// Mock the musicians data
jest.mock('../data/musicians.json', () => ({
  musicians: [
    {
      id: '1',
      name: 'John Doe',
      instrument: 'Guitar',
      email: 'john@example.com',
      phone: '+1234567890',
      experience: '5 years',
      availability: 'Weekends',
      notes: 'Some notes',
      status: 'active',
    },
  ],
}));

describe('Authentication Integration', () => {
  const renderWithAuth = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AuthProvider>{component}</AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('redirects to login when accessing protected route without auth', async () => {
    renderWithAuth(
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  it('allows access to protected route after successful login', async () => {
    renderWithAuth(
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    );

    // Fill in login form
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'testpass');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show dashboard content
    await waitFor(() => {
      expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows unauthorized message for invalid credentials', async () => {
    renderWithAuth(<Login />);

    // Fill in login form with invalid credentials
    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('maintains auth state after page reload', async () => {
    // First login
    renderWithAuth(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'testpass');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for dashboard to appear
    await waitFor(() => {
      expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    });

    // Simulate page reload
    renderWithAuth(
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    );

    // Should still show dashboard content
    await waitFor(() => {
      expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    });
  });

  it('logs out and redirects to login page', async () => {
    // First login
    renderWithAuth(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'testpass');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for dashboard to appear
    await waitFor(() => {
      expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    });

    // Click logout
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
}); 