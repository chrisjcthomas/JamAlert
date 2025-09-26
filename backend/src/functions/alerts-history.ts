import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AlertService } from '../services/alert.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, Parish } from '../types';

/**
 * Azure Function to get alert history with pagination
 * GET /api/alerts/history
 */
export async function alertsHistory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Alert history function triggered');

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
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
    const parishesParam = url.searchParams.get('parishes');
    
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

    // Calculate offset
    const offset = (page - 1) * limit;

    // Initialize alert service
    const alertService = new AlertService();

    try {
      // Get alert history
      const result = await alertService.getRecentAlerts(limit, offset, parishes);

      context.log(`Retrieved ${result.alerts.length} alerts from history (page ${page}, limit ${limit})`);

      // Calculate pagination info
      const totalPages = Math.ceil(result.total / limit);

      // Return paginated results
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: result.alerts.map(alert => ({
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
            failedCount: alert.failedCount,
            deliveryStats: alert.deliveryStats
          })),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages
          }
        } as PaginatedResponse<any>
      };

    } catch (error) {
      context.log.error('Failed to get alert history:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to retrieve alert history',
          details: error.message
        } as ApiResponse
      };
    } finally {
      await alertService.close();
    }

  } catch (error) {
    context.log.error('Alert history function error:', error);
    
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
app.http('alerts-history', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'alerts/history',
  handler: alertsHistory
});