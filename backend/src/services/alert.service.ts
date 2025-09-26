import { 
  Alert, 
  User, 
  Parish, 
  AlertType, 
  Severity, 
  DeliveryStatus 
} from '@prisma/client';
import { getPrismaClient, withRetry, withTransaction } from '../lib/database';
import { 
  AlertCreateRequest, 
  AlertDispatchRequest, 
  CreateAlertData 
} from '../types';
import { NotificationService, BatchNotificationResult } from './notification.service';

export interface AlertWithStats extends Alert {
  deliveryStats?: {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
  };
}

export class AlertService {
  private prisma = getPrismaClient();
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new alert
   */
  async createAlert(request: AlertCreateRequest, createdBy?: string): Promise<Alert> {
    const alertData = {
      type: request.type,
      severity: request.severity,
      title: request.title,
      message: request.message,
      parishes: request.parishes,
      createdBy,
      expiresAt: request.expiresAt,
      deliveryStatus: DeliveryStatus.PENDING,
      recipientCount: 0,
      deliveredCount: 0,
      failedCount: 0
    };

    return await withRetry(async () => {
      return await this.prisma.alert.create({
        data: alertData
      });
    }, 'Create alert');
  }

  /**
   * Dispatch alert to users (create and send immediately)
   */
  async dispatchAlert(request: AlertDispatchRequest, createdBy?: string): Promise<{
    alert: Alert;
    dispatchResult: BatchNotificationResult;
  }> {
    return await withTransaction(async (tx) => {
      // Create the alert
      const alert = await tx.alert.create({
        data: {
          type: request.type,
          severity: request.severity,
          title: request.title,
          message: request.message,
          parishes: request.parishes,
          createdBy,
          expiresAt: request.expiresAt,
          deliveryStatus: DeliveryStatus.PENDING,
          recipientCount: 0,
          deliveredCount: 0,
          failedCount: 0
        }
      });

      // Get affected users
      const users = await this.getUsersByParishes(request.parishes, tx);

      // Update alert with recipient count
      await tx.alert.update({
        where: { id: alert.id },
        data: {
          recipientCount: users.length,
          deliveryStatus: DeliveryStatus.SENDING
        }
      });

      // Send notifications
      const dispatchResult = await this.notificationService.sendBatchNotifications(
        users,
        { ...alert, recipientCount: users.length }
      );

      // Update alert with final delivery stats
      const finalAlert = await tx.alert.update({
        where: { id: alert.id },
        data: {
          deliveredCount: dispatchResult.successCount,
          failedCount: dispatchResult.failureCount,
          deliveryStatus: dispatchResult.failureCount === 0 
            ? DeliveryStatus.COMPLETED 
            : DeliveryStatus.FAILED
        }
      });

      return {
        alert: finalAlert,
        dispatchResult
      };
    }, 'Dispatch alert');
  }

  /**
   * Get users by parishes with efficient querying
   */
  async getUsersByParishes(parishes: Parish[], tx?: any): Promise<User[]> {
    const client = tx || this.prisma;

    return await withRetry(async () => {
      return await client.user.findMany({
        where: {
          parish: {
            in: parishes
          },
          isActive: true,
          // At least one notification method enabled
          OR: [
            { emailAlerts: true },
            { smsAlerts: true }
          ]
        },
        // Optimize query with only needed fields
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          parish: true,
          address: true,
          smsAlerts: true,
          emailAlerts: true,
          emergencyOnly: true,
          accessibilitySettings: true,
          createdAt: true,
          updatedAt: true,
          isActive: true
        },
        // Order by parish for better batch processing
        orderBy: [
          { parish: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    }, 'Get users by parishes');
  }

  /**
   * Get users by parishes with emergency-only filter
   */
  async getEmergencyUsers(parishes: Parish[]): Promise<User[]> {
    return await withRetry(async () => {
      return await this.prisma.user.findMany({
        where: {
          parish: {
            in: parishes
          },
          isActive: true,
          emergencyOnly: true,
          OR: [
            { emailAlerts: true },
            { smsAlerts: true }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          parish: true,
          address: true,
          smsAlerts: true,
          emailAlerts: true,
          emergencyOnly: true,
          accessibilitySettings: true,
          createdAt: true,
          updatedAt: true,
          isActive: true
        },
        orderBy: [
          { parish: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    }, 'Get emergency users');
  }

  /**
   * Get user count by parish for capacity planning
   */
  async getUserCountByParish(): Promise<Record<Parish, number>> {
    const counts = await withRetry(async () => {
      return await this.prisma.user.groupBy({
        by: ['parish'],
        where: {
          isActive: true,
          OR: [
            { emailAlerts: true },
            { smsAlerts: true }
          ]
        },
        _count: {
          id: true
        }
      });
    }, 'Get user count by parish');

    const result: Record<Parish, number> = {} as Record<Parish, number>;
    
    // Initialize all parishes with 0
    Object.values(Parish).forEach(parish => {
      result[parish] = 0;
    });

    // Fill in actual counts
    counts.forEach(count => {
      result[count.parish] = count._count.id;
    });

    return result;
  }

  /**
   * Get alert by ID with delivery stats
   */
  async getAlertById(id: string): Promise<AlertWithStats | null> {
    const alert = await withRetry(async () => {
      return await this.prisma.alert.findUnique({
        where: { id }
      });
    }, 'Get alert by ID');

    if (!alert) {
      return null;
    }

    // Get delivery stats
    const deliveryStats = await this.notificationService.getDeliveryStats(id);

    return {
      ...alert,
      deliveryStats
    };
  }

  /**
   * Get recent alerts with pagination
   */
  async getRecentAlerts(
    limit: number = 10,
    offset: number = 0,
    parishes?: Parish[]
  ): Promise<{
    alerts: AlertWithStats[];
    total: number;
  }> {
    const where = parishes ? {
      parishes: {
        array_contains: parishes
      }
    } : {};

    const [alerts, total] = await Promise.all([
      withRetry(async () => {
        return await this.prisma.alert.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        });
      }, 'Get recent alerts'),
      
      withRetry(async () => {
        return await this.prisma.alert.count({ where });
      }, 'Count recent alerts')
    ]);

    // Add delivery stats to each alert
    const alertsWithStats = await Promise.all(
      alerts.map(async (alert) => {
        const deliveryStats = await this.notificationService.getDeliveryStats(alert.id);
        return {
          ...alert,
          deliveryStats
        };
      })
    );

    return {
      alerts: alertsWithStats,
      total
    };
  }

  /**
   * Get active alerts (not expired)
   */
  async getActiveAlerts(parishes?: Parish[]): Promise<AlertWithStats[]> {
    const where = {
      ...(parishes ? {
        parishes: {
          array_contains: parishes
        }
      } : {}),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    };

    const alerts = await withRetry(async () => {
      return await this.prisma.alert.findMany({
        where,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }, 'Get active alerts');

    // Add delivery stats
    const alertsWithStats = await Promise.all(
      alerts.map(async (alert) => {
        const deliveryStats = await this.notificationService.getDeliveryStats(alert.id);
        return {
          ...alert,
          deliveryStats
        };
      })
    );

    return alertsWithStats;
  }

  /**
   * Retry failed alert deliveries
   */
  async retryAlertDelivery(alertId: string): Promise<BatchNotificationResult> {
    // Update alert status to sending
    await withRetry(async () => {
      await this.prisma.alert.update({
        where: { id: alertId },
        data: { deliveryStatus: DeliveryStatus.SENDING }
      });
    }, 'Update alert status for retry');

    // Retry failed notifications
    const result = await this.notificationService.retryFailedNotifications(alertId);

    // Update alert with new delivery stats
    await withRetry(async () => {
      const alert = await this.prisma.alert.findUnique({
        where: { id: alertId }
      });

      if (alert) {
        await this.prisma.alert.update({
          where: { id: alertId },
          data: {
            deliveredCount: alert.deliveredCount + result.successCount,
            failedCount: Math.max(0, alert.failedCount - result.successCount),
            deliveryStatus: result.failureCount === 0 
              ? DeliveryStatus.COMPLETED 
              : DeliveryStatus.FAILED
          }
        });
      }
    }, 'Update alert stats after retry');

    return result;
  }

  /**
   * Get alert delivery analytics
   */
  async getAlertAnalytics(
    startDate: Date,
    endDate: Date,
    parishes?: Parish[]
  ): Promise<{
    totalAlerts: number;
    alertsByType: Record<AlertType, number>;
    alertsBySeverity: Record<Severity, number>;
    averageDeliveryRate: number;
    totalRecipients: number;
    totalDelivered: number;
    deliveryRateByParish: Record<Parish, { sent: number; delivered: number; rate: number }>;
  }> {
    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...(parishes ? {
        parishes: {
          array_contains: parishes
        }
      } : {})
    };

    const alerts = await withRetry(async () => {
      return await this.prisma.alert.findMany({
        where,
        include: {
          deliveryLogs: {
            include: {
              user: true
            }
          }
        }
      });
    }, 'Get alert analytics');

    const analytics = {
      totalAlerts: alerts.length,
      alertsByType: {} as Record<AlertType, number>,
      alertsBySeverity: {} as Record<Severity, number>,
      averageDeliveryRate: 0,
      totalRecipients: 0,
      totalDelivered: 0,
      deliveryRateByParish: {} as Record<Parish, { sent: number; delivered: number; rate: number }>
    };

    // Initialize counters
    Object.values(AlertType).forEach(type => {
      analytics.alertsByType[type] = 0;
    });
    Object.values(Severity).forEach(severity => {
      analytics.alertsBySeverity[severity] = 0;
    });
    Object.values(Parish).forEach(parish => {
      analytics.deliveryRateByParish[parish] = { sent: 0, delivered: 0, rate: 0 };
    });

    // Process alerts
    alerts.forEach(alert => {
      analytics.alertsByType[alert.type]++;
      analytics.alertsBySeverity[alert.severity]++;
      analytics.totalRecipients += alert.recipientCount;
      analytics.totalDelivered += alert.deliveredCount;

      // Process delivery logs by parish
      alert.deliveryLogs.forEach(log => {
        const parish = log.user.parish;
        analytics.deliveryRateByParish[parish].sent++;
        if (log.status === 'DELIVERED' || log.status === 'SENT') {
          analytics.deliveryRateByParish[parish].delivered++;
        }
      });
    });

    // Calculate rates
    analytics.averageDeliveryRate = analytics.totalRecipients > 0 
      ? (analytics.totalDelivered / analytics.totalRecipients) * 100 
      : 0;

    Object.keys(analytics.deliveryRateByParish).forEach(parish => {
      const parishData = analytics.deliveryRateByParish[parish as Parish];
      parishData.rate = parishData.sent > 0 
        ? (parishData.delivered / parishData.sent) * 100 
        : 0;
    });

    return analytics;
  }

  /**
   * Clean up expired alerts
   */
  async cleanupExpiredAlerts(): Promise<number> {
    const result = await withRetry(async () => {
      return await this.prisma.alert.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Older than 30 days
          }
        }
      });
    }, 'Cleanup expired alerts');

    return result.count;
  }

  /**
   * Test alert service health
   */
  async testHealth(): Promise<{
    database: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  }> {
    try {
      // Test database connection
      await this.prisma.alert.count();
      
      // Test notification services
      const notificationHealth = await this.notificationService.testHealth();

      return {
        database: true,
        notifications: notificationHealth
      };
    } catch (error) {
      return {
        database: false,
        notifications: {
          email: false,
          sms: false,
          push: false
        }
      };
    }
  }

  /**
   * Close alert service
   */
  async close(): Promise<void> {
    await this.notificationService.close();
  }
}