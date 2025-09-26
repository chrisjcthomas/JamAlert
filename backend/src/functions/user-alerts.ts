import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getUserAlertHistory, getUserAlertFeedback, submitAlertFeedback } from '../services/user.service';
import { ApiResponse, PaginatedResponse } from '../types';

export async function userAlerts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
      return await getUserAlertsHistory(request, userId, context);
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
    context.log.error('User alerts error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

export async function userAlertFeedback(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const method = request.method;
    const userId = request.params.userId;
    const alertId = request.params.alertId;

    if (!userId || !alertId) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'User ID and Alert ID are required'
        } as ApiResponse
      };
    }

    if (method === 'POST') {
      return await submitUserAlertFeedback(request, userId, alertId, context);
    } else if (method === 'GET') {
      return await getUserAlertFeedbackData(userId, alertId, context);
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
    context.log.error('User alert feedback error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      } as ApiResponse
    };
  }
}

async function getUserAlertsHistory(request: HttpRequest, userId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const type = url.searchParams.get('type') || undefined;
    const severity = url.searchParams.get('severity') || undefined;
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const result = await getUserAlertHistory(userId, {
      page,
      limit,
      type: type as any,
      severity: severity as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.alerts,
        pagination: result.pagination
      } as PaginatedResponse<any>
    };
  } catch (error) {
    context.log.error('Get user alerts history error:', error);
    throw error;
  }
}

async function submitUserAlertFeedback(request: HttpRequest, userId: string, alertId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const { rating, comment, wasAccurate, wasHelpful } = body;

    if (rating === undefined || wasAccurate === undefined || wasHelpful === undefined) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Rating, accuracy, and helpfulness feedback are required'
        } as ApiResponse
      };
    }

    const feedback = await submitAlertFeedback(userId, alertId, {
      rating: parseInt(rating),
      comment: comment || null,
      wasAccurate: Boolean(wasAccurate),
      wasHelpful: Boolean(wasHelpful)
    });

    return {
      status: 201,
      jsonBody: {
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully'
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Submit alert feedback error:', error);
    throw error;
  }
}

async function getUserAlertFeedbackData(userId: string, alertId: string, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const feedback = await getUserAlertFeedback(userId, alertId);
    
    return {
      status: 200,
      jsonBody: {
        success: true,
        data: feedback
      } as ApiResponse
    };
  } catch (error) {
    context.log.error('Get user alert feedback error:', error);
    throw error;
  }
}

// Register the functions
app.http('user-alerts', {
  methods: ['GET'],
  route: 'users/{userId}/alerts',
  authLevel: 'anonymous',
  handler: userAlerts
});

app.http('user-alert-feedback', {
  methods: ['GET', 'POST'],
  route: 'users/{userId}/alerts/{alertId}/feedback',
  authLevel: 'anonymous',
  handler: userAlertFeedback
});