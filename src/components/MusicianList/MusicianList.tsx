import { useState } from 'react';
import { useMusicians } from '../../hooks/useMusicians';
import { useAuth } from '../../utils/auth';
import type { Musician } from '../../types/supabase';

export function MusicianList() {
  const { musicians, loading, error, addMusician, updateMusician, deleteMusician } = useMusicians();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [newMusician, setNewMusician] = useState<Omit<Musician, 'id'>>({
    name: '',
    instrument: '',
    phone: '',
  });

  const filteredMusicians = musicians.filter(musician =>
    musician.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleAddMusician(e: React.FormEvent) {
    e.preventDefault();
    if (!newMusician.name) return;

    addMusician(newMusician)
      .then(() => {
        setNewMusician({ name: '', instrument: '', phone: '' });
      })
      .catch(console.error);
  }

  function handleUpdateMusician(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMusician) return;

    updateMusician(editingMusician.id, {
      name: editingMusician.name,
      instrument: editingMusician.instrument,
      phone: editingMusician.phone,
    })
      .then(() => {
        setEditingMusician(null);
      })
      .catch(console.error);
  }

  function handleLogout() {
    logout();
  }

  if (loading) return <div className="text-center p-4">Loading musicians...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header - Fixed height */}
      <div className="sticky top-0 z-50 bg-white shadow-md h-20">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Roster</h1>
            <p className="text-gray-600">
              Welcome, {user?.name} ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sticky Search Bar - Positioned exactly at header bottom */}
      <div className="sticky top-20 z-40 bg-gray-50 border-b border-gray-200 h-16">
        <div className="container mx-auto px-4 h-full flex items-center">
          <input
            type="text"
            placeholder="Search musicians..."
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Add Musician Form - Only for Admin */}
        {user?.role === 'admin' && (
          <form onSubmit={handleAddMusician} className="mb-8 space-y-4 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Musician</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Name"
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newMusician.name}
                onChange={(e) => setNewMusician({ ...newMusician, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Instrument"
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newMusician.instrument || ''}
                onChange={(e) => setNewMusician({ ...newMusician, instrument: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phone"
                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newMusician.phone || ''}
                onChange={(e) => setNewMusician({ ...newMusician, phone: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add Musician
            </button>
          </form>
        )}

        {/* Musicians List */}
        <div className="space-y-4">
          {filteredMusicians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No musicians found matching your search.' : 'No musicians found.'}
            </div>
          ) : (
            filteredMusicians.map((musician) => (
              <div
                key={musician.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                {editingMusician?.id === musician.id ? (
                  <form onSubmit={handleUpdateMusician} className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editingMusician.name}
                        onChange={(e) =>
                          setEditingMusician({ ...editingMusician, name: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editingMusician.instrument || ''}
                        onChange={(e) =>
                          setEditingMusician({ ...editingMusician, instrument: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={editingMusician.phone || ''}
                        onChange={(e) =>
                          setEditingMusician({ ...editingMusician, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingMusician(null)}
                        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold">{musician.name}</h3>
                      <p className="text-gray-600">
                        {musician.instrument && `${musician.instrument} • `}
                        {musician.phone}
                      </p>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingMusician(musician)}
                          className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMusician(musician.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
