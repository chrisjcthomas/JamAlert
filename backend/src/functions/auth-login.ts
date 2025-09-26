import { app, HttpRequest, HttpResponse, InvocationContext } from '@azure/functions';
import { AdminService, AdminLoginData } from '../services/admin.service';
import { AuthMiddleware } from '../lib/auth';
import { ValidationService } from '../services/validation.service';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  message?: string;
}

/**
 * Admin login endpoint
 * POST /api/auth/login
 */
export async function authLogin(request: HttpRequest, context: InvocationContext): Promise<HttpResponse> {
  context.log('Admin login request received');

  try {
    // Only allow POST method
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: {
          success: false,
          message: 'Method not allowed'
        }
      };
    }

    // Parse request body
    const body = await request.text();
    let loginData: LoginRequest;

    try {
      loginData = JSON.parse(body);
    } catch (error) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Invalid JSON in request body'
        }
      };
    }

    // Validate required fields
    const validation = ValidationService.validateAdminLogin(loginData);
    if (!validation.isValid) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        }
      };
    }

    // Initialize admin service
    const adminService = new AdminService();

    // Authenticate admin
    const adminUser = await adminService.authenticateAdmin({
      email: loginData.email,
      password: loginData.password
    });

    if (!adminUser) {
      context.log('Authentication failed for email:', loginData.email);
      return {
        status: 401,
        jsonBody: {
          success: false,
          message: 'Invalid email or password'
        }
      };
    }

    // Generate JWT token
    const token = AuthMiddleware.generateAdminToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    context.log('Admin login successful for:', adminUser.email);

    const response: LoginResponse = {
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    };

    return {
      status: 200,
      jsonBody: response
    };

  } catch (error) {
    context.log.error('Admin login error:', error);

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
app.http('auth-login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: authLogin
});