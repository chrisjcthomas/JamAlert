import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { IncidentService } from '../services/incident.service';
import { Parish } from '@prisma/client';

const incidentService = new IncidentService();

export async function incidentsMapData(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Processing incident map data request');

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
    
    let parish: Parish | undefined;
    if (parishParam) {
      // Validate parish parameter
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

    // Get map data
    const result = await incidentService.getMapData(parish);

    if (!result.success) {
      context.log.error('Failed to fetch map data:', result.error);
      return {
        status: 500,
        jsonBody: result
      };
    }

    // Set cache headers for map data (cache for 5 minutes)
    return {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Content-Type': 'application/json'
      },
      jsonBody: {
        success: true,
        data: {
          incidents: result.data
        },
        message: result.message
      }
    };

  } catch (error) {
    context.log.error('Error processing map data request:', error);
    
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
app.http('incidents-map-data', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'incidents/map-data',
  handler: incidentsMapData
});