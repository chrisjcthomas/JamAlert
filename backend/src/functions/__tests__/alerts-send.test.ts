import { HttpRequest, InvocationContext } from '@azure/functions';
import { alertsSend } from '../alerts-send';
import { AlertService } from '../../services/alert.service';
import { authenticateAdmin } from '../../middleware/auth.middleware';
import { AlertType, Severity, Parish } from '../../types';

// Mock dependencies
jest.mock('../../services/alert.service');
jest.mock('../../middleware/auth.middleware');

const mockAlertService = {
  dispatchAlert: jest.fn(),
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

describe('alerts-send function', () => {
  let mockRequest: Partial<HttpRequest>;
  let mockContext: Partial<InvocationContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      log: jest.fn() as any
    };

    mockRequest = {
      method: 'POST',
      text: jest.fn(),
      url: 'https://test.com/api/alerts/send'
    };
  });

  describe('authentication', () => {
    it('should return 401 when admin authentication fails', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(null);

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(401);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Unauthorized - Admin access required'
      });
    });

    it('should proceed when admin authentication succeeds', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON]
      }));

      mockAlertService.dispatchAlert.mockResolvedValue({
        alert: {
          id: 'alert1',
          type: AlertType.FLOOD,
          severity: Severity.HIGH,
          title: 'Test Alert',
          message: 'This is a test alert message for validation.',
          parishes: [Parish.KINGSTON],
          createdAt: new Date(),
          expiresAt: null,
          deliveryStatus: 'COMPLETED'
        },
        dispatchResult: {
          totalRecipients: 10,
          successCount: 10,
          failureCount: 0,
          deliveryStats: {
            email: { sent: 10, failed: 0 },
            sms: { sent: 5, failed: 0 },
            push: { sent: 10, failed: 0 }
          }
        }
      });

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(authenticateAdmin).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
    });

    it('should return 405 for non-POST requests', async () => {
      mockRequest.method = 'GET';

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(405);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Method not allowed'
      });
    });

    it('should return 400 for invalid JSON', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue('invalid json');

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Invalid JSON in request body'
      });
    });

    it('should validate required fields', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        // Missing required fields
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.success).toBe(false);
      expect(response.jsonBody.error).toBe('Validation failed');
      expect(response.jsonBody.details).toContain('Alert type is required');
    });

    it('should validate alert type', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: 'INVALID_TYPE',
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON]
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Invalid alert type');
    });

    it('should validate severity', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: 'INVALID_SEVERITY',
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON]
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Invalid alert severity');
    });

    it('should validate title length', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Hi', // Too short
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON]
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Alert title must be between 5 and 255 characters');
    });

    it('should validate message length', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'Short', // Too short
        parishes: [Parish.KINGSTON]
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Alert message must be between 10 and 2000 characters');
    });

    it('should validate parishes array', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [] // Empty array
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('At least one parish must be specified');
    });

    it('should validate parish values', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: ['INVALID_PARISH']
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Invalid parishes: INVALID_PARISH');
    });

    it('should validate expiration date when provided', async () => {
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON],
        expiresAt: '2020-01-01T00:00:00Z' // Past date
      }));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(400);
      expect(response.jsonBody.details).toContain('Expiration date must be in the future');
    });
  });

  describe('alert dispatch', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
    });

    it('should dispatch alert successfully', async () => {
      const validRequest = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Flash Flood Warning',
        message: 'Immediate evacuation required for low-lying areas in Kingston.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW]
      };

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify(validRequest));

      const mockDispatchResult = {
        alert: {
          id: 'alert1',
          type: AlertType.FLOOD,
          severity: Severity.HIGH,
          title: 'Flash Flood Warning',
          message: 'Immediate evacuation required for low-lying areas in Kingston.',
          parishes: [Parish.KINGSTON, Parish.ST_ANDREW],
          createdAt: new Date(),
          expiresAt: null,
          deliveryStatus: 'COMPLETED'
        },
        dispatchResult: {
          totalRecipients: 150,
          successCount: 148,
          failureCount: 2,
          deliveryStats: {
            email: { sent: 148, failed: 2 },
            sms: { sent: 75, failed: 1 },
            push: { sent: 150, failed: 0 }
          }
        }
      };

      mockAlertService.dispatchAlert.mockResolvedValue(mockDispatchResult);

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.success).toBe(true);
      expect(response.jsonBody.data.alert.id).toBe('alert1');
      expect(response.jsonBody.data.dispatch.totalRecipients).toBe(150);
      expect(response.jsonBody.data.dispatch.successCount).toBe(148);
      expect(response.jsonBody.data.dispatch.failureCount).toBe(2);
      expect(response.jsonBody.message).toContain('150 recipients');

      expect(mockAlertService.dispatchAlert).toHaveBeenCalledWith(validRequest, mockAdmin.id);
      expect(mockAlertService.close).toHaveBeenCalled();
    });

    it('should handle dispatch service errors', async () => {
      const validRequest = {
        type: AlertType.EMERGENCY,
        severity: Severity.HIGH,
        title: 'Emergency Alert',
        message: 'Critical emergency situation detected in the area.',
        parishes: [Parish.KINGSTON]
      };

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify(validRequest));
      mockAlertService.dispatchAlert.mockRejectedValue(new Error('Database connection failed'));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody.success).toBe(false);
      expect(response.jsonBody.error).toBe('Failed to dispatch alert');
      expect(response.jsonBody.details).toBe('Database connection failed');
      expect(mockAlertService.close).toHaveBeenCalled();
    });

    it('should handle partial delivery failures', async () => {
      const validRequest = {
        type: AlertType.WEATHER,
        severity: Severity.MEDIUM,
        title: 'Weather Advisory',
        message: 'Heavy rainfall expected in the following areas over the next 6 hours.',
        parishes: [Parish.ST_MARY, Parish.PORTLAND]
      };

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify(validRequest));

      const mockDispatchResult = {
        alert: {
          id: 'alert2',
          type: AlertType.WEATHER,
          severity: Severity.MEDIUM,
          title: 'Weather Advisory',
          message: 'Heavy rainfall expected in the following areas over the next 6 hours.',
          parishes: [Parish.ST_MARY, Parish.PORTLAND],
          createdAt: new Date(),
          expiresAt: null,
          deliveryStatus: 'FAILED'
        },
        dispatchResult: {
          totalRecipients: 100,
          successCount: 85,
          failureCount: 15,
          deliveryStats: {
            email: { sent: 85, failed: 15 },
            sms: { sent: 40, failed: 5 },
            push: { sent: 90, failed: 10 }
          }
        }
      };

      mockAlertService.dispatchAlert.mockResolvedValue(mockDispatchResult);

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(200);
      expect(response.jsonBody.success).toBe(true);
      expect(response.jsonBody.data.dispatch.failureCount).toBe(15);
      expect(response.jsonBody.data.alert.deliveryStatus).toBe('FAILED');
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      (authenticateAdmin as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const response = await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(response.status).toBe(500);
      expect(response.jsonBody).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should ensure service cleanup on errors', async () => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify({
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON]
      }));

      mockAlertService.dispatchAlert.mockRejectedValue(new Error('Service error'));

      await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockAlertService.close).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    beforeEach(() => {
      (authenticateAdmin as jest.Mock).mockResolvedValue(mockAdmin);
    });

    it('should log dispatch attempts', async () => {
      const validRequest = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message for validation.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW]
      };

      (mockRequest.text as jest.Mock).mockResolvedValue(JSON.stringify(validRequest));

      mockAlertService.dispatchAlert.mockResolvedValue({
        alert: { id: 'alert1' },
        dispatchResult: { totalRecipients: 10, successCount: 10, failureCount: 0 }
      });

      await alertsSend(mockRequest as HttpRequest, mockContext as InvocationContext);

      expect(mockContext.log).toHaveBeenCalledWith('Alert dispatch function triggered');
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining('Dispatching alert to parishes: KINGSTON, ST_ANDREW')
      );
      expect(mockContext.log).toHaveBeenCalledWith(
        expect.stringContaining('Alert dispatched successfully')
      );
    });
  });
});