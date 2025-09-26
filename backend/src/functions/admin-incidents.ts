import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DashboardService, IncidentReviewFilters } from '../services/dashboard.service';
import { requireAdminAuth, hasRole } from '../middleware/auth.middleware';
import { Parish, ReportStatus, Severity, IncidentType } from '@prisma/client';

/**
 * Admin incident review endpoint
 * GET /api/admin/incidents - List incident reports with pagination and filtering
 * PUT /api/admin/incidents/{reportId}/approve - Approve incident report
 * PUT /api/admin/incidents/{reportId}/reject - Reject incident report
 * PUT /api/admin/incidents/{reportId}/resolve - Mark incident as resolved
 */
export async function adminIncidents(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Admin incidents request received');

  try {
    // Early method validation for unsupported methods
    if (request.method !== 'GET' && request.method !== 'PUT') {
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
    if (!authResult || !authResult.success) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          message: authResult.error || 'Authentication required'
        }
      };
    }

    const dashboardService = new DashboardService();

    if (request.method === 'GET') {
      return await handleGetIncidents(request, context, dashboardService);
    } else if (request.method === 'PUT') {
      // Check if user has moderator role or higher for incident management
      if (!hasRole(authResult.user, 'MODERATOR')) {
        return {
          status: 403,
          jsonBody: {
            success: false,
            message: 'Moderator role or higher required for incident management'
          }
        };
      }

      return await handleIncidentAction(request, context, dashboardService, authResult.user!.id);
    } else {
      return {
        status: 405,
        jsonBody: {
          success: false,
          message: 'Method not allowed'
        }
      };
    }

  } catch (error) {
    context.error('Admin incidents error:', error);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: 'Internal server error'
      }
    };
  }
}

/**
 * Handle GET request for listing incident reports
 */
async function handleGetIncidents(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService
): Promise<HttpResponseInit> {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100 per page
    
    const filters: IncidentReviewFilters = {};
    
    const parish = url.searchParams.get('parish');
    if (parish && Object.values(Parish).includes(parish as Parish)) {
      filters.parish = parish as Parish;
    }
    
    const status = url.searchParams.get('status');
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      filters.status = status as ReportStatus;
    }
    
    const incidentType = url.searchParams.get('incidentType');
    if (incidentType && Object.values(IncidentType).includes(incidentType as IncidentType)) {
      filters.incidentType = incidentType;
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

    // Get incident reports with pagination
    const result = await dashboardService.getIncidentReports(page, limit, filters);

    context.log(`Retrieved ${result.reports.length} incident reports (page ${page})`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.reports,
        pagination: result.pagination
      }
    };

  } catch (error) {
    context.error('Get incidents error:', error);
    throw error;
  }
}

/**
 * Handle PUT request for incident actions (approve/reject/resolve)
 */
async function handleIncidentAction(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService,
  adminId: string
): Promise<HttpResponseInit> {
  try {
    // Extract report ID and action from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const reportIdIndex = pathParts.findIndex(part => part === 'incidents') + 1;
    const actionIndex = reportIdIndex + 1;
    
    if (reportIdIndex === 0 || pathParts.length <= actionIndex) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Invalid URL format. Expected: /api/admin/incidents/{reportId}/{action}'
        }
      };
    }

    const reportId = pathParts[reportIdIndex];
    const action = pathParts[actionIndex];

    if (!reportId || !action) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Report ID and action are required'
        }
      };
    }

    let newStatus: ReportStatus;
    let actionMessage: string;

    switch (action) {
      case 'approve':
        newStatus = ReportStatus.APPROVED;
        actionMessage = 'Incident report approved successfully';
        break;
      
      case 'reject':
        newStatus = ReportStatus.REJECTED;
        actionMessage = 'Incident report rejected successfully';
        break;
      
      case 'resolve':
        newStatus = ReportStatus.RESOLVED;
        actionMessage = 'Incident marked as resolved successfully';
        break;
      
      default:
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: 'Invalid action. Supported actions: approve, reject, resolve'
          }
        };
    }

    // Update incident status
    const result = await dashboardService.updateIncidentStatus(reportId, newStatus, adminId);

    context.log(`Incident ${action} completed for report ${reportId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: actionMessage,
        data: {
          id: result.id,
          status: result.status,
          updatedAt: result.updatedAt
        }
      }
    };

  } catch (error) {
    context.error('Incident action error:', error);
    
    if (error.message.includes('not found')) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          message: 'Incident report not found'
        }
      };
    }
    
    throw error;
  }
}

// Register the function
app.http('admin-incidents', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'admin/incidents/{*restOfPath}',
  handler: adminIncidents
});