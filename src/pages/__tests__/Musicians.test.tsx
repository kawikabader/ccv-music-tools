import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Musicians } from '../Musicians';
import type { Musician } from '../../types';

const mockMusicians: Musician[] = [
  {
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
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 987-6543',
    instruments: ['Cello'],
    availability: {
      monday: false,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: false,
      saturday: true,
      sunday: false,
    },
    notes: 'Prefers weekend performances',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Musicians', () => {
  it('renders list of musicians initially', () => {
    render(<Musicians />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows form when Add Musician button is clicked', () => {
    render(<Musicians />);

    fireEvent.click(screen.getByText('Add Musician'));

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows form with musician data when Edit button is clicked', () => {
    render(<Musicians />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText(/name/i)).toHaveValue(mockMusicians[0].name);
    expect(screen.getByLabelText(/email/i)).toHaveValue(mockMusicians[0].email);
    expect(screen.getByLabelText(/phone/i)).toHaveValue(mockMusicians[0].phone);
    expect(screen.getByLabelText(/notes/i)).toHaveValue(mockMusicians[0].notes);
  });

  it('removes musician when Delete button is clicked', () => {
    render(<Musicians />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters musicians by name', () => {
    render(<Musicians />);

    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters musicians by instrument', () => {
    render(<Musicians />);

    const instrumentSelect = screen.getByRole('combobox');
    fireEvent.change(instrumentSelect, { target: { value: 'Cello' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
}); 