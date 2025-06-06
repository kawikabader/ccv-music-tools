import { useState } from 'react';
import { useMusicians } from '../../hooks/useMusicians';
import { useAuth, useIsAdmin } from '../../utils/authSupabase';
import { useNotification } from '../../context/NotificationContext';
import type { Musician } from '../../types/supabase';
import logoUrl from '../../assets/a.png';

interface MusicianListProps {
  musicians?: Musician[];
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  isSelected?: (id: string) => boolean;
}

export function MusicianList(props: MusicianListProps = {}) {
  const {
    musicians: propMusicians,
    selectedIds = new Set(),
    onToggleSelection,
    isSelected
  } = props;
  const { musicians: hookMusicians, loading, error, addMusician, updateMusician, deleteMusician } = useMusicians();

  // Use prop musicians if provided, otherwise use hook musicians
  const musicians = propMusicians || hookMusicians;
  const { user, profile, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
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

  // Handle keyboard navigation between musicians
  const handleKeyNavigation = (e: React.KeyboardEvent, index: number, musicianId: string) => {
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        onToggleSelection?.(musicianId);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index < filteredMusicians.length - 1) {
          const nextIndex = index + 1;
          setFocusedIndex(nextIndex);
          // Focus next musician item
          const nextElement = document.querySelector(`[data-musician-index="${nextIndex}"]`) as HTMLElement;
          nextElement?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevIndex = index - 1;
          setFocusedIndex(prevIndex);
          // Focus previous musician item
          const prevElement = document.querySelector(`[data-musician-index="${prevIndex}"]`) as HTMLElement;
          prevElement?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        if (filteredMusicians.length > 0) {
          setFocusedIndex(0);
          const firstElement = document.querySelector(`[data-musician-index="0"]`) as HTMLElement;
          firstElement?.focus();
        }
        break;
      case 'End':
        e.preventDefault();
        if (filteredMusicians.length > 0) {
          const lastIndex = filteredMusicians.length - 1;
          setFocusedIndex(lastIndex);
          const lastElement = document.querySelector(`[data-musician-index="${lastIndex}"]`) as HTMLElement;
          lastElement?.focus();
        }
        break;
    }
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
    signOut();
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

  // Only show loading/error states if we're not using prop musicians
  if (!propMusicians && loading) return <div className="text-center p-4">Loading musicians...</div>;
  if (!propMusicians && error) return <div className="text-red-500 text-center p-4">{error}</div>;

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
                {getUserInitials(profile?.name || 'U')}
              </div>
              {/* Name (hidden on mobile) */}
              <span className="hidden sm:block text-gray-700 font-medium max-w-32 truncate">
                {profile?.name}
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
                  <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
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
        {isAdmin && (
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
            filteredMusicians.map((musician) => {
              const isItemSelected = isSelected ? isSelected(musician.id) : false;

              return (
                <div
                  key={musician.id}
                  className={`bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative touch-manipulation select-none ${isItemSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                    }`}
                  onClick={() => onToggleSelection?.(musician.id)}
                  onKeyDown={(e) => handleKeyNavigation(e, filteredMusicians.indexOf(musician), musician.id)}
                  onTouchStart={(e) => {
                    // Prevent text selection on long press
                    e.currentTarget.style.webkitUserSelect = 'none';
                  }}
                  onTouchEnd={(e) => {
                    // Re-enable text selection
                    e.currentTarget.style.webkitUserSelect = '';
                  }}
                  role="button"
                  tabIndex={0}
                  data-musician-index={filteredMusicians.indexOf(musician)}
                  aria-pressed={isItemSelected}
                  aria-label={`${isItemSelected ? 'Deselect' : 'Select'} ${musician.name} for phone number copying. ${musician.instrument ? musician.instrument + ', ' : ''}${musician.phone || 'No phone number'}. Use arrow keys to navigate, space or enter to toggle selection.`}
                >
                  {/* Selection Checkmark */}
                  {isItemSelected && (
                    <div className="absolute top-2 right-2 w-7 h-7 md:w-6 md:h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center" aria-hidden="true">
                      <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
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
                        className="flex-1 pointer-events-none"
                      >
                        <h3 className="text-lg font-semibold transition-colors">
                          {musician.name}
                        </h3>
                        <p className="text-gray-600 transition-colors">
                          {musician.instrument && `${musician.instrument} • `}
                          {musician.phone ? (
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded transition-colors">
                              {musician.phone}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No phone number</span>
                          )}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className={`flex space-x-2 ml-4 ${isItemSelected ? 'mr-8 md:mr-8' : ''}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMusician(musician);
                            }}
                            className="bg-gray-200 text-gray-800 py-2 px-4 min-h-[44px] rounded-lg hover:bg-gray-300 active:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMusician(musician.id);
                            }}
                            className="bg-red-600 text-white py-2 px-4 min-h-[44px] rounded-lg hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 touch-manipulation"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
