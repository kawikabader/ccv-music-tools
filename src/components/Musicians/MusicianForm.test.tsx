import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MusicianForm } from './MusicianForm';

describe('MusicianForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Check if all form fields are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instrument/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/availability/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();

    // Check if buttons are rendered
    expect(screen.getByRole('button', { name: /add musician/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders edit mode with initial values', () => {
    const initialValues = {
      name: 'John Doe',
      instrument: 'Guitar',
      email: 'john@example.com',
      phone: '+1234567890',
      experience: '5 years',
      availability: 'Weekends',
      notes: 'Some notes',
      status: 'active' as const,
    };

    render(
      <MusicianForm
        initialValues={initialValues}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check if initial values are populated
    expect(screen.getByLabelText(/name/i)).toHaveValue(initialValues.name);
    expect(screen.getByLabelText(/instrument/i)).toHaveValue(initialValues.instrument);
    expect(screen.getByLabelText(/email/i)).toHaveValue(initialValues.email);
    expect(screen.getByLabelText(/phone/i)).toHaveValue(initialValues.phone);
    expect(screen.getByLabelText(/experience/i)).toHaveValue(initialValues.experience);
    expect(screen.getByLabelText(/availability/i)).toHaveValue(initialValues.availability);
    expect(screen.getByLabelText(/notes/i)).toHaveValue(initialValues.notes);
    expect(screen.getByLabelText(/status/i)).toHaveValue(initialValues.status);

    // Check if submit button shows "Update" instead of "Add"
    expect(screen.getByRole('button', { name: /update musician/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters long/i)).toBeInTheDocument();
      expect(screen.getByText(/instrument is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      expect(screen.getByText(/experience is required/i)).toBeInTheDocument();
      expect(screen.getByText(/availability is required/i)).toBeInTheDocument();
    });

    // Verify onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');

    // Trigger validation
    fireEvent.blur(emailInput);

    // Check for validation message
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const phoneInput = screen.getByLabelText(/phone/i);
    await userEvent.type(phoneInput, '123'); // Too short

    // Trigger validation
    fireEvent.blur(phoneInput);

    // Check for validation message
    expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in all required fields
    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/instrument/i), 'Guitar');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890');
    await userEvent.type(screen.getByLabelText(/experience/i), '5 years');
    await userEvent.type(screen.getByLabelText(/availability/i), 'Weekends');
    await userEvent.type(screen.getByLabelText(/notes/i), 'Some notes');

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add musician/i }));

    // Verify onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      instrument: 'Guitar',
      email: 'john@example.com',
      phone: '+1234567890',
      experience: '5 years',
      availability: 'Weekends',
      notes: 'Some notes',
      status: 'active',
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<MusicianForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });
}); 