import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock the useAuth hook
jest.mock('../../utils/auth', () => ({
  ...jest.requireActual('../../utils/auth'),
  useAuth: () => ({
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
    },
  }),
}));

describe('Dashboard', () => {
  it('renders welcome message with user name', () => {
    render(<Dashboard />);

    expect(screen.getByText(/Welcome, John Doe!/i)).toBeInTheDocument();
  });

  it('renders dashboard description', () => {
    render(<Dashboard />);

    expect(
      screen.getByText(/Manage your musicians and rehearsals/i)
    ).toBeInTheDocument();
  });

  it('renders metrics cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Total Musicians')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Rehearsals')).toBeInTheDocument();
    expect(screen.getByText('Available Musicians')).toBeInTheDocument();
  });

  it('renders quick actions', () => {
    render(<Dashboard />);

    expect(screen.getByText('Add Musician')).toBeInTheDocument();
    expect(screen.getByText('Schedule Rehearsal')).toBeInTheDocument();
    expect(screen.getByText('View Calendar')).toBeInTheDocument();
  });
}); 