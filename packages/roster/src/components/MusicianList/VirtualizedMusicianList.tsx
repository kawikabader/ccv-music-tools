import React, { useState, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useMusicians } from '../../hooks/useMusicians';
import { useAuth, useIsAdmin } from '../../utils/authSupabase';
import { useNotification } from '../../context/NotificationContext';
import type { Musician } from '../../types/supabase';
import logoUrl from '../../assets/a.png';

interface VirtualizedMusicianListProps {
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  isSelected?: (id: string) => boolean;
  itemHeight?: number;
  listHeight?: number;
  overscan?: number;
}

interface MusicianItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    musicians: Musician[];
    selectedIds: Set<string>;
    onToggleSelection?: (id: string) => void;
    isSelected?: (id: string) => boolean;
    isAdmin: boolean;
    handleCopyPhone: (phone: string | null, name: string) => void;
    handleKeyNavigation: (e: React.KeyboardEvent, index: number, musicianId: string) => void;
    setEditingMusician: (musician: Musician | null) => void;
    editingMusician: Musician | null;
    handleUpdateMusician: (e: React.FormEvent) => void;
    deleteMusician: (id: string) => Promise<void>;
  };
}

const MusicianItem: React.FC<MusicianItemProps> = React.memo(({ index, style, data }) => {
  const {
    musicians,
    selectedIds,
    onToggleSelection,
    isSelected,
    isAdmin,
    handleCopyPhone,
    handleKeyNavigation,
    setEditingMusician,
    editingMusician,
    handleUpdateMusician,
    deleteMusician,
  } = data;

  const musician = musicians[index];
  const isItemSelected = isSelected ? isSelected(musician.id) : selectedIds.has(musician.id);

  if (!musician) return null;

  return (
    <div style={style} className="px-4">
      <div
        className={`bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md active:scale-[0.98] transition-all cursor-pointer relative touch-manipulation select-none ${isItemSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
          }`}
        onClick={() => onToggleSelection?.(musician.id)}
        onKeyDown={(e) => handleKeyNavigation(e, index, musician.id)}
        onTouchStart={(e) => {
          e.currentTarget.style.webkitUserSelect = 'none';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.webkitUserSelect = '';
        }}
        role="button"
        tabIndex={0}
        data-musician-index={index}
        aria-pressed={isItemSelected}
        aria-label={`${isItemSelected ? 'Deselect' : 'Select'} ${musician.name} for phone number copying. ${musician.instrument ? musician.instrument + ', ' : ''
          }${musician.phone || 'No phone number'}. Use arrow keys to navigate, space or enter to toggle selection.`}
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
              className="flex-1 cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyPhone(musician.phone, musician.name);
              }}
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
    </div>
  );
});

MusicianItem.displayName = 'MusicianItem';

export function VirtualizedMusicianList(props: VirtualizedMusicianListProps = {}) {
  const {
    selectedIds = new Set(),
    onToggleSelection,
    isSelected,
    itemHeight = 120,
    listHeight = 600,
    overscan = 5,
  } = props;

  const { musicians, loading, error, addMusician, updateMusician, deleteMusician } = useMusicians();
  const { user, profile, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMusician, setEditingMusician] = useState<Musician | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<List>(null);
  const [newMusician, setNewMusician] = useState<Omit<Musician, 'id'>>({
    name: '',
    instrument: '',
    phone: '',
  });

  const filteredMusicians = useMemo(() =>
    musicians.filter(musician =>
      musician.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [musicians, searchTerm]
  );

  // Get user initials
  const getUserInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  // Handle keyboard navigation between musicians
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent, index: number, musicianId: string) => {
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
          listRef.current?.scrollToItem(nextIndex, 'smart');
          // Focus next musician item with a small delay to ensure it's rendered
          setTimeout(() => {
            const nextElement = document.querySelector(`[data-musician-index="${nextIndex}"]`) as HTMLElement;
            nextElement?.focus();
          }, 50);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) {
          const prevIndex = index - 1;
          setFocusedIndex(prevIndex);
          listRef.current?.scrollToItem(prevIndex, 'smart');
          // Focus previous musician item with a small delay to ensure it's rendered
          setTimeout(() => {
            const prevElement = document.querySelector(`[data-musician-index="${prevIndex}"]`) as HTMLElement;
            prevElement?.focus();
          }, 50);
        }
        break;
      case 'Home':
        e.preventDefault();
        if (filteredMusicians.length > 0) {
          setFocusedIndex(0);
          listRef.current?.scrollToItem(0, 'start');
          setTimeout(() => {
            const firstElement = document.querySelector(`[data-musician-index="0"]`) as HTMLElement;
            firstElement?.focus();
          }, 50);
        }
        break;
      case 'End':
        e.preventDefault();
        if (filteredMusicians.length > 0) {
          const lastIndex = filteredMusicians.length - 1;
          setFocusedIndex(lastIndex);
          listRef.current?.scrollToItem(lastIndex, 'end');
          setTimeout(() => {
            const lastElement = document.querySelector(`[data-musician-index="${lastIndex}"]`) as HTMLElement;
            lastElement?.focus();
          }, 50);
        }
        break;
    }
  }, [filteredMusicians.length, onToggleSelection]);

  const handleAddMusician = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusician.name) return;

    addMusician(newMusician)
      .then(() => {
        setNewMusician({ name: '', instrument: '', phone: '' });
      })
      .catch(console.error);
  }, [newMusician, addMusician]);

  const handleUpdateMusician = useCallback((e: React.FormEvent) => {
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
  }, [editingMusician, updateMusician]);

  const handleLogout = useCallback(() => {
    signOut();
    setShowProfileMenu(false);
  }, [signOut]);

  const handleCopyPhone = useCallback(async (phone: string | null, name: string) => {
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
  }, [addNotification]);

  // Memoized item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    musicians: filteredMusicians,
    selectedIds,
    onToggleSelection,
    isSelected,
    isAdmin,
    handleCopyPhone,
    handleKeyNavigation,
    setEditingMusician,
    editingMusician,
    handleUpdateMusician,
    deleteMusician,
  }), [
    filteredMusicians,
    selectedIds,
    onToggleSelection,
    isSelected,
    isAdmin,
    handleCopyPhone,
    handleKeyNavigation,
    editingMusician,
    handleUpdateMusician,
    deleteMusician,
  ]);

  // Calculate dynamic list height based on container or provided height
  const dynamicListHeight = useMemo(() => {
    const maxHeight = Math.min(listHeight, filteredMusicians.length * itemHeight);
    return Math.max(200, maxHeight); // Minimum height of 200px
  }, [listHeight, filteredMusicians.length, itemHeight]);

  if (loading) return <div className="text-center p-4">Loading musicians...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 h-16">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logoUrl} alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-900">
              Musician Roster ({filteredMusicians.length} {filteredMusicians.length === 1 ? 'musician' : 'musicians'})
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {profile?.name ? getUserInitials(profile.name) : 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {profile?.name || 'User'}
              </span>
            </button>

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

      {/* Sticky Search Bar */}
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

        {/* Virtualized Musicians List */}
        <div className="bg-white rounded-lg shadow">
          {filteredMusicians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No musicians found matching your search.' : 'No musicians found.'}
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredMusicians.length} of {musicians.length} musicians
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </div>
              <List
                ref={listRef}
                height={dynamicListHeight}
                itemCount={filteredMusicians.length}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={overscan}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {MusicianItem}
              </List>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 