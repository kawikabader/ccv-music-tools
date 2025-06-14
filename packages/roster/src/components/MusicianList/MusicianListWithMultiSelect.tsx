import React, { useEffect, useState } from 'react';
import { MusicianList } from './MusicianList';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import { usePhoneClipboard } from '../../hooks/usePhoneClipboard';
import { useMusicians } from '../../hooks/useMusicians';
import { ClipboardToast, useClipboardToast } from '../UI/ClipboardToast';
import type { Musician } from '../../types/supabase';


/**
 * Enhanced MusicianList component with multi-select and phone clipboard functionality
 */
export function MusicianListWithMultiSelect() {
  const { musicians, loading, error } = useMusicians();
  const multiSelect = useMultiSelect();
  const clipboardToast = useClipboardToast();
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Phone clipboard functionality without built-in toast (we handle it separately)
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

  // Handle manual copy action with manual toast notifications
  const handleCopyPhoneNumbers = async () => {
    if (multiSelect.selectedCount === 0) {
      clipboardToast.showCopyError('No musicians selected', 'Please select some musicians first');
      return;
    }

    if (phoneClipboard.phoneStats.validPhones === 0) {
      clipboardToast.showCopyError('No valid phone numbers', 'Selected musicians don\'t have valid phone numbers');
      return;
    }

    // Show loading toast
    clipboardToast.showCopyLoading();

    const result = await phoneClipboard.copyPhoneNumbers();

    // Show result toast
    if (result.success) {
      clipboardToast.showCopySuccess(result.phoneCount, phoneClipboard.formattedPhoneNumbers);

      // Start fade out animation, then clear selection
      setIsFadingOut(true);
      setTimeout(() => {
        multiSelect.clearSelection();
        setIsFadingOut(false);
      }, 300); // 300ms fade duration
    } else {
      clipboardToast.showCopyError('Copy failed', result.message);
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    multiSelect.clearSelection();
  };

  // Handle loading and error states at the top level to prevent duplicate data fetching
  if (loading) {
    return <div className="text-center p-4">Loading musicians...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <>
      <div className="relative">
        {/* Selection Summary Bar - Mobile Optimized */}
        {multiSelect.selectedCount > 0 && (
          <div className={`fixed bottom-0 left-0 right-0 z-50 bg-indigo-600 text-white shadow-lg transition-opacity duration-300 ease-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
              {/* Mobile Layout - Stacked */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-white text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {multiSelect.selectedCount}
                    </div>
                    <span className="font-medium text-sm">
                      {multiSelect.selectedCount} selected
                    </span>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 text-xs text-indigo-200 hover:text-white hover:bg-indigo-700 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {/* Phone stats - mobile */}
                <div className="mb-2 text-xs opacity-90">
                  {phoneClipboard.phoneStats.validPhones > 0 && (
                    <span>
                      {phoneClipboard.phoneStats.validPhones} valid number{phoneClipboard.phoneStats.validPhones !== 1 ? 's' : ''}
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

                {/* Copy button - mobile full width */}
                <button
                  onClick={handleCopyPhoneNumbers}
                  disabled={phoneClipboard.phoneStats.validPhones === 0}
                  className="w-full py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  📱 Copy Phone Numbers
                </button>
              </div>

              {/* Desktop Layout - Side by side */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {multiSelect.selectedCount}
                    </div>
                    <span className="font-medium">
                      {multiSelect.selectedCount} musician{multiSelect.selectedCount !== 1 ? 's' : ''} selected
                    </span>
                  </div>

                  {/* Phone number stats - desktop */}
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
                    📱 Copy Phone Numbers
                  </button>
                </div>
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

      {/* ClipboardToast for copy notifications */}
      <ClipboardToast
        isVisible={clipboardToast.isVisible}
        onDismiss={clipboardToast.hideToast}
        type={clipboardToast.props.type || 'success'}
        message={clipboardToast.props.message || ''}
        subtitle={clipboardToast.props.subtitle}
        progress={clipboardToast.props.progress}
        duration={clipboardToast.props.duration}
        position={clipboardToast.props.position}
        animation={clipboardToast.props.animation}
      />
    </>
  );
} 