import { HttpRequest, InvocationContext } from '@azure/functions';
import { alertsRetry } from '../alerts-retry';
import { AlertService } from '../../services/alert.service';
import { authenticateAdmin } from '../../middleware/auth.middleware';
import { AlertType, Severity, Parish } from '../../types';

// Mock dependencies
jest.mock('../../services/alert.service');
jest.mock('../../middleware/auth.middleware');

const mockAlertService = {
  getAlertById: jest.fn(),
  retryAlertDelivery: jest.fn(),
  close: jest.fn()
};

const mockAdmin = {
  id: 'admin1',
  email: 'admin@jamalert.com',
  name: 'Test Admin',
  role: 'ADMIN' as const,
  isActive: true
};

(AlertService as jest.MockedClass<typeof AlertService>).mockImplementation(() => mockAlertService as any);
(authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);

describe('alerts-retry function', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      log: jest.fn() as any
    };

    mockRequest = {
      method: 'POST',
      params: { alertId: '550e8400-e29b-41d4-a716-446655440000' },
      url: 'https://test.com/api/alerts/retry/550e8400-e29b-41d4-a716-446655440000'
    };
  });

  describe('authentication', () => {
    it('should return 401 when admin authentication fails', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(null);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(401);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
    });

    it('should return 405 for non-POST requests', async () => {
      mockRequest.method = 'GET';

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(405);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Method not allowed'
      });
    });

    it('should return 400 when alert ID is missing', async () => {
      mockRequest.params = {};

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Alert ID is required'
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      mockRequest.params = { alertId: 'invalid-uuid' };

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Invalid alert ID format'
      });
    });
  });

  describe('alert validation', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should return 404 when alert not found', async () => {
      mockAlertService.getAlertById.mockResolvedValue(null);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(404);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Alert not found'
      });
    });

    it('should return 400 when no failed deliveries exist', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'Test message',
        parishes: [Parish.KINGSTON],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'COMPLETED',
        recipientCount: 10,
        deliveredCount: 10,
        failedCount: 0,
        deliveryStats: {
          total: 10,
          delivered: 10,
          failed: 0, // No failed deliveries
          pending: 0
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'No failed deliveries to retry for this alert'
      });
    });

    it('should handle alert without delivery stats', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'Test message',
        parishes: [Parish.KINGSTON],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'PENDING',
        recipientCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        deliveryStats: null // No delivery stats
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.error).toBe('No failed deliveries to retry for this alert');
    });
  });

  describe('retry functionality', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should retry failed deliveries successfully', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Flash Flood Warning',
        message: 'Immediate evacuation required.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'FAILED',
        recipientCount: 100,
        deliveredCount: 85,
        failedCount: 15,
        deliveryStats: {
          total: 100,
          delivered: 85,
          failed: 15, // Has failed deliveries to retry
          pending: 0
        }
      };

      const mockRetryResult = {
        totalRecipients: 15,
        successCount: 12,
        failureCount: 3,
        results: [],
        deliveryStats: {
          email: { sent: 12, failed: 3 },
          sms: { sent: 8, failed: 2 },
          push: { sent: 10, failed: 1 }
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);
      mockAlertService.retryAlertDelivery.mockResolvedValue(mockRetryResult);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.success).toBe(true);
      expect(response.jsonBody.data.alertId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(response.jsonBody.data.retryResult).toEqual({
        totalRetried: 15,
        successCount: 12,
        failureCount: 3,
        deliveryStats: mockRetryResult.deliveryStats
      });
      expect(response.jsonBody.message).toBe('Retry completed: 12 successful, 3 failed');

      expect(mockAlertService.retryAlertDelivery).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle complete retry success', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.WEATHER,
        severity: Severity.MEDIUM,
        title: 'Weather Advisory',
        message: 'Heavy rainfall expected.',
        parishes: [Parish.ST_MARY],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'FAILED',
        recipientCount: 50,
        deliveredCount: 45,
        failedCount: 5,
        deliveryStats: {
          total: 50,
          delivered: 45,
          failed: 5,
          pending: 0
        }
      };

      const mockRetryResult = {
        totalRecipients: 5,
        successCount: 5,
        failureCount: 0, // All retries successful
        results: [],
        deliveryStats: {
          email: { sent: 5, failed: 0 },
          sms: { sent: 3, failed: 0 },
          push: { sent: 5, failed: 0 }
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);
      mockAlertService.retryAlertDelivery.mockResolvedValue(mockRetryResult);

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.data.retryResult.failureCount).toBe(0);
      expect(response.jsonBody.message).toBe('Retry completed: 5 successful, 0 failed');
    });

    it('should handle retry service errors', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.EMERGENCY,
        severity: Severity.HIGH,
        title: 'Emergency Alert',
        message: 'Critical situation.',
        parishes: [Parish.KINGSTON],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'FAILED',
        recipientCount: 20,
        deliveredCount: 15,
        failedCount: 5,
        deliveryStats: {
          total: 20,
          delivered: 15,
          failed: 5,
          pending: 0
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);
      mockAlertService.retryAlertDelivery.mockRejectedValue(new Error('Notification service unavailable'));

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody.success).toBe(false);
      expect(response.jsonBody.error).toBe('Failed to retry alert deliveries');
      expect(response.jsonBody.details).toBe('Notification service unavailable');
    });
  });

  describe('service cleanup', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should close service on successful retry', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        deliveryStats: { failed: 5 }
      };

      const mockRetryResult = {
        totalRecipients: 5,
        successCount: 5,
        failureCount: 0,
        deliveryStats: { email: { sent: 5, failed: 0 }, sms: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 } }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);
      mockAlertService.retryAlertDelivery.mockResolvedValue(mockRetryResult);

      await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockAlertService.close).toHaveBeenCalled();
    });

    it('should close service on error', async () => {
      mockAlertService.getAlertById.mockRejectedValue(new Error('Database error'));

      await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockAlertService.close).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should log retry attempts', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        deliveryStats: { failed: 3 }
      };

      const mockRetryResult = {
        totalRecipients: 3,
        successCount: 2,
        failureCount: 1,
        deliveryStats: { email: { sent: 2, failed: 1 }, sms: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 } }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);
      mockAlertService.retryAlertDelivery.mockResolvedValue(mockRetryResult);

      await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockContext.log).toHaveBeenCalledWith('Alert retry function triggered');
      expect(mockContext.log).toHaveBeenCalledWith(
        'Retrying failed deliveries for alert ID: 550e8400-e29b-41d4-a716-446655440000'
      );
      expect(mockContext.log).toHaveBeenCalledWith(
        'Alert retry completed. Success: 2, Failed: 1'
      );
    });

    it('should log errors', async () => {
      mockAlertService.getAlertById.mockRejectedValue(new Error('Service error'));

      await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Failed to retry alert deliveries:',
        expect.any(Error)
      );
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      (authenticateAdmin as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await alertsRetry(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});