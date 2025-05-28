import React, { useState } from 'react';
import { MusicianList } from '../components/MusicianList';
import { MusicianForm } from '../components/MusicianForm';
import type { Musician } from '../types';

// Mock data for development
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

export function Musicians() {
  const [musicians, setMusicians] = useState<Musician[]>(mockMusicians);
  const [selectedMusician, setSelectedMusician] = useState<Musician | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setSelectedMusician(null);
    setIsFormOpen(true);
  };

  const handleEdit = (musician: Musician) => {
    setSelectedMusician(musician);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this musician?')) {
      setMusicians(musicians.filter((m) => m.id !== id));
    }
  };

  const handleSubmit = (musicianData: Omit<Musician, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedMusician) {
      // Update existing musician
      setMusicians(
        musicians.map((m) =>
          m.id === selectedMusician.id
            ? {
              ...m,
              ...musicianData,
              updatedAt: new Date().toISOString(),
            }
            : m
        )
      );
    } else {
      // Create new musician
      const newMusician: Musician = {
        ...musicianData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMusicians([...musicians, newMusician]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Musicians</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Musician
        </button>
      </div>

      {isFormOpen ? (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {selectedMusician ? 'Edit Musician' : 'Add Musician'}
            </h3>
            <div className="mt-5">
              <MusicianForm
                musician={selectedMusician || undefined}
                onSubmit={handleSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : (
        <MusicianList
          musicians={musicians}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
} 