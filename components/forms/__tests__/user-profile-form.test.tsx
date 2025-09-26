import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileForm } from '../user-profile-form';
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

describe('UserProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', async () => {
    // Mock a delayed response to test loading state
    mockUserProfileApi.getUserProfile.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        firstName: '',
        lastName: '',
        email: '',
        parish: '',
        emailAlerts: true,
        smsAlerts: false,
        emergencyOnly: false,
        accessibilitySettings: {
          highContrast: false,
          largeFont: false,
          textToSpeech: false,
          fontSize: 'medium' as const,
          colorScheme: 'default' as const,
          reduceMotion: false,
          screenReaderOptimized: false,
        },
      }), 100))
    );
    
    render(<UserProfileForm />);
    
    // Initially should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeDefined();
    });
  });

  it('should load and display user profile data', async () => {
    const mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      parish: 'kingston',
      address: '123 Main St',
      emailAlerts: true,
      smsAlerts: false,
      emergencyOnly: false,
      accessibilitySettings: {
        highContrast: false,
        largeFont: false,
        textToSpeech: false,
        fontSize: 'medium' as const,
        colorScheme: 'default' as const,
        reduceMotion: false,
        screenReaderOptimized: false,
      },
    };

    mockUserProfileApi.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeDefined();
      expect(screen.getByDisplayValue('Doe')).toBeDefined();
      expect(screen.getByDisplayValue('john@example.com')).toBeDefined();
    });
  });

  it('should handle form submission', async () => {
    const mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      parish: 'kingston',
      address: '123 Main St',
      emailAlerts: true,
      smsAlerts: false,
      emergencyOnly: false,
      accessibilitySettings: {
        highContrast: false,
        largeFont: false,
        textToSpeech: false,
        fontSize: 'medium' as const,
        colorScheme: 'default' as const,
        reduceMotion: false,
        screenReaderOptimized: false,
      },
    };

    mockUserProfileApi.getUserProfile.mockResolvedValue(mockProfile);
    mockUserProfileApi.updateUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfileForm />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeDefined();
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUserProfileApi.updateUserProfile).toHaveBeenCalledWith('mock-user-id', mockProfile);
    });
  });

  it('should handle API errors gracefully', async () => {
    mockUserProfileApi.getUserProfile.mockRejectedValue(new Error('API Error'));

    render(<UserProfileForm />);

    await waitFor(() => {
      // Should not crash and should show some content
      expect(screen.getByText('Personal Information')).toBeDefined();
    });
  });
});