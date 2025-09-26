import { NotificationService, NotificationResult, BatchNotificationResult } from '../notification.service';
import { EmailService } from '../email.service';
import { getPrismaClient } from '../../lib/database';
import { 
  User, 
  Alert, 
  Parish, 
  AlertType, 
  Severity, 
  DeliveryMethod,
  DeliveryLogStatus 
} from '@prisma/client';

// Mock dependencies
jest.mock('../../lib/database');

const mockPrisma = {
  alertDeliveryLog: {
    create: jest.fn(),
    findMany: jest.fn()
  }
};

(getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockUsers: User[];
  let mockAlert: Alert;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to ensure they return the expected values
    mockPrisma.alertDeliveryLog.create.mockResolvedValue({});
    mockPrisma.alertDeliveryLog.findMany.mockResolvedValue([]);

    // Ensure the mock is set up before creating the service
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);

    notificationService = new NotificationService();

    // Spy on the emailService methods after the service is created
    jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
    jest.spyOn(notificationService['emailService'], 'testConnection').mockResolvedValue(true);
    jest.spyOn(notificationService['emailService'], 'close').mockResolvedValue(undefined);

    // Mock users
    mockUsers = [
      {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1876-555-0001',
        parish: Parish.KINGSTON,
        address: null,
        smsAlerts: true,
        emailAlerts: true,
        emergencyOnly: false,
        accessibilitySettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      {
        id: 'user2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: null,
        parish: Parish.ST_ANDREW,
        address: null,
        smsAlerts: false,
        emailAlerts: true,
        emergencyOnly: false,
        accessibilitySettings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    // Mock alert
    mockAlert = {
      id: 'alert1',
      type: AlertType.FLOOD,
      severity: Severity.HIGH,
      title: 'Flash Flood Warning',
      message: 'Immediate evacuation required for low-lying areas.',
      parishes: [Parish.KINGSTON, Parish.ST_ANDREW],
      createdBy: 'admin1',
      createdAt: new Date(),
      expiresAt: null,
      deliveryStatus: 'PENDING' as any,
      recipientCount: 2,
      deliveredCount: 0,
      failedCount: 0
    };
  });

  afterEach(async () => {
    await notificationService.close();
  });

  describe('sendBatchNotifications', () => {
    it('should send notifications to all users successfully', async () => {
      // Mock successful email sending
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const result = await notificationService.sendBatchNotifications(mockUsers, mockAlert);

      expect(result.totalRecipients).toBe(2);
      expect(result.successCount).toBeGreaterThan(0);
      expect(result.failureCount).toBe(0);
      expect(result.deliveryStats.email.sent).toBeGreaterThan(0);
    });

    it('should handle email service failures gracefully', async () => {
      // Mock email service failure
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockRejectedValue(new Error('SMTP connection failed'));
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const result = await notificationService.sendBatchNotifications(mockUsers, mockAlert);

      expect(result.totalRecipients).toBe(2);
      expect(result.failureCount).toBeGreaterThan(0);
      expect(result.deliveryStats.email.failed).toBeGreaterThan(0);
    });

    it('should process users in batches with rate limiting', async () => {
      // Create more users to test batching
      const manyUsers = Array.from({ length: 150 }, (_, i) => ({
        ...mockUsers[0],
        id: `user${i}`,
        email: `user${i}@example.com`
      }));

      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const startTime = Date.now();
      const result = await notificationService.sendBatchNotifications(
        manyUsers, 
        mockAlert, 
        50, // batch size
        100  // rate limit delay (reduced for testing)
      );
      const endTime = Date.now();

      expect(result.totalRecipients).toBe(150);
      // Should take at least some time due to rate limiting between batches
      expect(endTime - startTime).toBeGreaterThan(100);
    });

    it('should respect user notification preferences', async () => {
      // User with only email alerts
      const emailOnlyUser: User = {
        ...mockUsers[0],
        smsAlerts: false,
        emailAlerts: true
      };

      // User with only SMS alerts
      const smsOnlyUser: User = {
        ...mockUsers[1],
        smsAlerts: true,
        emailAlerts: false,
        phone: '+1876-555-0002'
      };

      const sendAlertSpy = jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const result = await notificationService.sendBatchNotifications(
        [emailOnlyUser, smsOnlyUser], 
        mockAlert
      );

      expect(result.totalRecipients).toBe(2);
      // Should attempt different delivery methods based on preferences
      expect(sendAlertSpy).toHaveBeenCalled();
    });
  });

  describe('sendUserNotifications', () => {
    it('should send email notification when user has email alerts enabled', async () => {
      const user = mockUsers[0]; // Has email alerts enabled
      const sendAlertSpy = jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const results = await notificationService.sendUserNotifications(user, mockAlert);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.deliveryMethod === DeliveryMethod.EMAIL && r.success)).toBe(true);
      expect(sendAlertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          title: mockAlert.title,
          message: mockAlert.message
        })
      );
    });

    it('should skip SMS when user has no phone number', async () => {
      const user = mockUsers[1]; // Has no phone number
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const results = await notificationService.sendUserNotifications(user, mockAlert);

      const smsResult = results.find(r => r.deliveryMethod === DeliveryMethod.SMS);
      if (smsResult) {
        expect(smsResult.success).toBe(false);
        expect(smsResult.error).toContain('No phone number');
      }
    });

    it('should log all delivery attempts', async () => {
      const user = mockUsers[0];
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      await notificationService.sendUserNotifications(user, mockAlert);

      expect(mockPrisma.alertDeliveryLog.create).toHaveBeenCalled();
      expect(mockPrisma.alertDeliveryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          alertId: mockAlert.id,
          userId: user.id,
          deliveryMethod: expect.any(String),
          status: expect.any(String)
        })
      });
    });
  });

  describe('retryFailedNotifications', () => {
    it('should retry failed notifications', async () => {
      const failedLogs = [
        {
          id: 'log1',
          alertId: mockAlert.id,
          userId: mockUsers[0].id,
          deliveryMethod: DeliveryMethod.EMAIL,
          status: DeliveryLogStatus.FAILED,
          user: mockUsers[0],
          alert: mockAlert
        }
      ];

      mockPrisma.alertDeliveryLog.findMany.mockResolvedValue(failedLogs);
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      const result = await notificationService.retryFailedNotifications(mockAlert.id);

      expect(result.totalRecipients).toBe(1);
      expect(mockPrisma.alertDeliveryLog.findMany).toHaveBeenCalledWith({
        where: {
          alertId: mockAlert.id,
          status: DeliveryLogStatus.FAILED
        },
        include: {
          user: true,
          alert: true
        }
      });
    });

    it('should return empty result when no failed notifications exist', async () => {
      mockPrisma.alertDeliveryLog.findMany.mockResolvedValue([]);

      const result = await notificationService.retryFailedNotifications(mockAlert.id);

      expect(result.totalRecipients).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('getDeliveryStats', () => {
    it('should calculate delivery statistics correctly', async () => {
      const mockLogs = [
        {
          deliveryMethod: DeliveryMethod.EMAIL,
          status: DeliveryLogStatus.DELIVERED
        },
        {
          deliveryMethod: DeliveryMethod.EMAIL,
          status: DeliveryLogStatus.FAILED
        },
        {
          deliveryMethod: DeliveryMethod.SMS,
          status: DeliveryLogStatus.SENT
        },
        {
          deliveryMethod: DeliveryMethod.PUSH,
          status: DeliveryLogStatus.PENDING
        }
      ];

      mockPrisma.alertDeliveryLog.findMany.mockResolvedValue(mockLogs);

      const stats = await notificationService.getDeliveryStats(mockAlert.id);

      expect(stats.total).toBe(4);
      expect(stats.delivered).toBe(2); // DELIVERED + SENT
      expect(stats.failed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.byMethod.EMAIL.sent).toBe(1);
      expect(stats.byMethod.EMAIL.failed).toBe(1);
      expect(stats.byMethod.SMS.sent).toBe(1);
      expect(stats.byMethod.PUSH.pending).toBe(1);
    });
  });

  describe('testHealth', () => {
    it('should test all notification service health', async () => {
      const testConnectionSpy = jest.spyOn(notificationService['emailService'], 'testConnection').mockResolvedValue(true);

      const health = await notificationService.testHealth();

      expect(health.email).toBe(true);
      expect(health.sms).toBe(true); // Placeholder
      expect(health.push).toBe(true); // Placeholder
      expect(testConnectionSpy).toHaveBeenCalled();
    });

    it('should handle email service health check failure', async () => {
      jest.spyOn(notificationService['emailService'], 'testConnection').mockResolvedValue(false);

      const health = await notificationService.testHealth();

      expect(health.email).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database logging failures gracefully', async () => {
      const user = mockUsers[0];
      jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockResolvedValue(undefined);
      mockPrisma.alertDeliveryLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw even if logging fails
      const results = await notificationService.sendUserNotifications(user, mockAlert);

      expect(results.length).toBeGreaterThan(0);
      // Email should still succeed even if logging fails
      expect(results.some(r => r.success)).toBe(true);
    });

    it('should handle notification payload creation correctly', async () => {
      const user = mockUsers[0];
      const sendAlertSpy = jest.spyOn(notificationService['emailService'], 'sendAlertNotification').mockImplementation((notification) => {
        expect(notification.title).toBe(mockAlert.title);
        expect(notification.message).toBe(mockAlert.message);
        expect(notification.alertId).toBe(mockAlert.id);
        expect(notification.parishes).toEqual(mockAlert.parishes);
        return Promise.resolve();
      });
      mockPrisma.alertDeliveryLog.create.mockResolvedValue({});

      await notificationService.sendUserNotifications(user, mockAlert);

      expect(sendAlertSpy).toHaveBeenCalled();
    });
  });
});