import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AlertService } from '../services/alert.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { ValidationService } from '../services/validation.service';
import { 
  AlertDispatchRequest, 
  ApiResponse, 
  Parish, 
  AlertType, 
  Severity 
} from '../types';

/**
 * Azure Function to dispatch alerts to users
 * POST /api/alerts/send
 */
export async function alertsSend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Alert dispatch function triggered');

  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request, context);
    if (!admin) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Unauthorized - Admin access required'
        } as ApiResponse
      };
    }

    // Validate request method
    if (request.method !== 'POST') {
      return {
        status: 405,
        jsonBody: {
          success: false,
          error: 'Method not allowed'
        } as ApiResponse
      };
    }

    // Parse and validate request body
    let requestData: AlertDispatchRequest;
    try {
      const body = await request.text();
      requestData = JSON.parse(body);
    } catch (error) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid JSON in request body'
        } as ApiResponse
      };
    }

    // Validate alert dispatch request
    const validation = validateAlertDispatchRequest(requestData);
    if (!validation.isValid) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Validation failed',
          details: validation.errors
        } as ApiResponse
      };
    }

    // Initialize alert service
    const alertService = new AlertService();

    try {
      // Dispatch the alert
      context.log(`Dispatching alert to parishes: ${requestData.parishes.join(', ')}`);
      
      const result = await alertService.dispatchAlert(requestData, admin.id);

      context.log(`Alert dispatched successfully. Alert ID: ${result.alert.id}, Recipients: ${result.dispatchResult.totalRecipients}, Success: ${result.dispatchResult.successCount}, Failed: ${result.dispatchResult.failureCount}`);

      // Return success response with dispatch results
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: {
            alert: {
              id: result.alert.id,
              type: result.alert.type,
              severity: result.alert.severity,
              title: result.alert.title,
              message: result.alert.message,
              parishes: result.alert.parishes,
              createdAt: result.alert.createdAt,
              expiresAt: result.alert.expiresAt,
              deliveryStatus: result.alert.deliveryStatus
            },
            dispatch: {
              totalRecipients: result.dispatchResult.totalRecipients,
              successCount: result.dispatchResult.successCount,
              failureCount: result.dispatchResult.failureCount,
              deliveryStats: result.dispatchResult.deliveryStats
            }
          },
          message: `Alert dispatched to ${result.dispatchResult.totalRecipients} recipients`
        } as ApiResponse
      };

    } catch (error) {
      context.log.error('Alert dispatch failed:', error);
      
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to dispatch alert',
          details: error.message
        } as ApiResponse
      };
    } finally {
      await alertService.close();
    }

  } catch (error) {
    context.log.error('Alert dispatch function error:', error);
    
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

/**
 * Validate alert dispatch request
 */
function validateAlertDispatchRequest(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!data.type) {
    errors.push('Alert type is required');
  } else if (!Object.values(AlertType).includes(data.type)) {
    errors.push('Invalid alert type');
  }

  if (!data.severity) {
    errors.push('Alert severity is required');
  } else if (!Object.values(Severity).includes(data.severity)) {
    errors.push('Invalid alert severity');
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Alert title is required and must be a string');
  } else if (data.title.length < 5 || data.title.length > 255) {
    errors.push('Alert title must be between 5 and 255 characters');
  }

  if (!data.message || typeof data.message !== 'string') {
    errors.push('Alert message is required and must be a string');
  } else if (data.message.length < 10 || data.message.length > 2000) {
    errors.push('Alert message must be between 10 and 2000 characters');
  }

  if (!data.parishes || !Array.isArray(data.parishes)) {
    errors.push('Parishes array is required');
  } else if (data.parishes.length === 0) {
    errors.push('At least one parish must be specified');
  } else {
    const invalidParishes = data.parishes.filter(parish => !Object.values(Parish).includes(parish));
    if (invalidParishes.length > 0) {
      errors.push(`Invalid parishes: ${invalidParishes.join(', ')}`);
    }
  }

  // Optional expiration date validation
  if (data.expiresAt) {
    const expirationDate = new Date(data.expiresAt);
    if (isNaN(expirationDate.getTime())) {
      errors.push('Invalid expiration date format');
    } else if (expirationDate <= new Date()) {
      errors.push('Expiration date must be in the future');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Register the function
app.http('alerts-send', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'alerts/send',
  handler: alertsSend
});