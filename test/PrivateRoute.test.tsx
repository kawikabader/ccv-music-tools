import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { AuthProvider } from '../../utils/auth';

// Mock the auth context
jest.mock('../../utils/auth', () => ({
  ...jest.requireActual('../../utils/auth'),
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
  }),
}));

const TestComponent = () => <div>Protected Content</div>;

describe('PrivateRoute', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <TestComponent />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('redirects to login when not authenticated', () => {
    renderWithRouter();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      user: null,
      isLoading: true,
    }));

    renderWithRouter();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'director' },
      isLoading: false,
    }));

    renderWithRouter();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to unauthorized when role is required but not matched', () => {
    jest.spyOn(require('../../utils/auth'), 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'musician' },
      isLoading: false,
    }));

    render(
      <MemoryRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <PrivateRoute requiredRole="director">
                  <TestComponent />
                </PrivateRoute>
              }
            />
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });
}); 