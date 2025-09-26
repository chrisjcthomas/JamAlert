import { app, HttpRequest, HttpResponse, InvocationContext } from '@azure/functions';
import { DashboardService } from '../services/dashboard.service';
import { requireAdminAuth, hasRole } from '../middleware/auth.middleware';

/**
 * Admin audit logs endpoint
 * GET /api/admin/audit - Get audit logs with pagination and filtering
 */
export async function adminAudit(request: HttpRequest, context: InvocationContext): Promise<HttpResponse> {
  context.log('Admin audit logs request received');

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

    // Check if user has admin role for audit log access
    if (!hasRole(authResult.user, 'ADMIN')) {
      return {
        status: 403,
        body: JSON.stringify({
          success: false,
          message: 'Admin role required for audit log access'
        })
      };
    }

    const dashboardService = new DashboardService();

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200); // Max 200 per page for audit logs
    
    const adminId = url.searchParams.get('adminId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const resource = url.searchParams.get('resource') || undefined;
    
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

    // Get audit logs with pagination and filtering
    const result = await dashboardService.getAuditLogs(
      page,
      limit,
      adminId,
      action,
      resource,
      dateFrom,
      dateTo
    );

    context.log(`Retrieved ${result.logs.length} audit log entries (page ${page})`);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: result.logs,
        pagination: result.pagination
      })
    };

  } catch (error) {
    context.log.error('Admin audit logs error:', error);

    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      })
    };
  }
}

// Register the function
app.http('admin-audit', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'admin/audit',
  handler: adminAudit
});