import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DashboardService } from '../services/dashboard.service';
import { requireAdminAuth } from '../middleware/auth.middleware';

/**
 * Admin dashboard data endpoint
 * GET /api/admin/dashboard
 */
export async function adminDashboard(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Admin dashboard request received');

  try {
    // Only allow GET method
    if (request.method !== 'GET') {
      return {
        status: 405,
        jsonBody: {
          success: false,
          message: 'Method not allowed'
        }
      };
    }

    // Authenticate admin user
    const authResult = await requireAdminAuth(request, context);
    if (!authResult.success) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          message: authResult.error || 'Authentication required'
        }
      };
    }

    // Initialize dashboard service
    const dashboardService = new DashboardService();

    // Get dashboard statistics
    const stats = await dashboardService.getDashboardStats();

    context.log('Dashboard stats retrieved successfully');

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: stats
      }
    };

  } catch (error) {
    context.error('Admin dashboard error:', error);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: 'Internal server error'
      }
    };
  }
}

// Register the function
app.http('admin-dashboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/dashboard',
  handler: adminDashboard
});