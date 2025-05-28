import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MusicianList } from '../MusicianList';
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

describe('MusicianList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders list of musicians', () => {
    render(
      <MusicianList
        musicians={mockMusicians}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Violin, Viola')).toBeInTheDocument();
    expect(screen.getByText('Cello')).toBeInTheDocument();
  });

  it('filters musicians by name', () => {
    render(
      <MusicianList
        musicians={mockMusicians}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('filters musicians by instrument', () => {
    render(
      <MusicianList
        musicians={mockMusicians}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const instrumentSelect = screen.getByRole('combobox');
    fireEvent.change(instrumentSelect, { target: { value: 'Cello' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <MusicianList
        musicians={mockMusicians}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockMusicians[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <MusicianList
        musicians={mockMusicians}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockMusicians[0].id);
  });
}); 