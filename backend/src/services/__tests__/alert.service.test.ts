import { AlertService, AlertWithStats } from '../alert.service';
import { NotificationService } from '../notification.service';
import { getPrismaClient } from '../../lib/database';
import { 
  Alert, 
  User, 
  Parish, 
  AlertType, 
  Severity, 
  DeliveryStatus 
} from '@prisma/client';
import { AlertCreateRequest, AlertDispatchRequest } from '../../types';

// Mock dependencies
jest.mock('../notification.service');
jest.mock('../../lib/database');

const mockPrisma = {
  alert: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn()
  },
  user: {
    findMany: jest.fn(),
    groupBy: jest.fn()
  },
  $transaction: jest.fn()
};

const mockNotificationService = {
  sendBatchNotifications: jest.fn(),
  getDeliveryStats: jest.fn(),
  retryFailedNotifications: jest.fn(),
  testHealth: jest.fn(),
  close: jest.fn()
};

(getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
(NotificationService as jest.MockedClass<typeof NotificationService>).mockImplementation(() => mockNotificationService as any);

describe('AlertService', () => {
  let alertService: AlertService;
  let mockAlert: Alert;
  let mockUsers: User[];

  beforeEach(() => {
    jest.clearAllMocks();
    alertService = new AlertService();

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
      deliveryStatus: DeliveryStatus.PENDING,
      recipientCount: 0,
      deliveredCount: 0,
      failedCount: 0
    };

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
  });

  afterEach(async () => {
    await alertService.close();
  });

  describe('createAlert', () => {
    it('should create a new alert successfully', async () => {
      const request: AlertCreateRequest = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Test Alert',
        message: 'This is a test alert message.',
        parishes: [Parish.KINGSTON]
      };

      mockPrisma.alert.create.mockResolvedValue(mockAlert);

      const result = await alertService.createAlert(request, 'admin1');

      expect(result).toEqual(mockAlert);
      expect(mockPrisma.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: request.type,
          severity: request.severity,
          title: request.title,
          message: request.message,
          parishes: request.parishes,
          createdBy: 'admin1',
          deliveryStatus: DeliveryStatus.PENDING,
          recipientCount: 0,
          deliveredCount: 0,
          failedCount: 0
        })
      });
    });

    it('should create alert without createdBy when not provided', async () => {
      const request: AlertCreateRequest = {
        type: AlertType.WEATHER,
        severity: Severity.MEDIUM,
        title: 'Weather Alert',
        message: 'Weather conditions are changing.',
        parishes: [Parish.ST_ANDREW]
      };

      mockPrisma.alert.create.mockResolvedValue(mockAlert);

      await alertService.createAlert(request);

      expect(mockPrisma.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          createdBy: undefined
        })
      });
    });
  });

  describe('dispatchAlert', () => {
    it('should dispatch alert and send notifications successfully', async () => {
      const request: AlertDispatchRequest = {
        type: AlertType.FLOOD,
        severity: Severity.HIGH,
        title: 'Emergency Alert',
        message: 'Immediate action required.',
        parishes: [Parish.KINGSTON, Parish.ST_ANDREW]
      };

      const mockTransaction = jest.fn();
      mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
      mockPrisma.alert.create.mockResolvedValue(mockAlert);
      mockPrisma.alert.update.mockResolvedValue({ ...mockAlert, recipientCount: 2 });
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const mockDispatchResult = {
        totalRecipients: 2,
        successCount: 2,
        failureCount: 0,
        results: [],
        deliveryStats: {
          email: { sent: 2, failed: 0 },
          sms: { sent: 1, failed: 0 },
          push: { sent: 2, failed: 0 }
        }
      };

      mockNotificationService.sendBatchNotifications.mockResolvedValue(mockDispatchResult);

      const result = await alertService.dispatchAlert(request, 'admin1');

      expect(result.alert).toBeDefined();
      expect(result.dispatchResult).toEqual(mockDispatchResult);
      expect(mockPrisma.alert.create).toHaveBeenCalled();
      expect(mockPrisma.alert.update).toHaveBeenCalledTimes(2); // Once for recipient count, once for final stats
      expect(mockNotificationService.sendBatchNotifications).toHaveBeenCalledWith(
        mockUsers,
        expect.objectContaining({ recipientCount: 2 })
      );
    });

    it('should handle notification failures and update alert status', async () => {
      const request: AlertDispatchRequest = {
        type: AlertType.EMERGENCY,
        severity: Severity.HIGH,
        title: 'Critical Alert',
        message: 'Critical situation detected.',
        parishes: [Parish.KINGSTON]
      };

      mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));
      mockPrisma.alert.create.mockResolvedValue(mockAlert);
      mockPrisma.alert.update.mockResolvedValue(mockAlert);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const mockDispatchResult = {
        totalRecipients: 2,
        successCount: 1,
        failureCount: 1,
        results: [],
        deliveryStats: {
          email: { sent: 1, failed: 1 },
          sms: { sent: 0, failed: 0 },
          push: { sent: 1, failed: 1 }
        }
      };

      mockNotificationService.sendBatchNotifications.mockResolvedValue(mockDispatchResult);

      const result = await alertService.dispatchAlert(request);

      expect(result.dispatchResult.failureCount).toBe(1);
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { id: mockAlert.id },
        data: expect.objectContaining({
          deliveredCount: 1,
          failedCount: 1,
          deliveryStatus: DeliveryStatus.FAILED
        })
      });
    });
  });

  describe('getUsersByParishes', () => {
    it('should query users by parishes efficiently', async () => {
      const parishes = [Parish.KINGSTON, Parish.ST_ANDREW];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await alertService.getUsersByParishes(parishes);

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
          isActive: true,
          OR: [
            { emailAlerts: true },
            { smsAlerts: true }
          ]
        },
        select: expect.objectContaining({
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          parish: true,
          smsAlerts: true,
          emailAlerts: true,
          emergencyOnly: true
        }),
        orderBy: [
          { parish: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    });

    it('should work with transaction context', async () => {
      const parishes = [Parish.KINGSTON];
      const mockTx = { user: { findMany: jest.fn().mockResolvedValue(mockUsers) } };

      const result = await alertService.getUsersByParishes(parishes, mockTx);

      expect(result).toEqual(mockUsers);
      expect(mockTx.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getEmergencyUsers', () => {
    it('should query only emergency-only users', async () => {
      const parishes = [Parish.KINGSTON];
      const emergencyUsers = mockUsers.filter(u => u.emergencyOnly);
      mockPrisma.user.findMany.mockResolvedValue(emergencyUsers);

      const result = await alertService.getEmergencyUsers(parishes);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          parish: { in: parishes },
          isActive: true,
          emergencyOnly: true,
          OR: [
            { emailAlerts: true },
            { smsAlerts: true }
          ]
        },
        select: expect.any(Object),
        orderBy: expect.any(Array)
      });
    });
  });

  describe('getUserCountByParish', () => {
    it('should return user count by parish', async () => {
      const mockCounts = [
        { parish: Parish.KINGSTON, _count: { id: 150 } },
        { parish: Parish.ST_ANDREW, _count: { id: 200 } }
      ];

      mockPrisma.user.groupBy.mockResolvedValue(mockCounts);

      const result = await alertService.getUserCountByParish();

      expect(result[Parish.KINGSTON]).toBe(150);
      expect(result[Parish.ST_ANDREW]).toBe(200);
      expect(result[Parish.PORTLAND]).toBe(0); // Should initialize all parishes
    });
  });

  describe('getAlertById', () => {
    it('should return alert with delivery stats', async () => {
      const mockDeliveryStats = {
        total: 10,
        delivered: 8,
        failed: 2,
        pending: 0
      };

      mockPrisma.alert.findUnique.mockResolvedValue(mockAlert);
      mockNotificationService.getDeliveryStats.mockResolvedValue(mockDeliveryStats);

      const result = await alertService.getAlertById('alert1');

      expect(result).toEqual({
        ...mockAlert,
        deliveryStats: mockDeliveryStats
      });
      expect(mockNotificationService.getDeliveryStats).toHaveBeenCalledWith('alert1');
    });

    it('should return null when alert not found', async () => {
      mockPrisma.alert.findUnique.mockResolvedValue(null);

      const result = await alertService.getAlertById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getRecentAlerts', () => {
    it('should return paginated alerts with delivery stats', async () => {
      const mockAlerts = [mockAlert];
      const mockDeliveryStats = {
        total: 5,
        delivered: 4,
        failed: 1,
        pending: 0
      };

      mockPrisma.alert.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.alert.count.mockResolvedValue(1);
      mockNotificationService.getDeliveryStats.mockResolvedValue(mockDeliveryStats);

      const result = await alertService.getRecentAlerts(10, 0);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].deliveryStats).toEqual(mockDeliveryStats);
      expect(result.total).toBe(1);
    });

    it('should filter by parishes when provided', async () => {
      const parishes = [Parish.KINGSTON];
      mockPrisma.alert.findMany.mockResolvedValue([]);
      mockPrisma.alert.count.mockResolvedValue(0);

      await alertService.getRecentAlerts(10, 0, parishes);

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          parishes: {
            array_contains: parishes
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0
      });
    });
  });

  describe('getActiveAlerts', () => {
    it('should return non-expired alerts', async () => {
      const activeAlert = { ...mockAlert, expiresAt: new Date(Date.now() + 3600000) }; // 1 hour from now
      mockPrisma.alert.findMany.mockResolvedValue([activeAlert]);
      mockNotificationService.getDeliveryStats.mockResolvedValue({
        total: 1, delivered: 1, failed: 0, pending: 0
      });

      const result = await alertService.getActiveAlerts();

      expect(result).toHaveLength(1);
      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: expect.any(Date) } }
          ]
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    });
  });

  describe('retryAlertDelivery', () => {
    it('should retry failed deliveries and update alert stats', async () => {
      const mockRetryResult = {
        totalRecipients: 2,
        successCount: 1,
        failureCount: 1,
        results: [],
        deliveryStats: {
          email: { sent: 1, failed: 1 },
          sms: { sent: 0, failed: 0 },
          push: { sent: 0, failed: 0 }
        }
      };

      mockPrisma.alert.update.mockResolvedValue(mockAlert);
      mockPrisma.alert.findUnique.mockResolvedValue(mockAlert);
      mockNotificationService.retryFailedNotifications.mockResolvedValue(mockRetryResult);

      const result = await alertService.retryAlertDelivery('alert1');

      expect(result).toEqual(mockRetryResult);
      expect(mockPrisma.alert.update).toHaveBeenCalledWith({
        where: { id: 'alert1' },
        data: { deliveryStatus: DeliveryStatus.SENDING }
      });
      expect(mockNotificationService.retryFailedNotifications).toHaveBeenCalledWith('alert1');
    });
  });

  describe('getAlertAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const mockAlertsWithLogs = [
        {
          ...mockAlert,
          deliveryLogs: [
            {
              status: 'DELIVERED',
              user: { parish: Parish.KINGSTON }
            },
            {
              status: 'FAILED',
              user: { parish: Parish.ST_ANDREW }
            }
          ]
        }
      ];

      mockPrisma.alert.findMany.mockResolvedValue(mockAlertsWithLogs);

      const result = await alertService.getAlertAnalytics(startDate, endDate);

      expect(result.totalAlerts).toBe(1);
      expect(result.alertsByType[AlertType.FLOOD]).toBe(1);
      expect(result.alertsBySeverity[Severity.HIGH]).toBe(1);
      expect(result.deliveryRateByParish[Parish.KINGSTON].delivered).toBe(1);
      expect(result.deliveryRateByParish[Parish.ST_ANDREW].delivered).toBe(0);
    });

    it('should filter by parishes when provided', async () => {
      const parishes = [Parish.KINGSTON];
      mockPrisma.alert.findMany.mockResolvedValue([]);

      await alertService.getAlertAnalytics(new Date(), new Date(), parishes);

      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: expect.any(Object),
          parishes: {
            array_contains: parishes
          }
        },
        include: expect.any(Object)
      });
    });
  });

  describe('cleanupExpiredAlerts', () => {
    it('should delete old expired alerts', async () => {
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 5 });

      const result = await alertService.cleanupExpiredAlerts();

      expect(result).toBe(5);
      expect(mockPrisma.alert.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          },
          createdAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('testHealth', () => {
    it('should test service health', async () => {
      mockPrisma.alert.count.mockResolvedValue(10);
      mockNotificationService.testHealth.mockResolvedValue({
        email: true,
        sms: true,
        push: true
      });

      const result = await alertService.testHealth();

      expect(result.database).toBe(true);
      expect(result.notifications.email).toBe(true);
      expect(result.notifications.sms).toBe(true);
      expect(result.notifications.push).toBe(true);
    });

    it('should handle database health check failure', async () => {
      mockPrisma.alert.count.mockRejectedValue(new Error('Database error'));

      const result = await alertService.testHealth();

      expect(result.database).toBe(false);
      expect(result.notifications.email).toBe(false);
    });
  });
});