import { HttpRequest, InvocationContext } from '@azure/functions';
import { alertsStatus } from '../alerts-status';
import { AlertService } from '../../services/alert.service';
import { authenticateAdmin } from '../../middleware/auth.middleware';
import { AlertType, Severity, Parish } from '../../types';

// Mock dependencies
jest.mock('../../services/alert.service');
jest.mock('../../middleware/auth.middleware');

const mockAlertService = {
  getAlertById: jest.fn(),
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

describe('alerts-status function', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      log: jest.fn() as any
    };

    mockRequest = {
      method: 'GET',
      params: { alertId: 'valid-uuid-alert-id' },
      url: 'https://test.com/api/alerts/status/valid-uuid-alert-id'
    };
  });

  describe('authentication', () => {
    it('should return 401 when admin authentication fails', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(null);

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

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

    it('should return 405 for non-GET requests', async () => {
      mockRequest.method = 'POST';

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(405);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Method not allowed'
      });
    });

    it('should return 400 when alert ID is missing', async () => {
      mockRequest.params = {};

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Alert ID is required'
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      mockRequest.params = { alertId: 'invalid-uuid' };

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Invalid alert ID format'
      });
    });

    it('should accept valid UUID format', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockRequest.params = { alertId: validUuid };

      const mockAlert = {
        id: validUuid,
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'Test message',
        parishes: [Parish.KINGSTON],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'COMPLETED',
        recipientCount: 10,
        deliveredCount: 9,
        failedCount: 1,
        deliveryStats: {
          total: 10,
          delivered: 9,
          failed: 1,
          pending: 0
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(mockAlertService.getAlertById).toHaveBeenCalledWith(validUuid);
    });
  });

  describe('alert retrieval', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should return alert with delivery stats when found', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Flash Flood Warning',
        message: 'Immediate evacuation required for low-lying areas.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW],
        createdAt: new Date('2024-01-15T10:30:00Z'),
        expiresAt: new Date('2024-01-15T18:30:00Z'),
        deliveryStatus: 'COMPLETED',
        recipientCount: 150,
        deliveredCount: 145,
        failedCount: 5,
        deliveryStats: {
          total: 150,
          delivered: 145,
          failed: 5,
          pending: 0
        }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.success).toBe(true);
      expect(response.jsonBody.data.alert).toEqual({
        id: mockAlert.id,
        type: mockAlert.type,
        severity: mockAlert.severity,
        title: mockAlert.title,
        message: mockAlert.message,
        parishes: mockAlert.parishes,
        createdAt: mockAlert.createdAt,
        expiresAt: mockAlert.expiresAt,
        deliveryStatus: mockAlert.deliveryStatus,
        recipientCount: mockAlert.recipientCount,
        deliveredCount: mockAlert.deliveredCount,
        failedCount: mockAlert.failedCount
      });
      expect(response.jsonBody.data.deliveryStats).toEqual(mockAlert.deliveryStats);
    });

    it('should return 404 when alert not found', async () => {
      mockAlertService.getAlertById.mockResolvedValue(null);

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(404);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Alert not found'
      });
    });

    it('should handle alerts without delivery stats', async () => {
      const mockAlert = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: AlertType.WEATHER,
        severity: Severity.MEDIUM,
        title: 'Weather Advisory',
        message: 'Heavy rainfall expected.',
        parishes: [Parish.ST_MARY],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'PENDING',
        recipientCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        deliveryStats: null // No delivery stats yet
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.data.deliveryStats).toEqual({
        total: 0,
        delivered: 0,
        failed: 0,
        pending: 0
      });
    });

    it('should handle service errors', async () => {
      mockAlertService.getAlertById.mockRejectedValue(new Error('Database connection failed'));

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody.success).toBe(false);
      expect(response.jsonBody.error).toBe('Failed to retrieve alert status');
      expect(response.jsonBody.details).toBe('Database connection failed');
    });
  });

  describe('service cleanup', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should close service on successful request', async () => {
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
        deliveryStats: { total: 10, delivered: 10, failed: 0, pending: 0 }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockAlertService.close).toHaveBeenCalled();
    });

    it('should close service on error', async () => {
      mockAlertService.getAlertById.mockRejectedValue(new Error('Service error'));

      await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockAlertService.close).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      mockRequest.params = { alertId: '550e8400-e29b-41d4-a716-446655440000' };
    });

    it('should log successful alert retrieval', async () => {
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
        deliveryStats: { total: 10, delivered: 10, failed: 0, pending: 0 }
      };

      mockAlertService.getAlertById.mockResolvedValue(mockAlert);

      await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockContext.log).toHaveBeenCalledWith('Alert status function triggered');
      expect(mockContext.log).toHaveBeenCalledWith(
        'Retrieved alert status for ID: 550e8400-e29b-41d4-a716-446655440000'
      );
    });

    it('should log errors', async () => {
      mockAlertService.getAlertById.mockRejectedValue(new Error('Database error'));

      await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        'Failed to get alert status:',
        expect.any(Error)
      );
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      (authenticateAdmin as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await alertsStatus(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});