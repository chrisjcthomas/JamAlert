import { signIn, signOut, getCurrentUser, getAuthToken, isAuthenticated } from '../auth';
import { apiClient } from '../api-client';

// Mock the apiClient
jest.mock('../api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('Auth Library', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('signIn', () => {
    it('should return null when API fails and credentials do not match hardcoded backdoors', async () => {
      // Mock API failure
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await signIn('random@user.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should NOT return admin user when API fails (Hardcoded creds removed)', async () => {
      (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await signIn('admin@jamalert.jm', 'admin123');

      expect(result).toBeNull();
    });
  });
});
