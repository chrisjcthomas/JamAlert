import { app, HttpRequest, HttpResponse, InvocationContext } from '@azure/functions';
import { requireAdminAuth, createAuthErrorResponse } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';

interface ProfileResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    lastLogin: Date | null;
    createdAt: Date;
  };
  message?: string;
}

/**
 * Get admin profile endpoint (for token validation and user info)
 * GET /api/auth/profile
 */
export async function authProfile(request: HttpRequest, context: InvocationContext): Promise<HttpResponse> {
  context.log('Admin profile request received');

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
      return createAuthErrorResponse(authResult.error || 'Authentication failed');
    }

    // Get full admin profile
    const adminService = new AdminService();
    const adminUser = await adminService.getAdminById(authResult.user!.id);

    if (!adminUser) {
      return createAuthErrorResponse('Admin user not found', 404);
    }

    const response: ProfileResponse = {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        lastLogin: adminUser.lastLogin,
        createdAt: adminUser.createdAt
      }
    };

    return {
      status: 200,
      jsonBody: response
    };

  } catch (error) {
    context.log.error('Admin profile error:', error);

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
app.http('auth-profile', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/profile',
  handler: authProfile
});