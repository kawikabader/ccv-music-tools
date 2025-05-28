import React, { useState, useEffect } from 'react';
import musicianData from '../data/musicians.json';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ErrorMessage } from '../components/Common/ErrorMessage';
import { MusicianForm } from '../components/Musicians/MusicianForm';
import { useNotification } from '../context/NotificationContext';

interface Musician {
  id: string;
  name: string;
  instrument: string;
  email: string;
  phone: string;
  experience: string;
  availability: string;
  notes: string;
  status: 'active' | 'inactive';
}

export function Musicians(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const loadMusicians = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMusicians(musicianData.musicians as Musician[]);
      } catch (err) {
        setError('Failed to load musicians. Please try again.');
        addNotification('error', 'Failed to load musicians. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMusicians();
  }, [addNotification]);

  const filteredMusicians = musicians.filter((musician) => {
    const matchesSearch =
      musician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      musician.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      musician.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || musician.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMusicians(musicianData.musicians as Musician[]);
      setIsLoading(false);
    }, 1000);
  };

  const handleAddMusician = () => {
    setEditingMusician(null);
    setShowForm(true);
  };

  const handleEditMusician = (musician: Musician) => {
    setEditingMusician(musician);
    setShowForm(true);
  };

  const handleFormSubmit = (values: any) => {
    try {
      if (editingMusician) {
        // Update existing musician
        setMusicians(prev =>
          prev.map(m =>
            m.id === editingMusician.id ? { ...m, ...values } : m
          )
        );
        addNotification('success', 'Musician updated successfully');
      } else {
        // Add new musician
        const newMusician = {
          id: Math.random().toString(36).substr(2, 9),
          ...values,
        };
        setMusicians(prev => [...prev, newMusician]);
        addNotification('success', 'Musician added successfully');
      }
      setShowForm(false);
    } catch (err) {
      addNotification('error', 'Failed to save musician. Please try again.');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMusician(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={handleRetry} className="mt-4" />;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Musicians</h1>
        <button
          type="button"
          onClick={handleAddMusician}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Musician
        </button>
      </div>

      {showForm ? (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingMusician ? 'Edit Musician' : 'Add New Musician'}
          </h2>
          <MusicianForm
            initialValues={editingMusician || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by name, instrument, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Musician List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {filteredMusicians.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No musicians found matching your criteria.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredMusicians.map((musician) => (
                  <li key={musician.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {musician.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${musician.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {musician.status}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <button
                            type="button"
                            onClick={() => handleEditMusician(musician)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Edit</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {musician.instrument}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            {musician.experience} experience
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>{musician.availability}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{musician.notes}</p>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                        <p className="mb-1 sm:mb-0">{musician.email}</p>
                        <p className="hidden sm:block sm:mx-2">•</p>
                        <p>{musician.phone}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
} 