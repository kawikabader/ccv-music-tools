import React, { useState } from 'react';
import type { Musician } from '../types';

interface MusicianListProps {
  musicians: Musician[];
  onEdit: (musician: Musician) => void;
  onDelete: (id: string) => void;
}

export function MusicianList({ musicians, onEdit, onDelete }: MusicianListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');

  const instruments = Array.from(
    new Set(musicians.flatMap((m) => m.instruments))
  ).sort();

  const filteredMusicians = musicians.filter((musician) => {
    const matchesSearch = musician.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesInstrument =
      !selectedInstrument ||
      musician.instruments.includes(selectedInstrument);
    return matchesSearch && matchesInstrument;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedInstrument}
          onChange={(e) => setSelectedInstrument(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Instruments</option>
          {instruments.map((instrument) => (
            <option key={instrument} value={instrument}>
              {instrument}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredMusicians.map((musician) => (
            <li key={musician.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {musician.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {musician.instruments.join(', ')}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => onEdit(musician)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(musician.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {musician.email}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      {musician.phone}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 