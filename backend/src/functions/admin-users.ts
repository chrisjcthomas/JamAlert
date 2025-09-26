import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DashboardService, UserManagementFilters } from '../services/dashboard.service';
import { requireAdminAuth, hasRole } from '../middleware/auth.middleware';
import { Parish } from '@prisma/client';

/**
 * Admin user management endpoint
 * GET /api/admin/users - List users with pagination and filtering
 * PUT /api/admin/users/{userId}/deactivate - Deactivate user
 * PUT /api/admin/users/{userId}/reactivate - Reactivate user
 */
export async function adminUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Admin users request received');

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
      return await handleGetUsers(request, context, dashboardService);
    } else if (request.method === 'PUT') {
      // Check if user has admin role for user management
      if (!hasRole(authResult.user, 'ADMIN')) {
        return {
          status: 403,
          jsonBody: {
            success: false,
            message: 'Admin role required for user management'
          }
        };
      }

      return await handleUserAction(request, context, dashboardService, authResult.user!.id);
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
    context.error('Admin users error:', error);

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
 * Handle GET request for listing users
 */
async function handleGetUsers(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService
): Promise<HttpResponseInit> {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Max 100 per page
    
    const filters: UserManagementFilters = {};
    
    const parish = url.searchParams.get('parish');
    if (parish && Object.values(Parish).includes(parish as Parish)) {
      filters.parish = parish as Parish;
    }
    
    const isActive = url.searchParams.get('isActive');
    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }
    
    const search = url.searchParams.get('search');
    if (search) {
      filters.search = search.trim();
    }

    // Get users with pagination
    const result = await dashboardService.getUsers(page, limit, filters);

    context.log(`Retrieved ${result.users.length} users (page ${page})`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.users,
        pagination: result.pagination
      }
    };

  } catch (error) {
    context.error('Get users error:', error);
    throw error;
  }
}

/**
 * Handle PUT request for user actions (deactivate/reactivate)
 */
async function handleUserAction(
  request: HttpRequest,
  context: InvocationContext,
  dashboardService: DashboardService,
  adminId: string
): Promise<HttpResponseInit> {
  try {
    // Extract user ID and action from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const userIdIndex = pathParts.findIndex(part => part === 'users') + 1;
    const actionIndex = userIdIndex + 1;
    
    if (userIdIndex === 0 || pathParts.length <= actionIndex) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Invalid URL format. Expected: /api/admin/users/{userId}/{action}'
        }
      };
    }

    const userId = pathParts[userIdIndex];
    const action = pathParts[actionIndex];

    if (!userId || !action) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'User ID and action are required'
        }
      };
    }

    let result;
    let actionMessage;

    switch (action) {
      case 'deactivate':
        result = await dashboardService.deactivateUser(userId, adminId);
        actionMessage = 'User deactivated successfully';
        break;
      
      case 'reactivate':
        result = await dashboardService.reactivateUser(userId, adminId);
        actionMessage = 'User reactivated successfully';
        break;
      
      default:
        return {
          status: 400,
          jsonBody: {
            success: false,
            message: 'Invalid action. Supported actions: deactivate, reactivate'
          }
        };
    }

    context.log(`User ${action} completed for user ${userId}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: actionMessage,
        data: {
          id: result.id,
          email: result.email,
          isActive: result.isActive
        }
      }
    };

  } catch (error) {
    context.error('User action error:', error);
    
    if (error.message.includes('not found')) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          message: 'User not found'
        }
      };
    }
    
    throw error;
  }
}

// Register the function
app.http('admin-users', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'admin/users/{*restOfPath}',
  handler: adminUsers
});