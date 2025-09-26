/**
 * Tests for API Client utility
 */

import { apiClient, ApiError, NetworkError, getErrorMessage, getValidationErrors } from '../api-client';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockResponse = {
        success: true,
        data: { userId: '123', email: 'test@example.com' },
        message: 'Success',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/auth/register', {
        email: 'test@example.com',
        firstName: 'Test',
      });

      expect(result).toEqual(mockResponse.data);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7071/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            firstName: 'Test',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Validation failed',
        data: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'firstName', message: 'First name is required' },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(mockResponse),
      });

      try {
        await apiClient.post('/auth/register', {});
        fail('Expected ApiError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).validationErrors).toEqual(mockResponse.data);
      }
    });

    it('should handle server errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Internal server error',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(mockResponse),
      });

      await expect(apiClient.post('/auth/register', {})).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.post('/auth/register', {})).rejects.toThrow(NetworkError);
    });
  });

  describe('Error handling utilities', () => {
    it('should extract error message from ApiError', () => {
      const error = new ApiError('Test error', 400);
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should extract validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Name required' },
      ];
      const error = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', validationErrors);
      
      const result = getValidationErrors(error);
      expect(result).toEqual({
        email: 'Invalid email',
        name: 'Name required',
      });
    });

    it('should return first validation error as main message', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'name', message: 'Name required' },
      ];
      const error = new ApiError('Validation failed', 400, 'VALIDATION_ERROR', validationErrors);
      
      expect(getErrorMessage(error)).toBe('Invalid email');
    });
  });
});