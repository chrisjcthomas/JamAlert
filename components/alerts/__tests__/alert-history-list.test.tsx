import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertHistoryList } from '../alert-history-list';
import * as userProfileApi from '@/lib/api/user-profile';

// Mock the API
jest.mock('@/lib/api/user-profile');
const mockUserProfileApi = userProfileApi as jest.Mocked<typeof userProfileApi>;

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('AlertHistoryList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    // Mock a delayed response to test loading state
    mockUserProfileApi.getUserAlertHistory.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        alerts: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }), 100))
    );
    
    render(<AlertHistoryList />);
    
    // Initially should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Filter Alerts')).toBeDefined();
    });
  });

  it('should load and display alert history', async () => {
    const mockAlerts = {
      alerts: [
        {
          id: '1',
          type: 'flood' as const,
          severity: 'high' as const,
          title: 'Flood Warning',
          message: 'Heavy rainfall expected',
          createdAt: '2024-01-01T10:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    mockUserProfileApi.getUserAlertHistory.mockResolvedValue(mockAlerts);

    render(<AlertHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('Flood Warning')).toBeDefined();
      expect(screen.getByText('Heavy rainfall expected')).toBeDefined();
    });
  });

  it('should handle empty alert history', async () => {
    const mockAlerts = {
      alerts: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    mockUserProfileApi.getUserAlertHistory.mockResolvedValue(mockAlerts);

    render(<AlertHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('No alerts found')).toBeDefined();
    });
  });

  it('should handle API errors gracefully', async () => {
    mockUserProfileApi.getUserAlertHistory.mockRejectedValue(new Error('API Error'));

    render(<AlertHistoryList />);

    await waitFor(() => {
      // Should not crash and should show some content
      expect(screen.getByText('Filter Alerts')).toBeDefined();
    });
  });

  it('should handle search filtering', async () => {
    const mockAlerts = {
      alerts: [
        {
          id: '1',
          type: 'flood' as const,
          severity: 'high' as const,
          title: 'Flood Warning',
          message: 'Heavy rainfall expected',
          createdAt: '2024-01-01T10:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    mockUserProfileApi.getUserAlertHistory.mockResolvedValue(mockAlerts);

    render(<AlertHistoryList />);

    await waitFor(() => {
      expect(screen.getByText('Flood Warning')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Search alerts...');
    fireEvent.change(searchInput, { target: { value: 'flood' } });

    // Wait a bit for the search to take effect
    await waitFor(() => {
      expect(screen.getByText('Flood Warning')).toBeDefined();
    });

    fireEvent.change(searchInput, { target: { value: 'earthquake' } });

    await waitFor(() => {
      expect(screen.queryByText('Flood Warning')).toBeNull();
    });
  });
});