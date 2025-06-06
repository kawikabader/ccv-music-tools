import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useVirtualization,
  useAdaptiveItemHeight,
  useDynamicListHeight,
} from '../hooks/useVirtualization';
import { AdaptiveMusicianList, useAdaptiveMusicianListControls } from '../components/MusicianList/AdaptiveMusicianList';
import { useMusicians } from '../hooks/useMusicians';
import { useAuth, useIsAdmin } from '../utils/authSupabase';
import { NotificationProvider } from '../context/NotificationContext';

// Mock dependencies
vi.mock('../hooks/useMusicians');
vi.mock('../utils/authSupabase');

const mockUseMusicians = vi.mocked(useMusicians);
const mockUseAuth = vi.mocked(useAuth);
const mockUseIsAdmin = vi.mocked(useIsAdmin);

// Mock performance and window APIs
const mockPerformanceNow = vi.fn();
const mockMatchMedia = vi.fn();

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount }: any) => {
    return (
      <div data-testid="virtualized-list">
        {Array.from({ length: Math.min(itemCount, 10) }, (_, index) =>
          children({ index, style: {}, data: itemData })
        )}
      </div>
    );
  },
}));

describe('useVirtualization Hook', () => {
  beforeEach(() => {
    // Mock performance API
    Object.defineProperty(global, 'performance', {
      value: {
        now: mockPerformanceNow,
      },
      writable: true,
    });
    mockPerformanceNow.mockReturnValue(5);

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        hardwareConcurrency: 4,
        userAgent: 'Mozilla/5.0 (desktop)',
      },
      writable: true,
    });

    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useVirtualization(10));

      expect(result.current.config).toMatchObject({
        threshold: 50,
        itemHeight: 120,
        listHeight: 600,
        overscan: 5,
        forceVirtualization: false,
        respectMotionPreference: true,
      });
    });

    it('should not virtualize small datasets', () => {
      const { result } = renderHook(() => useVirtualization(25));
      expect(result.current.shouldVirtualize).toBe(false);
    });

    it('should virtualize large datasets', () => {
      const { result } = renderHook(() => useVirtualization(100));
      expect(result.current.shouldVirtualize).toBe(true);
    });

    it('should respect forceVirtualization setting', () => {
      const { result } = renderHook(() =>
        useVirtualization(10, { forceVirtualization: true })
      );
      expect(result.current.shouldVirtualize).toBe(true);
    });
  });

  describe('Device detection', () => {
    it('should detect low-power mobile devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 2,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
        writable: true,
      });

      const { result } = renderHook(() => useVirtualization(30));
      expect(result.current.metrics.isLowPowerDevice).toBe(true);
      expect(result.current.shouldVirtualize).toBe(true); // Should virtualize on low-power devices
    });

    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const { result } = renderHook(() => useVirtualization(100));
      expect(result.current.shouldVirtualize).toBe(false); // Should not virtualize when reduced motion is preferred
    });

    it('should handle memory-based virtualization', () => {
      const { result } = renderHook(() => useVirtualization(15000)); // Large dataset
      expect(result.current.metrics.memoryUsage).toBeGreaterThan(10);
      expect(result.current.shouldVirtualize).toBe(true);
    });
  });

  describe('Configuration updates', () => {
    it('should update configuration dynamically', () => {
      const { result } = renderHook(() => useVirtualization(50));

      act(() => {
        result.current.updateConfig({ threshold: 25 });
      });

      expect(result.current.config.threshold).toBe(25);
    });

    it('should reevaluate metrics', () => {
      const { result } = renderHook(() => useVirtualization(50));
      const initialRenderTime = result.current.metrics.renderTime;

      mockPerformanceNow.mockReturnValue(10);

      act(() => {
        result.current.reevaluate();
      });

      expect(result.current.metrics.renderTime).not.toBe(initialRenderTime);
    });
  });

  describe('Motion preference monitoring', () => {
    it('should listen for motion preference changes', () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();

      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener,
      });

      const { unmount } = renderHook(() => useVirtualization(100));

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();
      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});

describe('useAdaptiveItemHeight Hook', () => {
  it('should return base height for normal devices', () => {
    const { result } = renderHook(() => useAdaptiveItemHeight(120, false));
    expect(result.current).toBe(120);
  });

  it('should reduce height for low-power devices', () => {
    const { result } = renderHook(() => useAdaptiveItemHeight(120, true));
    expect(result.current).toBe(108); // 120 * 0.9 = 108
  });

  it('should handle custom base heights', () => {
    const { result } = renderHook(() => useAdaptiveItemHeight(150, true));
    expect(result.current).toBe(135); // 150 * 0.9 = 135
  });
});

describe('useDynamicListHeight Hook', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      writable: true,
    });
  });

  it('should calculate height based on viewport', () => {
    const { result } = renderHook(() =>
      useDynamicListHeight(800, 200, 10, 120)
    );
    // Should be min of: contentHeight(1200), viewportHeight*0.6(600), maxHeight(800)
    expect(result.current).toBe(600);
  });

  it('should respect minimum height', () => {
    const { result } = renderHook(() =>
      useDynamicListHeight(800, 200, 1, 120)
    );
    expect(result.current).toBe(200); // Should use minimum height
  });

  it('should limit to content height for small datasets', () => {
    const { result } = renderHook(() =>
      useDynamicListHeight(800, 200, 3, 120)
    );
    expect(result.current).toBe(360); // 3 * 120 = 360
  });
});

describe('AdaptiveMusicianList Component', () => {
  const mockMusicians = Array.from({ length: 75 }, (_, index) => ({
    id: `musician-${index}`,
    name: `Musician ${index}`,
    instrument: 'Guitar',
    phone: '123-456-7890',
  }));

  beforeEach(() => {
    mockUseMusicians.mockReturnValue({
      musicians: mockMusicians,
      loading: false,
      error: null,
      addMusician: vi.fn(),
      updateMusician: vi.fn(),
      deleteMusician: vi.fn(),
      refreshMusicians: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { name: 'Test User', role: 'member' },
      signOut: vi.fn(),
      loading: false,
    } as any);

    mockUseIsAdmin.mockReturnValue(false);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <NotificationProvider>
        {component}
      </NotificationProvider>
    );
  };

  describe('Automatic mode selection', () => {
    it('should render virtualized list for large datasets', () => {
      renderWithProviders(<AdaptiveMusicianList />);

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('should render standard list for small datasets', () => {
      mockUseMusicians.mockReturnValue({
        musicians: mockMusicians.slice(0, 10),
        loading: false,
        error: null,
        addMusician: vi.fn(),
        updateMusician: vi.fn(),
        deleteMusician: vi.fn(),
        refreshMusicians: vi.fn(),
      });

      renderWithProviders(<AdaptiveMusicianList />);

      // Should not have virtualized list
      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    });
  });

  describe('Performance modes', () => {
    it('should force virtualization in performance mode', () => {
      mockUseMusicians.mockReturnValue({
        musicians: mockMusicians.slice(0, 10), // Small dataset
        loading: false,
        error: null,
        addMusician: vi.fn(),
        updateMusician: vi.fn(),
        deleteMusician: vi.fn(),
        refreshMusicians: vi.fn(),
      });

      renderWithProviders(<AdaptiveMusicianList mode="performance" />);

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });

    it('should disable virtualization in accessibility mode', () => {
      renderWithProviders(<AdaptiveMusicianList mode="accessibility" />);

      expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
    });
  });

  describe('Debug information', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should show debug info in development mode for virtualized rendering', () => {
      renderWithProviders(<AdaptiveMusicianList />);

      expect(screen.getByText(/Virtualized Rendering/)).toBeInTheDocument();
      expect(screen.getByText(`${mockMusicians.length} items`)).toBeInTheDocument();
    });

    it('should show debug info in development mode for standard rendering', () => {
      mockUseMusicians.mockReturnValue({
        musicians: mockMusicians.slice(0, 10),
        loading: false,
        error: null,
        addMusician: vi.fn(),
        updateMusician: vi.fn(),
        deleteMusician: vi.fn(),
        refreshMusicians: vi.fn(),
      });

      renderWithProviders(<AdaptiveMusicianList />);

      expect(screen.getByText(/Standard Rendering/)).toBeInTheDocument();
    });
  });

  describe('Props forwarding', () => {
    it('should forward selection props to underlying components', () => {
      const mockToggleSelection = vi.fn();
      const mockIsSelected = vi.fn().mockReturnValue(false);
      const selectedIds = new Set(['musician-1', 'musician-2']);

      renderWithProviders(
        <AdaptiveMusicianList
          selectedIds={selectedIds}
          onToggleSelection={mockToggleSelection}
          isSelected={mockIsSelected}
        />
      );

      // Props should be forwarded to the virtualized component
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    });
  });
});

describe('useAdaptiveMusicianListControls Hook', () => {
  beforeEach(() => {
    mockUseMusicians.mockReturnValue({
      musicians: Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, name: `Musician ${i}` })),
      loading: false,
      error: null,
      addMusician: vi.fn(),
      updateMusician: vi.fn(),
      deleteMusician: vi.fn(),
    } as any);
  });

  it('should provide current strategy information', () => {
    const { result } = renderHook(() => useAdaptiveMusicianListControls());

    expect(result.current.currentStrategy).toBe('virtualized');
    expect(result.current.itemCount).toBe(100);
    expect(result.current.metrics).toBeDefined();
  });

  it('should provide virtualization controls', () => {
    const { result } = renderHook(() => useAdaptiveMusicianListControls());

    expect(typeof result.current.forceVirtualization).toBe('function');
    expect(typeof result.current.disableVirtualization).toBe('function');
    expect(typeof result.current.resetToAuto).toBe('function');
    expect(typeof result.current.setThreshold).toBe('function');
    expect(typeof result.current.reevaluate).toBe('function');
  });

  it('should allow forcing virtualization', () => {
    const { result } = renderHook(() => useAdaptiveMusicianListControls());

    act(() => {
      result.current.forceVirtualization();
    });

    expect(result.current.config.forceVirtualization).toBe(true);
  });

  it('should allow disabling virtualization', () => {
    const { result } = renderHook(() => useAdaptiveMusicianListControls());

    act(() => {
      result.current.disableVirtualization();
    });

    expect(result.current.config.threshold).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should allow setting custom threshold', () => {
    const { result } = renderHook(() => useAdaptiveMusicianListControls());

    act(() => {
      result.current.setThreshold(25);
    });

    expect(result.current.config.threshold).toBe(25);
  });
}); 