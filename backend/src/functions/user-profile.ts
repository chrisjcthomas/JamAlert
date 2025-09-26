import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getUserById, updateUser } from '../services/user.service';
import { validateUserUpdate } from '../services/validation.service';
import { ApiResponse, UpdateUserData, AccessibilitySettings } from '../types';

export async function userProfile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const method = request.method;
    const userId = request.params.userId;

    if (!userId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'User ID is required'
        } as ApiResponse
      };
    }

    if (method === 'GET') {
      return await getUserProfile(userId, context);
    } else if (method === 'PUT') {
      return await updateUserProfile(request, userId, context);
    } else {
      return {
        status: 405,
        jsonBody: {
          success: false,
          error: 'Method not allowed'
        } as ApiResponse
      };
    }
  } catch (error) {
    context.log.error('User profile error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

async function getUserProfile(userId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: 'User not found'
        } as ApiResponse
      };
    }

    // Remove sensitive information
    const { id, ...userProfile } = user;
    
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: userProfile
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Get user profile error:', error);
    throw error;
  }
}

async function updateUserProfile(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as UpdateUserData;
    
    // Validate the update data
    const validation = validateUserUpdate(body);
    if (!validation.isValid) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Validation failed',
          data: validation.errors
        } as ApiResponse
      };
    }

    // Check if user exists
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return {
        status: 404,
        jsonBody: {
          success: false,
          error: 'User not found'
        } as ApiResponse
      };
    }

    // Update user
    const updatedUser = await updateUser(userId, body);
    
    // Remove sensitive information
    const { id, ...userProfile } = updatedUser;
    
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: userProfile,
        message: 'Profile updated successfully'
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Update user profile error:', error);
    throw error;
  }
}

// Register the function
app.http('user-profile', {
  methods: ['GET', 'PUT'],
  route: 'users/{userId}/profile',
  authLevel: 'anonymous',
  handler: userProfile
});