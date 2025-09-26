import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getUserById, updateUser, deactivateUser } from '../services/user.service';
import { ApiResponse } from '../types';

export async function userUnsubscribe(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

    if (method === 'POST') {
      return await processUnsubscribe(request, userId, context);
    } else if (method === 'GET') {
      return await getUnsubscribeInfo(userId, context);
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
    context.log.error('User unsubscribe error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

async function getUnsubscribeInfo(userId: string, context: InvocationContext): Promise<HttpResponseInit> {
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

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          parish: user.parish,
          emailAlerts: user.emailAlerts,
          smsAlerts: user.smsAlerts,
          emergencyOnly: user.emergencyOnly,
          isActive: user.isActive
        }
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Get unsubscribe info error:', error);
    throw error;
  }
}

async function processUnsubscribe(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const { action, reason, feedback } = body;

    if (!action || !['partial', 'complete'].includes(action)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Valid action (partial or complete) is required'
        } as ApiResponse
      };
    }

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

    let result;
    let message;

    if (action === 'partial') {
      // Partial unsubscribe - turn off non-emergency alerts
      result = await updateUser(userId, {
        emergencyOnly: true,
        emailAlerts: true, // Keep emergency alerts via email
        smsAlerts: false   // Turn off SMS for partial unsubscribe
      });
      message = 'You will now only receive emergency alerts via email';
    } else {
      // Complete unsubscribe - deactivate account
      result = await deactivateUser(userId, reason, feedback);
      message = 'You have been successfully unsubscribed from all alerts';
    }

    // Log the unsubscribe action for analytics
    context.log.info('User unsubscribe:', {
      userId,
      action,
      reason,
      timestamp: new Date().toISOString()
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          action,
          isActive: result.isActive,
          emergencyOnly: result.emergencyOnly,
          emailAlerts: result.emailAlerts,
          smsAlerts: result.smsAlerts
        },
        message
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Process unsubscribe error:', error);
    throw error;
  }
}

// Register the function
app.http('user-unsubscribe', {
  methods: ['GET', 'POST'],
  route: 'users/{userId}/unsubscribe',
  authLevel: 'anonymous',
  handler: userUnsubscribe
});