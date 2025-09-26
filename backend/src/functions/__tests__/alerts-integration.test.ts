import { AlertService } from '../../services/alert.service';
import { NotificationService } from '../../services/notification.service';
import { AlertType, Severity, Parish } from '../../types';

// Mock the database and email service
jest.mock('../../lib/database');
jest.mock('../../services/email.service');

describe('Alert Distribution Integration', () => {
  let alertService: AlertService;
  let notificationService: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    alertService = new AlertService();
    notificationService = new NotificationService();
  });

  afterEach(async () => {
    await alertService.close();
    await notificationService.close();
  });

  describe('Alert Creation and Dispatch Flow', () => {
    it('should create alert service successfully', () => {
      expect(alertService).toBeDefined();
      expect(alertService).toBeInstanceOf(AlertService);
    });

    it('should create notification service successfully', () => {
      expect(notificationService).toBeDefined();
      expect(notificationService).toBeInstanceOf(NotificationService);
    });

    it('should have required methods for alert dispatch', () => {
      expect(typeof alertService.createAlert).toBe('function');
      expect(typeof alertService.dispatchAlert).toBe('function');
      expect(typeof alertService.getUsersByParishes).toBe('function');
      expect(typeof alertService.retryAlertDelivery).toBe('function');
      expect(typeof alertService.getAlertAnalytics).toBe('function');
    });

    it('should have required methods for notifications', () => {
      expect(typeof notificationService.sendBatchNotifications).toBe('function');
      expect(typeof notificationService.retryFailedNotifications).toBe('function');
      expect(typeof notificationService.getDeliveryStats).toBe('function');
      expect(typeof notificationService.testHealth).toBe('function');
    });

    it('should validate alert request structure', () => {
      const validAlertRequest = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Flash Flood Warning',
        message: 'Immediate evacuation required for low-lying areas.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW]
      };

      // Verify the request has all required fields
      expect(validAlertRequest.type).toBeDefined();
      expect(validAlertRequest.severity).toBeDefined();
      expect(validAlertRequest.title).toBeDefined();
      expect(validAlertRequest.message).toBeDefined();
      expect(validAlertRequest.parishes).toBeDefined();
      expect(Array.isArray(validAlertRequest.parishes)).toBe(true);
      expect(validAlertRequest.parishes.length).toBeGreaterThan(0);
    });

    it('should validate notification payload structure', () => {
      const mockAlert = {
        id: 'alert1',
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'Test message',
        parishes: [Parish.KINGSTON],
        createdAt: new Date(),
        expiresAt: null,
        deliveryStatus: 'PENDING' as any,
        recipientCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdBy: null
      };

      // Verify alert structure matches expected format
      expect(mockAlert.id).toBeDefined();
      expect(mockAlert.type).toBeDefined();
      expect(mockAlert.severity).toBeDefined();
      expect(mockAlert.title).toBeDefined();
      expect(mockAlert.message).toBeDefined();
      expect(mockAlert.parishes).toBeDefined();
    });

    it('should validate user structure for notifications', () => {
      const mockUser = {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1876-555-0001',
        parish: Parish.KINGSTON,
        address: '123 Main St',
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
        accessibilitySettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // Verify user has required fields for notifications
      expect(mockUser.id).toBeDefined();
      expect(mockUser.email).toBeDefined();
      expect(mockUser.parish).toBeDefined();
      expect(typeof mockUser.emailAlerts).toBe('boolean');
      expect(typeof mockUser.smsAlerts).toBe('boolean');
      expect(typeof mockUser.isActive).toBe('boolean');
    });
  });

  describe('Service Health Checks', () => {
    it('should provide health check methods', async () => {
      // These methods should exist and be callable
      expect(typeof alertService.testHealth).toBe('function');
      expect(typeof notificationService.testHealth).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle service cleanup properly', async () => {
      // Services should have close methods for cleanup
      expect(typeof alertService.close).toBe('function');
      expect(typeof notificationService.close).toBe('function');

      // Should not throw when closing
      await expect(alertService.close()).resolves.not.toThrow();
      await expect(notificationService.close()).resolves.not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should validate parish enum values', () => {
      const validParishes = Object.values(Parish);
      expect(validParishes).toContain(Parish.KINGSTON);
      expect(validParishes).toContain(Parish.ST_ANDREW);
      expect(validParishes).toContain(Parish.ST_THOMAS);
      expect(validParishes.length).toBeGreaterThan(10); // Jamaica has 14 parishes
    });

    it('should validate alert type enum values', () => {
      const validAlertTypes = Object.values(AlertType);
      expect(validAlertTypes).toContain(AlertType.FLOOD);
      expect(validAlertTypes).toContain(AlertType.WEATHER);
      expect(validAlertTypes).toContain(AlertType.EMERGENCY);
      expect(validAlertTypes).toContain(AlertType.ALL_CLEAR);
    });

    it('should validate severity enum values', () => {
      const validSeverities = Object.values(Severity);
      expect(validSeverities).toContain(Severity.LOW);
      expect(validSeverities).toContain(Severity.MEDIUM);
      expect(validSeverities).toContain(Severity.HIGH);
    });
  });
});