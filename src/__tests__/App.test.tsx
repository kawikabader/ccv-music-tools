import React from 'react';
import { render, screen } from '@testing-library/react';
import { App } from '../App';

// Mock the useAuth hook
jest.mock('../utils/auth', () => ({
  ...jest.requireActual('../utils/auth'),
  useAuth: () => ({
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('App', () => {
  it('renders dashboard for authenticated user', () => {
    render(<App />);

    expect(screen.getByText(/Welcome, John Doe!/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<App />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Musicians')).toBeInTheDocument();
    expect(screen.getByText('Rehearsals')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('renders user profile section', () => {
    render(<App />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<App />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
}); 