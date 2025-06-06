import React, { useState } from 'react';
import { MusicianList } from './MusicianList';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import { usePhoneClipboard } from '../../hooks/usePhoneClipboard';
import { useMusicians } from '../../hooks/useMusicians';
import { CopyConfirmation } from '../UI/CopyConfirmation';
import type { Musician } from '../../types/supabase';

/**
 * Enhanced MusicianList component with multi-select and phone clipboard functionality
 */
export function MusicianListWithMultiSelect() {
  const { musicians, loading, error } = useMusicians();
  const multiSelect = useMultiSelect();
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [lastCopyResult, setLastCopyResult] = useState<{
    success: boolean;
    message: string;
    phoneCount: number;
  } | null>(null);

  // Phone clipboard functionality
  const phoneClipboard = usePhoneClipboard(
    musicians,
    multiSelect.selectedIds,
    multiSelect.clearSelection,
    {
      // Auto-update clipboard when selection changes
      autoUpdateClipboard: false, // We'll handle this manually
      // Clear selection after successful copy
      autoClearSelection: false,
      // Custom success message
      successMessage: (count: number) =>
        `Successfully copied ${count} phone number${count !== 1 ? 's' : ''} to clipboard! 📱`,
      // Use newline separator for Apple Messages compatibility  
      separator: '\n',
      // Don't include country code for better Apple Messages compatibility
      includeCountryCode: false,
      // Use Apple Messages specific formatting
      appleMessagesFormat: true,
    }
  );

  // Handle manual copy action
  const handleCopyPhoneNumbers = async () => {
    if (multiSelect.selectedCount === 0) {
      setLastCopyResult({
        success: false,
        message: 'Please select some musicians first',
        phoneCount: 0,
      });
      setShowCopyConfirmation(true);
      return;
    }

    const result = await phoneClipboard.copyPhoneNumbers();
    setLastCopyResult(result);
    setShowCopyConfirmation(true);

    // Clear selection after successful copy (optional)
    if (result.success) {
      // Optionally clear selection after a delay
      setTimeout(() => {
        multiSelect.clearSelection();
      }, 2000);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    multiSelect.clearSelection();
  };

  // Handle loading and error states at the top level to prevent duplicate data fetching
  if (loading) return <div className="text-center p-4">Loading musicians...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <>
      <div className="relative">
        {/* Selection Summary Bar */}
        {multiSelect.selectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-indigo-600 text-white p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {multiSelect.selectedCount}
                  </div>
                  <span className="font-medium">
                    {multiSelect.selectedCount} musician{multiSelect.selectedCount !== 1 ? 's' : ''} selected
                  </span>
                </div>

                {/* Phone number stats */}
                <div className="text-sm opacity-90">
                  {phoneClipboard.phoneStats.validPhones > 0 && (
                    <span>
                      {phoneClipboard.phoneStats.validPhones} valid phone number{phoneClipboard.phoneStats.validPhones !== 1 ? 's' : ''}
                      {phoneClipboard.phoneStats.invalidPhones > 0 && (
                        <span className="text-yellow-200">
                          , {phoneClipboard.phoneStats.invalidPhones} invalid
                        </span>
                      )}
                    </span>
                  )}
                  {phoneClipboard.phoneStats.validPhones === 0 && (
                    <span className="text-yellow-200">No valid phone numbers</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClearSelection}
                  className="px-4 py-2 text-indigo-200 hover:text-white hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleCopyPhoneNumbers}
                  disabled={phoneClipboard.phoneStats.validPhones === 0}
                  className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Copy Phone Numbers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main MusicianList Component - Pass data as props to prevent duplicate fetching */}
        <div className={multiSelect.selectedCount > 0 ? 'pb-20' : ''}>
          <MusicianList
            musicians={musicians}
            selectedIds={multiSelect.selectedIds}
            onToggleSelection={multiSelect.toggleSelection}
            isSelected={multiSelect.isSelected}
          />
        </div>
      </div>

      {/* Copy Confirmation Toast */}
      {showCopyConfirmation && lastCopyResult && (
        <CopyConfirmation
          show={showCopyConfirmation}
          success={lastCopyResult.success}
          phoneCount={lastCopyResult.phoneCount}
          errorMessage={lastCopyResult.success ? undefined : lastCopyResult.message}
          onDismiss={() => setShowCopyConfirmation(false)}
        />
      )}
    </>
  );
} 