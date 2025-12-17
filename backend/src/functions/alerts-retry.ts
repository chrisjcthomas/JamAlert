import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AlertService } from '../services/alert.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';

/**
 * Azure Function to retry failed alert deliveries
 * POST /api/alerts/retry/{alertId}
 */
export async function alertsRetry(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Alert retry function triggered');

  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request, context);
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
    if (request.method !== 'POST') {
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
      // Check if alert exists
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

      // Check if alert has failed deliveries to retry
      if (!alert.deliveryStats || alert.deliveryStats.failed === 0) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'No failed deliveries to retry for this alert'
          } as ApiResponse
        };
      }

      context.log(`Retrying failed deliveries for alert ID: ${alertId}`);

      // Retry failed deliveries
      const retryResult = await alertService.retryAlertDelivery(alertId);

      context.log(`Alert retry completed. Success: ${retryResult.successCount}, Failed: ${retryResult.failureCount}`);

      // Return retry results
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            alertId,
            retryResult: {
              totalRetried: retryResult.totalRecipients,
              successCount: retryResult.successCount,
              failureCount: retryResult.failureCount,
              deliveryStats: retryResult.deliveryStats
            }
          },
          message: `Retry completed: ${retryResult.successCount} successful, ${retryResult.failureCount} failed`
        } as ApiResponse
      };

    } catch (error) {
      context.log.error('Failed to retry alert deliveries:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to retry alert deliveries',
          details: error.message
        } as ApiResponse
      };
    } finally {
      await alertService.close();
    }

  } catch (error) {
    context.log.error('Alert retry function error:', error);
    
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
app.http('alerts-retry', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'alerts/retry/{alertId}',
  handler: alertsRetry
});