import { HttpRequest, InvocationContext } from '@azure/functions';
import { AuthMiddleware } from '../lib/auth';
import { AdminService } from '../services/admin.service';


export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    type: 'admin' | 'user';
  };
  error?: string;
}

/**
 * Middleware for protecting admin routes
 */
export async function requireAdminAuth(
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is required'
      };
    }

    // Validate admin token
    const tokenPayload = await AuthMiddleware.validateAdminToken(authHeader);

    if (!tokenPayload) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Verify admin user still exists and is active
    const adminService = new AdminService();
    const adminUser = await adminService.getAdminById(tokenPayload.userId);

    if (!adminUser || !adminUser.isActive) {
      return {
        success: false,
        error: 'Admin user not found or inactive'
      };
    }

    return {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        type: 'admin'
      }
    };

  } catch (error) {
    context.error('Admin authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Middleware for protecting user routes (for future use)
 */
export async function requireUserAuth(
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is required'
      };
    }

    // Validate user token
    const tokenPayload = await AuthMiddleware.validateUserToken(authHeader);

    if (!tokenPayload) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    return {
      success: true,
      user: {
        id: tokenPayload.userId,
        email: tokenPayload.email,
        role: 'user',
        type: 'user'
      }
    };

  } catch (error) {
    context.error('User authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Middleware for optional authentication (allows both authenticated and anonymous access)
 */
export async function optionalAuth(
  request: HttpRequest,
  context: InvocationContext
): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return { success: true }; // No auth required, continue as anonymous
    }

    // Try admin auth first
    const adminAuth = await requireAdminAuth(request, context);
    if (adminAuth.success) {
      return adminAuth;
    }

    // Try user auth
    const userAuth = await requireUserAuth(request, context);
    if (userAuth.success) {
      return userAuth;
    }

    // Invalid token provided, but we allow anonymous access
    return { success: true };

  } catch (error) {
    context.error('Optional authentication error:', error);
    return { success: true }; // Continue as anonymous on error
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthResult['user'], requiredRole: string): boolean {
  if (!user) {
    return false;
  }

  // Admin roles hierarchy: ADMIN > MODERATOR
  if (requiredRole === 'MODERATOR') {
    return user.role === 'ADMIN' || user.role === 'MODERATOR';
  }

  if (requiredRole === 'ADMIN') {
    return user.role === 'ADMIN';
  }

  return user.role === requiredRole;
}

/**
 * Helper function to create authentication error response
 */
export function createAuthErrorResponse(error: string, status: number = 401) {
  return {
    status,
    jsonBody: {
      success: false,
      message: error
    }
  };
}

/**
 * Helper function to create forbidden error response
 */
export function createForbiddenResponse(message: string = 'Insufficient permissions') {
  return {
    status: 403,
    jsonBody: {
      success: false,
      message
    }
  };
}

// Backward-compatible alias for tests expecting authenticateAdmin
export { requireAdminAuth as authenticateAdmin };
