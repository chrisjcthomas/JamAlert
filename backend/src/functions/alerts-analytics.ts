import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AlertService } from '../services/alert.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { ApiResponse, Parish } from '../types';

/**
 * Azure Function to get alert analytics and delivery statistics
 * GET /api/alerts/analytics
 */
export async function alertsAnalytics(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Alert analytics function triggered');

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

    // Parse query parameters
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const parishesParam = url.searchParams.get('parishes');

    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
        } as ApiResponse
      };
    }

    if (startDate >= endDate) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Start date must be before end date'
        } as ApiResponse
      };
    }

    // Parse parishes filter
    let parishes: Parish[] | undefined;
    if (parishesParam) {
      try {
        const parishList = parishesParam.split(',').map(p => p.trim().toUpperCase());
        parishes = parishList.filter(parish => Object.values(Parish).includes(parish as Parish)) as Parish[];
        
        if (parishes.length === 0) {
          return {
            status: 400,
            jsonBody: {
              success: false,
              error: 'Invalid parishes specified'
            } as ApiResponse
          };
        }
      } catch (error) {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'Invalid parishes parameter format'
          } as ApiResponse
        };
      }
    }

    // Initialize alert service
    const alertService = new AlertService();

    try {
      // Get analytics data
      const analytics = await alertService.getAlertAnalytics(startDate, endDate, parishes);

      context.log(`Retrieved analytics for period ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Return analytics data
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            period: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              parishes: parishes || 'all'
            },
            summary: {
              totalAlerts: analytics.totalAlerts,
              totalRecipients: analytics.totalRecipients,
              totalDelivered: analytics.totalDelivered,
              averageDeliveryRate: Math.round(analytics.averageDeliveryRate * 100) / 100
            },
            breakdown: {
              byType: analytics.alertsByType,
              bySeverity: analytics.alertsBySeverity,
              byParish: Object.entries(analytics.deliveryRateByParish).map(([parish, stats]) => ({
                parish,
                sent: stats.sent,
                delivered: stats.delivered,
                deliveryRate: Math.round(stats.rate * 100) / 100
              }))
            }
          }
        } as ApiResponse
      };

    } catch (error) {
      context.log.error('Failed to get alert analytics:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to retrieve alert analytics',
          details: error.message
        } as ApiResponse
      };
    } finally {
      await alertService.close();
    }

  } catch (error) {
    context.log.error('Alert analytics function error:', error);
    
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
app.http('alerts-analytics', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'alerts/analytics',
  handler: alertsAnalytics
});