import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { IncidentService } from '../services/incident.service';
import { Parish, IncidentType, ReportStatus } from '@prisma/client';

const incidentService = new IncidentService();

export async function incidentsList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing incidents list request');

  try {
    // Only allow GET requests
    if (request.method !== 'GET') {
      return {
        status: 405,
        jsonBody: {
          success: false,
          error: 'Method not allowed'
        }
      };
    }

    // Get query parameters
    const url = new URL(request.url);
    const parishParam = url.searchParams.get('parish');
    const statusParam = url.searchParams.get('status');
    const typeParam = url.searchParams.get('type');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    // Validate and parse parameters
    let parish: Parish | undefined;
    if (parishParam) {
      const parishUpper = parishParam.toUpperCase();
      if (Object.values(Parish).includes(parishUpper as Parish)) {
        parish = parishUpper as Parish;
      } else {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'Invalid parish parameter'
          }
        };
      }
    }

    let status: ReportStatus | undefined;
    if (statusParam) {
      const statusUpper = statusParam.toUpperCase();
      if (Object.values(ReportStatus).includes(statusUpper as ReportStatus)) {
        status = statusUpper as ReportStatus;
      } else {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'Invalid status parameter'
          }
        };
      }
    }

    let incidentType: IncidentType | undefined;
    if (typeParam) {
      const typeUpper = typeParam.toUpperCase();
      if (Object.values(IncidentType).includes(typeUpper as IncidentType)) {
        incidentType = typeUpper as IncidentType;
      } else {
        return {
          status: 400,
          jsonBody: {
            success: false,
            error: 'Invalid incident type parameter'
          }
        };
      }
    }

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20;

    // Get incidents
    const result = await incidentService.getIncidentReports({
      parish,
      status,
      incidentType,
      page,
      limit
    });

    if (!result.success) {
      context.log.error('Failed to fetch incidents:', result.error);
      return {
        status: 500,
        jsonBody: result
      };
    }

    // Calculate pagination info
    const total = result.data?.length || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        message: result.message
      }
    };

  } catch (error) {
    context.log.error('Error processing incidents list request:', error);
    
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      }
    };
  }
}

// Register the function
app.http('incidents-list', {
  methods: ['GET'],
  authLevel: 'anonymous', // TODO: Change to 'function' or add admin auth when admin system is implemented
  route: 'incidents/list',
  handler: incidentsList
});