import React, { useState, useEffect } from 'react';
import type { Musician } from '../types';
import { useAuth, useIsAdmin } from '../utils/authSupabase';
import { getMusicians, addMusician } from '../utils/musicians';

export function Musicians(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const isAdmin = useIsAdmin();

  useEffect(() => {
    const loadMusicians = async () => {
      try {
        const data = await getMusicians();
        setMusicians(data);
      } catch (error) {
        console.error('Error loading musicians:', error);
      }
    };
    loadMusicians();
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');

    // Take only the first 10 digits
    const digits = numbers.slice(0, 10);

    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      return `(${digits}`;
    }
    return '';
  };

  const formatName = (value: string) => {
    // Split the string into words and capitalize each word's first letter
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatName(value);
    setNameInput(formattedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setPhoneInput(formattedValue);
  };

  const filteredMusicians = musicians.filter(musician => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    const searchNumbers = searchTerm.replace(/[^0-9]/g, '');
    const phoneNumbers = musician.phone?.replace(/[^0-9]/g, '') || '';

    return (
      musician.name.toLowerCase().includes(searchLower) ||
      (searchNumbers.length > 0 && phoneNumbers.includes(searchNumbers))
    );
  });

  const handleAddMusician = async (newMusician: { name: string; phone: string }) => {
    try {
      const musician = await addMusician({
        name: newMusician.name,
        phone: newMusician.phone,
        instrument: null, // Required field in Musician type
      });
      setMusicians([...musicians, musician]);
      setShowAddForm(false);
      setPhoneInput('');
      setNameInput('');
    } catch (error) {
      console.error('Error adding musician:', error);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isAdmin ? 'py-8' : 'pt-4 pb-8'}`}>
      {isAdmin ? (
        <div className="sm:flex sm:items-center mb-8">
          <div className="sm:flex-auto">
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Musician
            </button>
          </div>
        </div>
      ) : null}

      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-medium text-gray-900">Add New Musician</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddMusician({
                name: nameInput,
                phone: phoneInput,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={nameInput}
                      onChange={handleNameChange}
                      className="block w-full rounded-md border-0 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                      placeholder="Enter musician name"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">Names will be automatically capitalized</p>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={phoneInput}
                      onChange={handlePhoneChange}
                      placeholder="Enter 10-digit phone number"
                      className="block w-full rounded-md border-0 py-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">Enter numbers only - will format automatically</p>
                </div>
              </div>
              <div className="mt-6 flex flex-row-reverse gap-3">
                <button
                  type="submit"
                  disabled={phoneInput.length < 14 || !nameInput.trim()}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setPhoneInput('');
                    setNameInput('');
                  }}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white shadow-sm"
        />
      </div>

      <div className="mt-6 overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Name
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-40">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredMusicians.map((musician) => (
              <tr key={musician.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {musician.name}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {musician.phone}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 