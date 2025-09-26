/**
 * Tests for Auth Service
 */

import { authService } from '../auth';
import { apiClient } from '../../api-client';
import { Parish } from '../../types';

// Mock the API client
jest.mock('../../api-client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call API client with correct data', async () => {
      const mockResponse = {
        userId: '123',
        email: 'test@example.com',
        parish: Parish.KINGSTON,
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        parish: Parish.KINGSTON,
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
      };

      const result = await authService.register(userData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      mockApiClient.post.mockRejectedValueOnce(error);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        parish: Parish.KINGSTON,
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
      };

      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
    });
  });
});