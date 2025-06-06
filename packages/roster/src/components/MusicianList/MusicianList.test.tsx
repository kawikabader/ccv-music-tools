import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MusicianList } from './MusicianList';
import { useMusicians } from '../../hooks/useMusicians';
import { useAuth, useIsAdmin } from '../../utils/authSupabase';
import { NotificationProvider } from '../../context/NotificationContext';

// Mock dependencies
vi.mock('../../hooks/useMusicians');
vi.mock('../../utils/authSupabase');
vi.mock('../../assets/a.png', () => ({ default: 'mock-logo.png' }));

const mockUseMusicians = vi.mocked(useMusicians);
const mockUseAuth = vi.mocked(useAuth);
const mockUseIsAdmin = vi.mocked(useIsAdmin);

const mockMusicians = [
  {
    id: '1',
    name: 'John Doe',
    instrument: 'Guitar',
    phone: '123-456-7890',
  },
  {
    id: '2',
    name: 'Jane Smith',
    instrument: 'Piano',
    phone: '234-567-8901',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    instrument: 'Drums',
    phone: '345-678-9012',
  },
];

const defaultMockProps = {
  selectedIds: new Set<string>(),
  onToggleSelection: vi.fn(),
  isSelected: vi.fn().mockReturnValue(false),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      {component}
    </NotificationProvider>
  );
};

describe('MusicianList - Keyboard Navigation', () => {
  beforeEach(() => {
    mockUseMusicians.mockReturnValue({
      musicians: mockMusicians,
      loading: false,
      error: null,
      addMusician: vi.fn(),
      updateMusician: vi.fn(),
      deleteMusician: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { name: 'Test User', role: 'member' },
      signOut: vi.fn(),
      loading: false,
    } as any);

    mockUseIsAdmin.mockReturnValue(false);

    vi.clearAllMocks();
  });

  describe('Space and Enter key navigation', () => {
    it('should toggle selection when Space key is pressed', async () => {
      const mockToggleSelection = jest.fn();
      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          onToggleSelection={mockToggleSelection}
        />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      firstMusician.focus();

      await userEvent.keyboard(' ');

      expect(mockToggleSelection).toHaveBeenCalledWith('1');
    });

    it('should toggle selection when Enter key is pressed', async () => {
      const mockToggleSelection = jest.fn();
      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          onToggleSelection={mockToggleSelection}
        />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      firstMusician.focus();

      await userEvent.keyboard('{Enter}');

      expect(mockToggleSelection).toHaveBeenCalledWith('1');
    });

    it('should prevent default behavior for Space and Enter keys', async () => {
      const mockToggleSelection = jest.fn();
      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          onToggleSelection={mockToggleSelection}
        />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const preventDefaultSpy = jest.fn();

      fireEvent.keyDown(firstMusician, {
        key: ' ',
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();

      fireEvent.keyDown(firstMusician, {
        key: 'Enter',
        preventDefault: preventDefaultSpy,
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Arrow key navigation', () => {
    it('should focus next musician when ArrowDown is pressed', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const secondMusician = screen.getByLabelText(/Jane Smith/);

      firstMusician.focus();
      await userEvent.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(secondMusician).toHaveFocus();
      });
    });

    it('should focus previous musician when ArrowUp is pressed', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const secondMusician = screen.getByLabelText(/Jane Smith/);

      secondMusician.focus();
      await userEvent.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(firstMusician).toHaveFocus();
      });
    });

    it('should not move focus beyond first item when ArrowUp is pressed on first item', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);

      firstMusician.focus();
      await userEvent.keyboard('{ArrowUp}');

      expect(firstMusician).toHaveFocus();
    });

    it('should not move focus beyond last item when ArrowDown is pressed on last item', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const lastMusician = screen.getByLabelText(/Bob Wilson/);

      lastMusician.focus();
      await userEvent.keyboard('{ArrowDown}');

      expect(lastMusician).toHaveFocus();
    });
  });

  describe('Home and End key navigation', () => {
    it('should focus first musician when Home key is pressed', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const lastMusician = screen.getByLabelText(/Bob Wilson/);

      lastMusician.focus();
      await userEvent.keyboard('{Home}');

      await waitFor(() => {
        expect(firstMusician).toHaveFocus();
      });
    });

    it('should focus last musician when End key is pressed', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const lastMusician = screen.getByLabelText(/Bob Wilson/);

      firstMusician.focus();
      await userEvent.keyboard('{End}');

      await waitFor(() => {
        expect(lastMusician).toHaveFocus();
      });
    });
  });

  describe('Accessibility attributes', () => {
    it('should have proper ARIA attributes for selection state', () => {
      const mockIsSelected = jest.fn().mockImplementation((id) => id === '1');
      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          isSelected={mockIsSelected}
        />
      );

      const selectedMusician = screen.getByLabelText(/John Doe/);
      const unselectedMusician = screen.getByLabelText(/Jane Smith/);

      expect(selectedMusician).toHaveAttribute('aria-pressed', 'true');
      expect(unselectedMusician).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper role and tabindex for keyboard navigation', () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const musicians = screen.getAllByRole('button');
      musicians.forEach((musician) => {
        expect(musician).toHaveAttribute('tabIndex', '0');
        expect(musician).toHaveAttribute('role', 'button');
      });
    });

    it('should have descriptive aria-label with keyboard instructions', () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      expect(firstMusician).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Use arrow keys to navigate, space or enter to toggle selection')
      );
    });

    it('should have proper data attributes for keyboard navigation targeting', () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const musicians = screen.getAllByRole('button');
      musicians.forEach((musician, index) => {
        expect(musician).toHaveAttribute('data-musician-index', index.toString());
      });
    });
  });

  describe('Integration with selection system', () => {
    it('should work correctly with selection state management', async () => {
      const mockToggleSelection = jest.fn();
      const mockIsSelected = jest.fn().mockImplementation((id) => id === '1');

      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          onToggleSelection={mockToggleSelection}
          isSelected={mockIsSelected}
        />
      );

      const firstMusician = screen.getByLabelText(/John Doe/);
      const secondMusician = screen.getByLabelText(/Jane Smith/);

      // Test keyboard selection
      firstMusician.focus();
      await userEvent.keyboard(' ');
      expect(mockToggleSelection).toHaveBeenCalledWith('1');

      // Test navigation and selection
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(secondMusician).toHaveFocus();
      });

      await userEvent.keyboard('{Enter}');
      expect(mockToggleSelection).toHaveBeenCalledWith('2');
    });

    it('should maintain visual selection indicators during keyboard navigation', () => {
      const mockIsSelected = jest.fn().mockImplementation((id) => id === '1');
      renderWithProviders(
        <MusicianList
          {...defaultMockProps}
          isSelected={mockIsSelected}
        />
      );

      const selectedMusician = screen.getByLabelText(/John Doe/);
      expect(selectedMusician).toHaveClass('ring-2', 'ring-indigo-500', 'bg-indigo-50');

      // Check for checkmark icon
      const checkmark = selectedMusician.querySelector('svg');
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe('Search functionality interaction', () => {
    it('should maintain keyboard navigation when search filters results', async () => {
      renderWithProviders(
        <MusicianList {...defaultMockProps} />
      );

      const searchInput = screen.getByPlaceholderText('Search musicians...');
      await userEvent.type(searchInput, 'Jane');

      // Only Jane Smith should be visible
      expect(screen.getByLabelText(/Jane Smith/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/John Doe/)).not.toBeInTheDocument();

      // Keyboard navigation should still work
      const visibleMusician = screen.getByLabelText(/Jane Smith/);
      visibleMusician.focus();
      await userEvent.keyboard(' ');

      expect(defaultMockProps.onToggleSelection).toHaveBeenCalledWith('2');
    });
  });
}); 