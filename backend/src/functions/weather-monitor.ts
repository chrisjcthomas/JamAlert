import { app, InvocationContext, Timer } from '@azure/functions';
import { WeatherService } from '../services/weather.service';
import { getWeatherConfig } from '../lib/config';

/**
 * Scheduled function that monitors weather conditions every 15 minutes
 * and triggers alerts when thresholds are exceeded
 */
export async function weatherMonitor(myTimer: Timer, context: InvocationContext): Promise<void> {
  const startTime = Date.now();
  context.log('Weather monitoring function started', { timestamp: new Date().toISOString() });

  try {
    const weatherService = new WeatherService();
    const config = getWeatherConfig();

    // Step 1: Fetch current weather data for all parishes
    context.log('Fetching weather data for all parishes...');
    const weatherData = await weatherService.fetchAllWeatherData();
    
    if (weatherData.length === 0) {
      context.warn('No weather data retrieved - all API calls failed');
      return;
    }

    context.log(`Successfully fetched weather data for ${weatherData.length} parishes`);

    // Step 2: Store weather data in database with TTL
    context.log('Storing weather data in database...');
    await weatherService.storeWeatherData(weatherData);

    // Step 3: Check thresholds for all parishes
    context.log('Checking weather thresholds...');
    const thresholdChecks = await weatherService.checkThresholds(weatherData);
    
    const exceededCount = thresholdChecks.filter(check => check.exceeded).length;
    context.log(`Threshold checks completed: ${exceededCount} parishes exceeded thresholds`);

    // Step 4: Create weather alert records for threshold violations
    if (exceededCount > 0) {
      context.log('Creating weather alerts for threshold violations...');
      const alertIds = await weatherService.createWeatherAlerts(thresholdChecks);
      
      if (alertIds.length > 0) {
        context.log(`Created ${alertIds.length} weather alerts`, { alertIds });
        
        // Step 5: Trigger alert dispatch (this would call the alert dispatch function)
        // Note: In a real implementation, this would trigger the alert dispatch function
        // For now, we'll log the alerts that should be dispatched
        const exceededChecks = thresholdChecks.filter(check => check.exceeded);
        for (const check of exceededChecks) {
          context.log('Weather alert should be dispatched', {
            parish: check.parish,
            alertType: check.alertType,
            severity: check.severity,
            conditions: check.actual
          });
        }
      }
    }

    // Step 6: Clean up expired weather data
    context.log('Cleaning up expired weather data...');
    const cleanedCount = await weatherService.cleanupExpiredData();
    if (cleanedCount > 0) {
      context.log(`Cleaned up ${cleanedCount} expired weather records`);
    }

    const executionTime = Date.now() - startTime;
    context.log('Weather monitoring completed successfully', {
      executionTimeMs: executionTime,
      parishesProcessed: weatherData.length,
      thresholdViolations: exceededCount,
      alertsCreated: exceededCount > 0 ? thresholdChecks.filter(check => check.exceeded).length : 0,
      recordsCleaned: cleanedCount
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    context.error('Weather monitoring failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      executionTimeMs: executionTime
    });
    
    // In production, this would trigger an alert to administrators
    throw error;
  }
}

// Register the timer function to run every 15 minutes
app.timer('weatherMonitor', {
  schedule: '0 */15 * * * *', // Every 15 minutes
  handler: weatherMonitor,
  runOnStartup: false // Set to true for testing
});