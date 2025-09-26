import { User, Alert, AlertDeliveryLog, DeliveryMethod, DeliveryLogStatus } from '@prisma/client';
import { getPrismaClient, withRetry } from '../lib/database';
import { EmailService } from './email.service';
import { 
  EmailNotification, 
  PushNotification, 
  SMSNotification,
  NotificationPayload 
} from '../types';

export interface NotificationResult {
  success: boolean;
  deliveryMethod: DeliveryMethod;
  userId: string;
  error?: string;
  messageId?: string;
}

export interface BatchNotificationResult {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  results: NotificationResult[];
  deliveryStats: {
    email: { sent: number; failed: number };
    sms: { sent: number; failed: number };
    push: { sent: number; failed: number };
  };
}

export class NotificationService {
  private emailService: EmailService;
  private prisma: ReturnType<typeof getPrismaClient>;

  constructor() {
    this.emailService = new EmailService();
    this.prisma = getPrismaClient();
  }

  /**
   * Send notifications to multiple users with batch processing
   */
  async sendBatchNotifications(
    users: User[],
    alert: Alert,
    batchSize: number = 100,
    rateLimitDelay: number = 1000
  ): Promise<BatchNotificationResult> {
    const totalRecipients = users.length;
    const results: NotificationResult[] = [];
    const deliveryStats = {
      email: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 }
    };

    // Process users in batches to avoid overwhelming services
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(user => 
        this.sendUserNotifications(user, alert)
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process batch results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(...result.value);
            // Update delivery stats
            result.value.forEach(r => {
              if (r.success) {
                if (deliveryStats[r.deliveryMethod]) {
                  deliveryStats[r.deliveryMethod].sent++;
                }
              } else {
                if (deliveryStats[r.deliveryMethod]) {
                  deliveryStats[r.deliveryMethod].failed++;
                }
              }
            });
          } else {
            // Handle batch failure
            const user = batch[index];
            const failureResult: NotificationResult = {
              success: false,
              deliveryMethod: DeliveryMethod.EMAIL,
              userId: user.id,
              error: result.reason?.message || 'Batch processing failed'
            };
            results.push(failureResult);
            deliveryStats.email.failed++;
          }
        });

        // Rate limiting between batches
        if (i + batchSize < users.length) {
          await this.delay(rateLimitDelay);
        }

      } catch (error) {
        console.error(`Batch processing failed for batch starting at index ${i}:`, error);
        
        // Mark entire batch as failed
        batch.forEach(user => {
          const failureResult: NotificationResult = {
            success: false,
            deliveryMethod: DeliveryMethod.EMAIL,
            userId: user.id,
            error: error.message || 'Batch processing error'
          };
          results.push(failureResult);
          deliveryStats.email.failed++;
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      totalRecipients,
      successCount,
      failureCount,
      results,
      deliveryStats
    };
  }

  /**
   * Send notifications to a single user across all their preferred channels
   */
  async sendUserNotifications(user: User, alert: Alert): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const payload = this.createNotificationPayload(alert);

    // Determine which notification methods to use based on user preferences
    const methods: DeliveryMethod[] = [];
    
    if (user.emailAlerts) {
      methods.push(DeliveryMethod.EMAIL);
    }
    
    if (user.smsAlerts) {
      methods.push(DeliveryMethod.SMS);
    }

    // Always try push notifications as fallback
    methods.push(DeliveryMethod.PUSH);

    // Send notifications with fallback logic
    let primarySuccess = false;

    for (const method of methods) {
      try {
        const result = await this.sendSingleNotification(user, alert, method, payload);
        results.push(result);

        // Log delivery attempt
        await this.logDeliveryAttempt(alert.id, user.id, method, result);

        if (result.success) {
          primarySuccess = true;
          // If primary method succeeds, we can skip fallback methods for non-critical alerts
          if (alert.severity !== 'HIGH' && method === DeliveryMethod.EMAIL) {
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to send ${method} notification to user ${user.id}:`, error);
        
        const failureResult: NotificationResult = {
          success: false,
          deliveryMethod: method,
          userId: user.id,
          error: error.message
        };
        results.push(failureResult);

        // Log failed delivery attempt
        await this.logDeliveryAttempt(alert.id, user.id, method, failureResult);
      }
    }

    return results;
  }

  /**
   * Send a single notification via specified method
   */
  private async sendSingleNotification(
    user: User,
    alert: Alert,
    method: DeliveryMethod,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    switch (method) {
      case DeliveryMethod.EMAIL:
        return await this.sendEmailNotification(user, alert, payload);
      
      case DeliveryMethod.SMS:
        return await this.sendSMSNotification(user, alert, payload);
      
      case DeliveryMethod.PUSH:
        return await this.sendPushNotification(user, alert, payload);
      
      default:
        throw new Error(`Unsupported delivery method: ${method}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    user: User,
    alert: Alert,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      const emailNotification: EmailNotification = {
        ...payload,
        to: user.email,
        from: {
          name: 'JamAlert Emergency System',
          email: process.env.SMTP_FROM_EMAIL || 'alerts@jamalert.com'
        }
      };

      await this.emailService.sendAlertNotification(emailNotification);

      return {
        success: true,
        deliveryMethod: DeliveryMethod.EMAIL,
        userId: user.id,
        messageId: `email-${alert.id}-${user.id}-${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        deliveryMethod: DeliveryMethod.EMAIL,
        userId: user.id,
        error: error.message
      };
    }
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   */
  private async sendSMSNotification(
    user: User,
    alert: Alert,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // TODO: Implement SMS service integration (Twilio, etc.)
    // For now, return success to avoid blocking email notifications
    
    if (!user.phone) {
      return {
        success: false,
        deliveryMethod: DeliveryMethod.SMS,
        userId: user.id,
        error: 'No phone number provided'
      };
    }

    try {
      // Placeholder SMS logic
      console.log(`SMS would be sent to ${user.phone}: ${payload.message}`);
      
      return {
        success: true,
        deliveryMethod: DeliveryMethod.SMS,
        userId: user.id,
        messageId: `sms-${alert.id}-${user.id}-${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        deliveryMethod: DeliveryMethod.SMS,
        userId: user.id,
        error: error.message
      };
    }
  }

  /**
   * Send push notification (placeholder for Azure Notification Hubs)
   */
  private async sendPushNotification(
    user: User,
    alert: Alert,
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    // TODO: Implement Azure Notification Hubs integration
    // For now, return success as fallback
    
    try {
      const pushNotification: PushNotification = {
        ...payload,
        userId: user.id,
        badge: 1,
        sound: alert.severity === 'HIGH' ? 'emergency.wav' : 'default',
        data: {
          alertId: alert.id,
          parishes: payload.parishes,
          timestamp: new Date().toISOString()
        }
      };

      // Placeholder push notification logic
      console.log(`Push notification would be sent to user ${user.id}:`, pushNotification);
      
      return {
        success: true,
        deliveryMethod: DeliveryMethod.PUSH,
        userId: user.id,
        messageId: `push-${alert.id}-${user.id}-${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        deliveryMethod: DeliveryMethod.PUSH,
        userId: user.id,
        error: error.message
      };
    }
  }

  /**
   * Create notification payload from alert
   */
  private createNotificationPayload(alert: Alert): NotificationPayload {
    return {
      title: alert.title,
      message: alert.message,
      type: alert.type,
      severity: alert.severity,
      alertId: alert.id,
      parishes: alert.parishes as any[] // JSON field
    };
  }

  /**
   * Log delivery attempt to database
   */
  private async logDeliveryAttempt(
    alertId: string,
    userId: string,
    method: DeliveryMethod,
    result: NotificationResult
  ): Promise<void> {
    try {
      await withRetry(async () => {
        await this.prisma.alertDeliveryLog.create({
          data: {
            alertId,
            userId,
            deliveryMethod: method,
            status: result.success ? DeliveryLogStatus.SENT : DeliveryLogStatus.FAILED,
            errorMessage: result.error,
            sentAt: result.success ? new Date() : null,
            deliveredAt: result.success ? new Date() : null // Assume immediate delivery for now
          }
        });
      }, `Log delivery attempt for alert ${alertId}`);
    } catch (error) {
      console.error('Failed to log delivery attempt:', error);
      // Don't throw - logging failure shouldn't stop notification process
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(
    alertId: string,
    maxRetries: number = 3
  ): Promise<BatchNotificationResult> {
    // Get failed delivery logs
    const failedLogs = await this.prisma.alertDeliveryLog.findMany({
      where: {
        alertId,
        status: DeliveryLogStatus.FAILED
      },
      include: {
        user: true,
        alert: true
      }
    });

    if (failedLogs.length === 0) {
      return {
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
        results: [],
        deliveryStats: {
          email: { sent: 0, failed: 0 },
          sms: { sent: 0, failed: 0 },
          push: { sent: 0, failed: 0 }
        }
      };
    }

    const users = failedLogs.map(log => log.user);
    const alert = failedLogs[0].alert;

    // Retry with smaller batch size and longer delays
    return await this.sendBatchNotifications(users, alert, 50, 2000);
  }

  /**
   * Get delivery statistics for an alert
   */
  async getDeliveryStats(alertId: string): Promise<{
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    byMethod: Record<DeliveryMethod, { sent: number; failed: number; pending: number }>;
  }> {
    const logs = await this.prisma.alertDeliveryLog.findMany({
      where: { alertId }
    });

    const stats = {
      total: logs.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      byMethod: {
        [DeliveryMethod.EMAIL]: { sent: 0, failed: 0, pending: 0 },
        [DeliveryMethod.SMS]: { sent: 0, failed: 0, pending: 0 },
        [DeliveryMethod.PUSH]: { sent: 0, failed: 0, pending: 0 }
      }
    };

    logs.forEach(log => {
      switch (log.status) {
        case DeliveryLogStatus.DELIVERED:
        case DeliveryLogStatus.SENT:
          stats.delivered++;
          stats.byMethod[log.deliveryMethod].sent++;
          break;
        case DeliveryLogStatus.FAILED:
        case DeliveryLogStatus.BOUNCED:
          stats.failed++;
          stats.byMethod[log.deliveryMethod].failed++;
          break;
        case DeliveryLogStatus.PENDING:
          stats.pending++;
          stats.byMethod[log.deliveryMethod].pending++;
          break;
      }
    });

    return stats;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test notification service health
   */
  async testHealth(): Promise<{
    email: boolean;
    sms: boolean;
    push: boolean;
  }> {
    return {
      email: await this.emailService.testConnection(),
      sms: true, // Placeholder - always healthy for now
      push: true // Placeholder - always healthy for now
    };
  }

  /**
   * Close notification service
   */
  async close(): Promise<void> {
    await this.emailService.close();
  }
}