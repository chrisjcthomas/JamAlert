import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AlertService } from '../services/alert.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

/**
 * Azure Function to get alert delivery status
 * GET /api/alerts/status/{alertId}
 */
export async function alertsStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Alert status function triggered');

  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Unauthorized - Admin access required'
        } as ApiResponse
      };
    }

    // Validate request method
    if (request.method !== 'GET') {
      return {
        status: 405,
        jsonBody: {
          success: false,
          error: 'Method not allowed'
        } as ApiResponse
      };
    }

    // Get alert ID from route parameters
    const alertId = request.params.alertId;
    if (!alertId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Alert ID is required'
        } as ApiResponse
      };
    }

    // Validate alert ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(alertId)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid alert ID format'
        } as ApiResponse
      };
    }

    // Initialize alert service
    const alertService = new AlertService();

    try {
      // Get alert with delivery stats
      const alert = await alertService.getAlertById(alertId);

      if (!alert) {
        return {
          status: 404,
          jsonBody: {
            success: false,
            error: 'Alert not found'
          } as ApiResponse
        };
      }

      context.log(`Retrieved alert status for ID: ${alertId}`);

      // Return alert status with delivery statistics
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            alert: {
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              title: alert.title,
              message: alert.message,
              parishes: alert.parishes,
              createdAt: alert.createdAt,
              expiresAt: alert.expiresAt,
              deliveryStatus: alert.deliveryStatus,
              recipientCount: alert.recipientCount,
              deliveredCount: alert.deliveredCount,
              failedCount: alert.failedCount
            },
            deliveryStats: alert.deliveryStats || {
              total: 0,
              delivered: 0,
              failed: 0,
              pending: 0
            }
          }
        } as ApiResponse
      };

    } catch (error) {
      context.log.error('Failed to get alert status:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to retrieve alert status',
          details: error.message
        } as ApiResponse
      };
    } finally {
      await alertService.close();
    }

  } catch (error) {
    context.log.error('Alert status function error:', error);
    
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

// Register the function
app.http('alerts-status', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'alerts/status/{alertId}',
  handler: alertsStatus
});