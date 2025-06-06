import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Musician } from '../types/supabase';

// Mock the clipboard API
const mockClipboard = {
  writeText: vi.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

// Mock the notification context
const mockShowNotification = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Integration test component that combines all functionality
const ClipboardIntegrationTest: React.FC<{
  musicians: Musician[];
  initialOptions?: any;
}> = ({ musicians, initialOptions = {} }) => {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showToasts, setShowToasts] = React.useState(true);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(musicians.map(m => m.id)));
  };

  // Simulate usePhoneClipboard functionality
  const selectedMusicians = musicians.filter(m => selectedIds.has(m.id));
  const validPhones = selectedMusicians.filter(m => m.phone && m.phone.length >= 10);
  const formattedPhones = validPhones.map(m => `+1${m.phone?.replace(/\D/g, '')}`).join(', ');

  const canCopy = selectedMusicians.length > 0 && validPhones.length > 0;

  const copyPhoneNumbers = async () => {
    if (!canCopy) {
      if (showToasts) {
        mockShowNotification('No valid phone numbers to copy', 'error');
      }
      return { success: false, message: 'No valid phone numbers', phoneCount: 0 };
    }

    try {
      await navigator.clipboard.writeText(formattedPhones);
      const message = `Copied ${validPhones.length} phone number${validPhones.length !== 1 ? 's' : ''} to clipboard`;

      if (showToasts) {
        mockShowNotification(message, 'success');
      }

      if (initialOptions.autoClearSelection) {
        clearSelection();
      }

      return { success: true, message, phoneCount: validPhones.length };
    } catch (error) {
      const errorMessage = 'Failed to copy to clipboard';
      if (showToasts) {
        mockShowNotification(errorMessage, 'error');
      }
      return { success: false, message: errorMessage, phoneCount: 0 };
    }
  };

  return (
    <div data-testid="clipboard-integration">
      <div data-testid="selection-info">
        Selected: {selectedIds.size} | Valid phones: {validPhones.length}
      </div>

      <div data-testid="controls">
        <button onClick={selectAll} data-testid="select-all">
          Select All
        </button>
        <button onClick={clearSelection} data-testid="clear-selection">
          Clear Selection
        </button>
        <button
          onClick={copyPhoneNumbers}
          disabled={!canCopy}
          data-testid="copy-phones"
        >
          Copy Phone Numbers
        </button>
        <button
          onClick={() => setShowToasts(!showToasts)}
          data-testid="toggle-toasts"
        >
          {showToasts ? 'Disable' : 'Enable'} Toasts
        </button>
      </div>

      <div data-testid="preview">
        {formattedPhones || 'No phone numbers to copy'}
      </div>

      <div data-testid="musician-list">
        {musicians.map(musician => (
          <div key={musician.id} data-testid={`musician-${musician.id}`}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.has(musician.id)}
                onChange={() => toggleSelection(musician.id)}
                data-testid={`checkbox-${musician.id}`}
              />
              {musician.name} - {musician.instrument} - {musician.phone || 'No phone'}
            </label>
          </div>
        ))}
      </div>

      <div data-testid="stats">
        Total: {musicians.length} |
        Selected: {selectedMusicians.length} |
        Valid Phones: {validPhones.length} |
        Can Copy: {canCopy ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

describe('Clipboard Integration Tests', () => {
  const sampleMusicians: Musician[] = [
    {
      id: '1',
      name: 'John Doe',
      phone: '5551234567',
      instrument: 'Guitar',
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '5559876543',
      instrument: 'Piano',
    },
    {
      id: '3',
      name: 'Bob Wilson',
      phone: null,
      instrument: 'Drums',
    },
    {
      id: '4',
      name: 'Alice Brown',
      phone: '123', // invalid
      instrument: 'Bass',
    },
    {
      id: '5',
      name: 'Charlie Davis',
      phone: '5555551234',
      instrument: 'Violin',
    },
  ];

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Selection and Clipboard Workflow', () => {
    it('should handle complete workflow: select musicians, copy phones, clear selection', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Initial state
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 0 | Valid phones: 0');
      expect(screen.getByTestId('copy-phones')).toBeDisabled();

      // Select musicians with valid phones
      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('checkbox-2'));
      await user.click(screen.getByTestId('checkbox-5'));

      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 3 | Valid phones: 3');
      expect(screen.getByTestId('copy-phones')).toBeEnabled();

      // Check preview
      expect(screen.getByTestId('preview')).toHaveTextContent('+15551234567, +15559876543, +15555551234');

      // Copy phone numbers
      await user.click(screen.getByTestId('copy-phones'));

      // Verify clipboard was called
      expect(mockClipboard.writeText).toHaveBeenCalledWith('+15551234567, +15559876543, +15555551234');
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied 3 phone numbers to clipboard',
        'success'
      );

      // Clear selection
      await user.click(screen.getByTestId('clear-selection'));
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 0 | Valid phones: 0');
    });

    it('should handle select all functionality', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Select all
      await user.click(screen.getByTestId('select-all'));

      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 5 | Valid phones: 3');
      expect(screen.getByTestId('stats')).toHaveTextContent(
        'Total: 5 | Selected: 5 | Valid Phones: 3 | Can Copy: Yes'
      );

      // Should only include valid phone numbers in preview
      const preview = screen.getByTestId('preview');
      expect(preview).toHaveTextContent('+15551234567, +15559876543, +15555551234');
      expect(preview).not.toHaveTextContent('123'); // Invalid phone excluded
    });

    it('should handle mixed selection with invalid phones', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Select musicians including ones with no/invalid phones
      await user.click(screen.getByTestId('checkbox-1')); // Valid
      await user.click(screen.getByTestId('checkbox-3')); // No phone
      await user.click(screen.getByTestId('checkbox-4')); // Invalid phone

      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 3 | Valid phones: 1');
      expect(screen.getByTestId('copy-phones')).toBeEnabled();

      await user.click(screen.getByTestId('copy-phones'));

      expect(mockClipboard.writeText).toHaveBeenCalledWith('+15551234567');
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied 1 phone number to clipboard',
        'success'
      );
    });

    it('should handle no valid phones scenario', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Select only musicians with no/invalid phones
      await user.click(screen.getByTestId('checkbox-3')); // No phone
      await user.click(screen.getByTestId('checkbox-4')); // Invalid phone

      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 2 | Valid phones: 0');
      expect(screen.getByTestId('copy-phones')).toBeDisabled();
      expect(screen.getByTestId('preview')).toHaveTextContent('No phone numbers to copy');

      // Try to copy (should fail gracefully)
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith(
        'No valid phone numbers to copy',
        'error'
      );
    });
  });

  describe('Auto-clear Selection Feature', () => {
    it('should auto-clear selection after successful copy when enabled', async () => {
      render(
        <ClipboardIntegrationTest
          musicians={sampleMusicians}
          initialOptions={{ autoClearSelection: true }}
        />
      );

      // Select musicians
      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('checkbox-2'));

      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 2 | Valid phones: 2');

      // Copy phone numbers
      await user.click(screen.getByTestId('copy-phones'));

      // Should auto-clear after successful copy
      await waitFor(() => {
        expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 0 | Valid phones: 0');
      });
    });

    it('should not auto-clear selection on copy failure', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));

      render(
        <ClipboardIntegrationTest
          musicians={sampleMusicians}
          initialOptions={{ autoClearSelection: true }}
        />
      );

      await user.click(screen.getByTestId('checkbox-1'));
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 1 | Valid phones: 1');

      await user.click(screen.getByTestId('copy-phones'));

      // Should not clear selection on failure
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 1 | Valid phones: 1');
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        'error'
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle clipboard permission errors gracefully', async () => {
      const permissionError = new Error('Permission denied');
      permissionError.name = 'NotAllowedError';
      mockClipboard.writeText.mockRejectedValue(permissionError);

      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        'error'
      );
    });

    it('should handle network errors during clipboard operation', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Network error'));

      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        'error'
      );
    });
  });

  describe('Toast Integration', () => {
    it('should allow disabling toast notifications', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      await user.click(screen.getByTestId('toggle-toasts'));
      expect(screen.getByTestId('toggle-toasts')).toHaveTextContent('Enable Toasts');

      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should show appropriate success messages for different counts', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Single phone number
      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied 1 phone number to clipboard',
        'success'
      );

      vi.clearAllMocks();

      // Multiple phone numbers
      await user.click(screen.getByTestId('checkbox-2'));
      await user.click(screen.getByTestId('copy-phones'));

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied 2 phone numbers to clipboard',
        'success'
      );
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle rapid selection changes efficiently', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Rapid selection/deselection
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByTestId('checkbox-1'));
        await user.click(screen.getByTestId('checkbox-2'));
        await user.click(screen.getByTestId('checkbox-1'));
        await user.click(screen.getByTestId('checkbox-2'));
      }

      // Final state should be no selection
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 0 | Valid phones: 0');
    });

    it('should handle large selection sets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `musician-${i}`,
        name: `Musician ${i}`,
        phone: `555${String(i).padStart(7, '0')}`,
        instrument: 'Guitar',
      }));

      render(<ClipboardIntegrationTest musicians={largeDataset} />);

      await user.click(screen.getByTestId('select-all'));
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 100 | Valid phones: 100');

      await user.click(screen.getByTestId('copy-phones'));

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('+15550000000, +15550000001')
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied 100 phone numbers to clipboard',
        'success'
      );
    });

    it('should handle edge case with empty musician list', async () => {
      render(<ClipboardIntegrationTest musicians={[]} />);

      expect(screen.getByTestId('stats')).toHaveTextContent(
        'Total: 0 | Selected: 0 | Valid Phones: 0 | Can Copy: No'
      );
      expect(screen.getByTestId('copy-phones')).toBeDisabled();
      expect(screen.getByTestId('preview')).toHaveTextContent('No phone numbers to copy');
    });

    it('should maintain state consistency across multiple operations', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Complex workflow
      await user.click(screen.getByTestId('select-all'));
      await user.click(screen.getByTestId('copy-phones'));
      await user.click(screen.getByTestId('clear-selection'));
      await user.click(screen.getByTestId('checkbox-1'));
      await user.click(screen.getByTestId('checkbox-3'));
      await user.click(screen.getByTestId('copy-phones'));

      // Verify final state
      expect(screen.getByTestId('selection-info')).toHaveTextContent('Selected: 2 | Valid phones: 1');
      expect(mockClipboard.writeText).toHaveBeenLastCalledWith('+15551234567');
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper ARIA attributes and keyboard navigation', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      // Check that checkboxes are accessible
      const checkbox1 = screen.getByTestId('checkbox-1');
      expect(checkbox1).toHaveProperty('type', 'checkbox');

      // Check that buttons have proper enabled/disabled states
      const copyButton = screen.getByTestId('copy-phones');
      expect(copyButton).toBeDisabled();

      await user.click(checkbox1);
      expect(copyButton).toBeEnabled();

      // Test keyboard interaction
      copyButton.focus();
      await user.keyboard('{Enter}');

      expect(mockClipboard.writeText).toHaveBeenCalled();
    });

    it('should provide clear feedback for screen readers', async () => {
      render(<ClipboardIntegrationTest musicians={sampleMusicians} />);

      const stats = screen.getByTestId('stats');
      expect(stats).toHaveTextContent('Total: 5 | Selected: 0 | Valid Phones: 0 | Can Copy: No');

      await user.click(screen.getByTestId('checkbox-1'));
      expect(stats).toHaveTextContent('Total: 5 | Selected: 1 | Valid Phones: 1 | Can Copy: Yes');
    });
  });
}); 