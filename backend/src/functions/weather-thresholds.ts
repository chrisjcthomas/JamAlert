import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { WeatherService } from '../services/weather.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { Parish, FloodRisk } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const getThresholdsSchema = z.object({
  parish: z.nativeEnum(Parish).optional()
});

const updateThresholdsSchema = z.object({
  parish: z.nativeEnum(Parish),
  rainfallThreshold: z.number().min(0).max(500),
  windSpeedThreshold: z.number().min(0).max(300),
  floodRiskThreshold: z.nativeEnum(FloodRisk)
});

/**
 * Get weather thresholds for parishes
 * GET /api/admin/weather/thresholds?parish=KINGSTON
 */
export async function getWeatherThresholds(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' }
      };
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validation = getThresholdsSchema.safeParse(queryParams);
    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        }
      };
    }

    const weatherService = new WeatherService();

    if (validation.data.parish) {
      // Get thresholds for specific parish
      const thresholds = await weatherService.getThresholds(validation.data.parish);
      
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: thresholds
        }
      };
    } else {
      // Get thresholds for all parishes
      const allParishes = Object.values(Parish);
      const thresholdPromises = allParishes.map(async (parish) => {
        const thresholds = await weatherService.getThresholds(parish);
        return { parish, thresholds };
      });

      const results = await Promise.all(thresholdPromises);
      const thresholdMap = results.reduce((acc, { parish, thresholds }) => {
        acc[parish] = thresholds;
        return acc;
      }, {} as Record<Parish, any>);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: thresholdMap
        }
      };
    }

  } catch (error) {
    context.log.error('Error getting weather thresholds:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      }
    };
  }
}

/**
 * Update weather thresholds for a parish
 * PUT /api/admin/weather/thresholds
 */
export async function updateWeatherThresholds(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' }
      };
    }

    const body = await request.json() as any;
    const validation = updateThresholdsSchema.safeParse(body);
    
    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        }
      };
    }

    const { parish, rainfallThreshold, windSpeedThreshold, floodRiskThreshold } = validation.data;

    const weatherService = new WeatherService();
    const updatedThresholds = await weatherService.updateThresholds(parish, {
      rainfallThreshold,
      windSpeedThreshold,
      floodRiskThreshold
    });

    // Log the admin action
    context.log('Weather thresholds updated', {
      adminId: admin.id,
      parish,
      thresholds: {
        rainfallThreshold,
        windSpeedThreshold,
        floodRiskThreshold
      }
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: updatedThresholds,
        message: `Weather thresholds updated for ${parish}`
      }
    };

  } catch (error) {
    context.log.error('Error updating weather thresholds:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      }
    };
  }
}

/**
 * Get current weather data for parishes
 * GET /api/admin/weather/current?parish=KINGSTON
 */
export async function getCurrentWeather(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' }
      };
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    const validation = getThresholdsSchema.safeParse(queryParams);
    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        }
      };
    }

    const weatherService = new WeatherService();

    if (validation.data.parish) {
      // Get current weather for specific parish
      const cachedWeather = await weatherService.getCachedWeatherData(validation.data.parish);
      
      if (!cachedWeather) {
        // Fetch fresh data if no cached data available
        const freshWeather = await weatherService.fetchWeatherForParish(validation.data.parish);
        return {
          status: 200,
          jsonBody: {
            success: true,
            data: freshWeather,
            cached: false
          }
        };
      }

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: cachedWeather,
          cached: true
        }
      };
    } else {
      // Get current weather for all parishes (cached only to avoid API rate limits)
      const allParishes = Object.values(Parish);
      const weatherPromises = allParishes.map(async (parish) => {
        const weather = await weatherService.getCachedWeatherData(parish);
        return { parish, weather };
      });

      const results = await Promise.all(weatherPromises);
      const weatherMap = results.reduce((acc, { parish, weather }) => {
        if (weather) {
          acc[parish] = weather;
        }
        return acc;
      }, {} as Record<Parish, any>);

      return {
        status: 200,
        jsonBody: {
          success: true,
          data: weatherMap,
          cached: true
        }
      };
    }

  } catch (error) {
    context.log.error('Error getting current weather:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error'
      }
    };
  }
}

/**
 * Manually trigger weather check (for testing/emergency use)
 * POST /api/admin/weather/check
 */
export async function triggerWeatherCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    // Authenticate admin user
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' }
      };
    }

    const weatherService = new WeatherService();

    // Fetch fresh weather data
    context.log('Manual weather check triggered by admin', { adminId: admin.id });
    const weatherData = await weatherService.fetchAllWeatherData();
    
    if (weatherData.length === 0) {
      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Failed to fetch weather data from all sources'
        }
      };
    }

    // Store the data
    await weatherService.storeWeatherData(weatherData);

    // Check thresholds
    const thresholdChecks = await weatherService.checkThresholds(weatherData);
    const exceededCount = thresholdChecks.filter(check => check.exceeded).length;

    // Create alerts if needed
    let alertIds: string[] = [];
    if (exceededCount > 0) {
      alertIds = await weatherService.createWeatherAlerts(thresholdChecks);
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: {
          parishesChecked: weatherData.length,
          thresholdViolations: exceededCount,
          alertsCreated: alertIds.length,
          weatherData: weatherData,
          thresholdChecks: thresholdChecks.filter(check => check.exceeded)
        },
        message: 'Weather check completed successfully'
      }
    };

  } catch (error) {
    context.log.error('Error in manual weather check:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

// Register HTTP functions
app.http('getWeatherThresholds', {
  methods: ['GET'],
  route: 'admin/weather/thresholds',
  handler: getWeatherThresholds
});

app.http('updateWeatherThresholds', {
  methods: ['PUT'],
  route: 'admin/weather/thresholds',
  handler: updateWeatherThresholds
});

app.http('getCurrentWeather', {
  methods: ['GET'],
  route: 'admin/weather/current',
  handler: getCurrentWeather
});

app.http('triggerWeatherCheck', {
  methods: ['POST'],
  route: 'admin/weather/check',
  handler: triggerWeatherCheck
});