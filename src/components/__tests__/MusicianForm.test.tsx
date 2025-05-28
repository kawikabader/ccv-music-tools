import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicianForm } from '../MusicianForm';
import type { Musician } from '../../types';

const mockMusician: Musician = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  instruments: ['Violin', 'Viola'],
  availability: {
    monday: true,
    tuesday: true,
    wednesday: false,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  notes: 'Available for evening rehearsals',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('MusicianForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty form for new musician', () => {
    render(
      <MusicianForm
        musician={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('');
    expect(screen.getByLabelText(/notes/i)).toHaveValue('');
  });

  it('renders form with musician data for editing', () => {
    render(
      <MusicianForm
        musician={mockMusician}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/name/i)).toHaveValue(mockMusician.name);
    expect(screen.getByLabelText(/email/i)).toHaveValue(mockMusician.email);
    expect(screen.getByLabelText(/phone/i)).toHaveValue(mockMusician.phone);
    expect(screen.getByLabelText(/notes/i)).toHaveValue(mockMusician.notes);
  });

  it('calls onSubmit with form data when submitted', () => {
    render(
      <MusicianForm
        musician={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Jane Smith' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'jane@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '(555) 987-6543' },
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'New notes' },
    });

    fireEvent.click(screen.getByText('Save'));

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '(555) 987-6543',
      instruments: [],
      availability: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      notes: 'New notes',
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <MusicianForm
        musician={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('validates required fields', () => {
    render(
      <MusicianForm
        musician={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', () => {
    render(
      <MusicianForm
        musician={undefined}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByText('Save'));

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 