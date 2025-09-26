import { apiClient } from '../../api-client';
import {
  getUserProfile,
  updateUserProfile,
  getUserAlertHistory,
  submitAlertFeedback,
  getUserAlertFeedback,
  getUnsubscribeInfo,
  processUnsubscribe,
} from '../user-profile';

// Mock the API client
jest.mock('../../api-client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('User Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        parish: 'kingston',
        emailAlerts: true,
        smsAlerts: false,
        emergencyOnly: false,
      };

      mockApiClient.get.mockResolvedValue(mockProfile);

      const result = await getUserProfile('user-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/user-123/profile');
      expect(result).toEqual(mockProfile);
    });

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      await expect(getUserProfile('user-123')).rejects.toThrow('API Error');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockProfile = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        parish: 'kingston',
        emailAlerts: true,
        smsAlerts: false,
        emergencyOnly: false,
      };

      const updateData = { firstName: 'Jane' };
      const updatedProfile = { ...mockProfile, firstName: 'Jane' };

      mockApiClient.put.mockResolvedValue(updatedProfile);

      const result = await updateUserProfile('user-123', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/user-123/profile', updateData);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('getUserAlertHistory', () => {
    it('should fetch alert history with default parameters', async () => {
      const mockHistory = {
        alerts: [
          {
            id: '1',
            type: 'flood',
            severity: 'high',
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

      mockApiClient.get.mockResolvedValue(mockHistory);

      const result = await getUserAlertHistory('user-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/user-123/alerts');
      expect(result).toEqual(mockHistory);
    });

    it('should fetch alert history with filters', async () => {
      const mockHistory = {
        alerts: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockApiClient.get.mockResolvedValue(mockHistory);

      const params = {
        page: 2,
        limit: 10,
        type: 'flood',
        severity: 'high',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const result = await getUserAlertHistory('user-123', params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/users/user-123/alerts?page=2&limit=10&type=flood&severity=high&startDate=2024-01-01&endDate=2024-01-31'
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe('submitAlertFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback = {
        rating: 5,
        comment: 'Very helpful',
        wasAccurate: true,
        wasHelpful: true,
      };

      mockApiClient.post.mockResolvedValue(feedback);

      const result = await submitAlertFeedback('user-123', 'alert-456', feedback);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/users/user-123/alerts/alert-456/feedback',
        feedback
      );
      expect(result).toEqual(feedback);
    });
  });

  describe('getUserAlertFeedback', () => {
    it('should fetch existing feedback', async () => {
      const feedback = {
        rating: 4,
        comment: 'Good alert',
        wasAccurate: true,
        wasHelpful: true,
      };

      mockApiClient.get.mockResolvedValue(feedback);

      const result = await getUserAlertFeedback('user-123', 'alert-456');

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/user-123/alerts/alert-456/feedback');
      expect(result).toEqual(feedback);
    });

    it('should return null for non-existent feedback', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;
      mockApiClient.get.mockRejectedValue(error);

      const result = await getUserAlertFeedback('user-123', 'alert-456');

      expect(result).toBeNull();
    });

    it('should throw for other errors', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;
      mockApiClient.get.mockRejectedValue(error);

      await expect(getUserAlertFeedback('user-123', 'alert-456')).rejects.toThrow('Server error');
    });
  });

  describe('getUnsubscribeInfo', () => {
    it('should fetch unsubscribe info successfully', async () => {
      const info = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        parish: 'kingston',
        emailAlerts: true,
        smsAlerts: false,
        emergencyOnly: false,
        isActive: true,
      };

      mockApiClient.get.mockResolvedValue(info);

      const result = await getUnsubscribeInfo('user-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/user-123/unsubscribe');
      expect(result).toEqual(info);
    });
  });

  describe('processUnsubscribe', () => {
    it('should process partial unsubscribe successfully', async () => {
      const request = {
        action: 'partial' as const,
        reason: 'too_many',
        feedback: 'Too many notifications',
      };

      const response = {
        action: 'partial',
        isActive: true,
        emergencyOnly: true,
        emailAlerts: true,
        smsAlerts: false,
      };

      mockApiClient.post.mockResolvedValue(response);

      const result = await processUnsubscribe('user-123', request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users/user-123/unsubscribe', request);
      expect(result).toEqual(response);
    });

    it('should process complete unsubscribe successfully', async () => {
      const request = {
        action: 'complete' as const,
        reason: 'moving_away',
        feedback: 'Moving to another country',
      };

      const response = {
        action: 'complete',
        isActive: false,
        emergencyOnly: false,
        emailAlerts: false,
        smsAlerts: false,
      };

      mockApiClient.post.mockResolvedValue(response);

      const result = await processUnsubscribe('user-123', request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users/user-123/unsubscribe', request);
      expect(result).toEqual(response);
    });
  });
});