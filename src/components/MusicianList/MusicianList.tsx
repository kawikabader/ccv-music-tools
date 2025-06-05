import { useState } from 'react';
import { useMusicians } from '../../hooks/useMusicians';
import { useAuth } from '../../utils/auth';
import { useNotification } from '../../context/NotificationContext';
import type { Musician } from '../../types/supabase';
import logoUrl from '../../assets/a.png';

export function MusicianList() {
  const { musicians, loading, error, addMusician, updateMusician, deleteMusician } = useMusicians();
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [newMusician, setNewMusician] = useState<Omit<Musician, 'id'>>({
    name: '',
    instrument: '',
    phone: '',
  });

  const filteredMusicians = musicians.filter(musician =>
    musician.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

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
    setShowProfileMenu(false);
  }

  async function handleCopyPhone(phone: string | null, name: string) {
    if (!phone) {
      addNotification('warning', `${name} has no phone number`);
      return;
    }

    try {
      await navigator.clipboard.writeText(phone);
      addNotification('success', `📱 Copied ${name}'s phone number`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = phone;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addNotification('success', `📱 Copied ${name}'s phone number`);
      } catch (fallbackErr) {
        addNotification('error', 'Failed to copy phone number');
      }
      document.body.removeChild(textArea);
    }
  }

  if (loading) return <div className="text-center p-4">Loading musicians...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header - Fixed height */}
      <div className="sticky top-0 z-50 bg-white shadow-md h-16">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src={logoUrl}
              alt="Team Roster Logo"
              className="h-10 w-10"
            />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Team Roster</h1>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {/* User Avatar */}
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {getUserInitials(user?.name || 'U')}
              </div>
              {/* Name (hidden on mobile) */}
              <span className="hidden sm:block text-gray-700 font-medium max-w-32 truncate">
                {user?.name}
              </span>
              {/* Dropdown arrow */}
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}

      {/* Sticky Search Bar - Positioned exactly at header bottom */}
      <div className="sticky top-16 z-40 bg-gray-50 border-b border-gray-200 h-16">
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
                    <div
                      className="flex-1 cursor-pointer group"
                      onClick={() => handleCopyPhone(musician.phone, musician.name)}
                      title={musician.phone ? `Click to copy ${musician.name}'s phone number` : `${musician.name} has no phone number`}
                    >
                      <h3 className="text-lg font-semibold group-hover:text-indigo-600 transition-colors">
                        {musician.name}
                      </h3>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors">
                        {musician.instrument && `${musician.instrument} • `}
                        {musician.phone ? (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded group-hover:bg-indigo-100 transition-colors">
                            {musician.phone}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No phone number</span>
                        )}
                      </p>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-2 ml-4">
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
