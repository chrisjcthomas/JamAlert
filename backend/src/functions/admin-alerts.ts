import { app, HttpRequest, HttpResponse, InvocationContext } from '@azure/functions';
import { DashboardService, AlertHistoryFilters } from '../services/dashboard.service';
import { requireAdminAuth } from '../middleware/auth.middleware';
import { Parish, AlertType, Severity } from '@prisma/client';

/**
 * Admin alert management endpoint
 * GET /api/admin/alerts/history - Get alert history with pagination and filtering
 * GET /api/admin/alerts/statistics - Get alert statistics and analytics
 */
export async function adminAlerts(request: HttpRequest, context: InvocationContext): Promise<HttpResponse> {
  context.log('Admin alerts request received');

  try {
    // Only allow GET method
    if (request.method !== 'GET') {
      return {
        status: 405,
        body: JSON.stringify({
          success: false,
          message: 'Method not allowed'
        })
      };
    }

    // Authenticate admin user
    const authResult = await requireAdminAuth(request, context);
    if (!authResult.success) {
      return {
        status: 401,
        body: JSON.stringify({
          success: false,
          message: authResult.error || 'Authentication required'
        })
      };
    }

    const dashboardService = new DashboardService();
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const endpoint = pathParts[pathParts.length - 1];

    if (endpoint === 'history') {
      return await handleGetAlertHistory(request, context, dashboardService);
    } else if (endpoint === 'statistics') {
      return await handleGetAlertStatistics(request, context, dashboardService);
    } else {
      return {
        status: 404,
        body: JSON.stringify({
          success: false,
          message: 'Endpoint not found. Available endpoints: /history, /statistics'
        })
      };
    }

  } catch (error) {
    context.log.error('Admin alerts error:', error);

    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      })
    };
  }
}

/**
 * Handle GET request for alert history
 */
async function handleGetAlertHistory(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService
): Promise<HttpResponse> {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100 per page
    
    const filters: AlertHistoryFilters = {};
    
    const parish = url.searchParams.get('parish');
    if (parish && Object.values(Parish).includes(parish as Parish)) {
      filters.parish = parish as Parish;
    }
    
    const type = url.searchParams.get('type');
    if (type && Object.values(AlertType).includes(type as AlertType)) {
      filters.type = type as AlertType;
    }
    
    const severity = url.searchParams.get('severity');
    if (severity && Object.values(Severity).includes(severity as Severity)) {
      filters.severity = severity as Severity;
    }
    
    const dateFrom = url.searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }
    
    const dateTo = url.searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    // Get alert history with pagination
    const result = await dashboardService.getAlertHistory(page, limit, filters);

    context.log(`Retrieved ${result.alerts.length} alerts (page ${page})`);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: result.alerts,
        pagination: result.pagination
      })
    };

  } catch (error) {
    context.log.error('Get alert history error:', error);
    throw error;
  }
}

/**
 * Handle GET request for alert statistics
 */
async function handleGetAlertStatistics(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService
): Promise<HttpResponse> {
  try {
    // Parse query parameters for date range
    const url = new URL(request.url);
    
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    
    const dateFromParam = url.searchParams.get('dateFrom');
    if (dateFromParam) {
      dateFrom = new Date(dateFromParam);
    }
    
    const dateToParam = url.searchParams.get('dateTo');
    if (dateToParam) {
      dateTo = new Date(dateToParam);
    }

    // Get alert statistics
    const statistics = await dashboardService.getAlertStatistics(dateFrom, dateTo);

    context.log('Alert statistics retrieved successfully');

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: statistics
      })
    };

  } catch (error) {
    context.log.error('Get alert statistics error:', error);
    throw error;
  }
}

// Register the function
app.http('admin-alerts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/alerts/{endpoint}',
  handler: adminAlerts
});