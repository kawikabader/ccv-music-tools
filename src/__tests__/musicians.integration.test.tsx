import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../utils/auth';
import { NotificationProvider } from '../context/NotificationContext';
import { Musicians } from '../pages/Musicians';

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
    {
      id: '2',
      name: 'Jane Smith',
      instrument: 'Piano',
      email: 'jane@example.com',
      phone: '+1987654321',
      experience: '10 years',
      availability: 'Weekdays',
      notes: 'Classical pianist',
      status: 'active',
    },
  ],
}));

describe('Musician Management Integration', () => {
  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>{component}</NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock successful login
    localStorage.setItem('user', JSON.stringify({ email: 'admin@example.com' }));
  });

  it('loads and displays musician list', async () => {
    renderWithProviders(<Musicians />);

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Should show musician list after loading
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters musicians by search term', async () => {
    renderWithProviders(<Musicians />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.type(searchInput, 'John');

    // Should only show John Doe
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters musicians by status', async () => {
    renderWithProviders(<Musicians />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Filter by active status
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    // Should show both active musicians
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('adds a new musician', async () => {
    renderWithProviders(<Musicians />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click add musician button
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/name/i), 'New Musician');
    await userEvent.type(screen.getByLabelText(/instrument/i), 'Drums');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/phone/i), '+1122334455');
    await userEvent.type(screen.getByLabelText(/experience/i), '3 years');
    await userEvent.type(screen.getByLabelText(/availability/i), 'Flexible');
    await userEvent.type(screen.getByLabelText(/notes/i), 'Drummer');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText(/musician added successfully/i)).toBeInTheDocument();
    });

    // Should show new musician in list
    expect(screen.getByText('New Musician')).toBeInTheDocument();
  });

  it('edits an existing musician', async () => {
    renderWithProviders(<Musicians />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click edit button for John Doe
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // Update the form
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Updated');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /update musician/i }));

    // Should show success notification
    await waitFor(() => {
      expect(screen.getByText(/musician updated successfully/i)).toBeInTheDocument();
    });

    // Should show updated name in list
    expect(screen.getByText('John Updated')).toBeInTheDocument();
  });

  it('shows error notification when form validation fails', async () => {
    renderWithProviders(<Musicians />);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click add musician button
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Submit form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters long/i)).toBeInTheDocument();
      expect(screen.getByText(/instrument is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
    });
  });
}); 