import { weatherMonitor } from '../weather-monitor';
import { WeatherService } from '../../services/weather.service';
import { getWeatherConfig } from '../../lib/config';
import { InvocationContext, Timer } from '@azure/functions';
import { Parish, FloodRisk, WeatherAlertType, Severity } from '@prisma/client';

// Mock dependencies
jest.mock('../../services/weather.service');
jest.mock('../../lib/config');

const MockedWeatherService = WeatherService as jest.MockedClass<typeof WeatherService>;
const mockedGetWeatherConfig = getWeatherConfig as jest.MockedFunction<typeof getWeatherConfig>;

describe('weatherMonitor', () => {
  let mockWeatherService: jest.Mocked<WeatherService>;
  let mockContext: any;
  let mockTimer: Timer;

  const mockConfig = {
    apiKey: 'test-api-key',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    jamaicaMetUrl: 'https://met.gov.jm/api',
    checkIntervalMinutes: 15,
    floodThresholdMm: 50,
    windThresholdKmh: 60,
    cacheTtlSeconds: 900
  };

  const mockWeatherData = [
    {
      parish: Parish.KINGSTON,
      temperature: 28.5,
      humidity: 75,
      rainfall: 25.5,
      windSpeed: 30.6,
      windDirection: 'S',
      pressure: 1013,
      visibility: 5,
      conditions: 'Heavy Rain',
      floodRisk: FloodRisk.LOW,
      recordedAt: new Date()
    },
    {
      parish: Parish.ST_ANDREW,
      temperature: 27.0,
      humidity: 80,
      rainfall: 65.0, // High rainfall
      windSpeed: 45.0,
      windDirection: 'SW',
      pressure: 1010,
      visibility: 3,
      conditions: 'Heavy Rain',
      floodRisk: FloodRisk.HIGH,
      recordedAt: new Date()
    }
  ];

  const mockThresholdChecks = [
    {
      parish: Parish.KINGSTON,
      exceeded: false,
      thresholds: {
        rainfall: 50,
        windSpeed: 60,
        floodRisk: FloodRisk.MEDIUM
      },
      actual: {
        rainfall: 25.5,
        windSpeed: 30.6,
        floodRisk: FloodRisk.LOW
      }
    },
    {
      parish: Parish.ST_ANDREW,
      exceeded: true,
      thresholds: {
        rainfall: 50,
        windSpeed: 60,
        floodRisk: FloodRisk.MEDIUM
      },
      actual: {
        rainfall: 65.0,
        windSpeed: 45.0,
        floodRisk: FloodRisk.HIGH
      },
      alertType: WeatherAlertType.HEAVY_RAIN,
      severity: Severity.MEDIUM
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock config
    mockedGetWeatherConfig.mockReturnValue(mockConfig);

    // Mock WeatherService
    mockWeatherService = {
      fetchAllWeatherData: jest.fn(),
      storeWeatherData: jest.fn(),
      checkThresholds: jest.fn(),
      createWeatherAlerts: jest.fn(),
      cleanupExpiredData: jest.fn()
    } as any;

    MockedWeatherService.mockImplementation(() => mockWeatherService);

    // Mock context
    mockContext = {
      log: jest.fn(),
      executionContext: {
        invocationId: 'test-invocation-id',
        functionName: 'weatherMonitor',
        functionDirectory: '/test'
      }
    } as any;

    mockContext.log.warn = jest.fn();
    mockContext.warn = mockContext.log.warn;
    mockContext.log.error = jest.fn();
    mockContext.error = mockContext.log.error;

    // Mock timer
    mockTimer = {
      isPastDue: false,
      schedule: { adjustForDST: false },
      scheduleStatus: {
        last: new Date().toISOString(),
        next: new Date(Date.now() + 900000).toISOString(), // 15 minutes from now
        lastUpdated: new Date().toISOString()
      }
    };
  });

  describe('successful execution', () => {
    it('should complete weather monitoring successfully', async () => {
      // Setup mocks for successful execution
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(mockThresholdChecks);
      mockWeatherService.createWeatherAlerts.mockResolvedValueOnce(['alert-1']);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(3);

      await weatherMonitor(mockTimer, mockContext);

      // Verify all steps were executed
      expect(mockWeatherService.fetchAllWeatherData).toHaveBeenCalledTimes(1);
      expect(mockWeatherService.storeWeatherData).toHaveBeenCalledWith(mockWeatherData);
      expect(mockWeatherService.checkThresholds).toHaveBeenCalledWith(mockWeatherData);
      expect(mockWeatherService.createWeatherAlerts).toHaveBeenCalledWith(mockThresholdChecks);
      expect(mockWeatherService.cleanupExpiredData).toHaveBeenCalledTimes(1);

      // Verify logging
      expect(mockContext.log).toHaveBeenCalledWith('Weather monitoring function started', {
        timestamp: expect.any(String)
      });
      expect(mockContext.log).toHaveBeenCalledWith('Successfully fetched weather data for 2 parishes');
      expect(mockContext.log).toHaveBeenCalledWith('Threshold checks completed: 1 parishes exceeded thresholds');
      expect(mockContext.log).toHaveBeenCalledWith('Created 1 weather alerts', { alertIds: ['alert-1'] });
      expect(mockContext.log).toHaveBeenCalledWith('Cleaned up 3 expired weather records');
      expect(mockContext.log).toHaveBeenCalledWith('Weather monitoring completed successfully', {
        executionTimeMs: expect.any(Number),
        parishesProcessed: 2,
        thresholdViolations: 1,
        alertsCreated: 1,
        recordsCleaned: 3
      });
    });

    it('should handle case with no threshold violations', async () => {
      const noViolationsChecks = mockThresholdChecks.map(check => ({ ...check, exceeded: false }));

      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(noViolationsChecks);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(0);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockWeatherService.createWeatherAlerts).not.toHaveBeenCalled();
      expect(mockContext.log).toHaveBeenCalledWith('Threshold checks completed: 0 parishes exceeded thresholds');
    });

    it('should handle case with no expired data to clean', async () => {
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce([]);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(0);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log).not.toHaveBeenCalledWith(expect.stringContaining('Cleaned up'));
    });
  });

  describe('error handling', () => {
    it('should handle case when no weather data is retrieved', async () => {
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce([]);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith('No weather data retrieved - all API calls failed');
      expect(mockWeatherService.storeWeatherData).not.toHaveBeenCalled();
      expect(mockWeatherService.checkThresholds).not.toHaveBeenCalled();
    });

    it('should handle weather data fetch failure', async () => {
      const error = new Error('Weather API failed');
      mockWeatherService.fetchAllWeatherData.mockRejectedValueOnce(error);

      await expect(weatherMonitor(mockTimer, mockContext)).rejects.toThrow('Weather API failed');

      expect(mockContext.log.error).toHaveBeenCalledWith('Weather monitoring failed', {
        error: 'Weather API failed',
        stack: expect.any(String),
        executionTimeMs: expect.any(Number)
      });
    });

    it('should handle database storage failure', async () => {
      const error = new Error('Database connection failed');
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockRejectedValueOnce(error);

      await expect(weatherMonitor(mockTimer, mockContext)).rejects.toThrow('Database connection failed');

      expect(mockContext.log.error).toHaveBeenCalledWith('Weather monitoring failed', {
        error: 'Database connection failed',
        stack: expect.any(String),
        executionTimeMs: expect.any(Number)
      });
    });

    it('should handle threshold checking failure', async () => {
      const error = new Error('Threshold check failed');
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockRejectedValueOnce(error);

      await expect(weatherMonitor(mockTimer, mockContext)).rejects.toThrow('Threshold check failed');

      expect(mockContext.log.error).toHaveBeenCalledWith('Weather monitoring failed', {
        error: 'Threshold check failed',
        stack: expect.any(String),
        executionTimeMs: expect.any(Number)
      });
    });

    it('should handle alert creation failure', async () => {
      const error = new Error('Alert creation failed');
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(mockThresholdChecks);
      mockWeatherService.createWeatherAlerts.mockRejectedValueOnce(error);

      await expect(weatherMonitor(mockTimer, mockContext)).rejects.toThrow('Alert creation failed');

      expect(mockContext.log.error).toHaveBeenCalledWith('Weather monitoring failed', {
        error: 'Alert creation failed',
        stack: expect.any(String),
        executionTimeMs: expect.any(Number)
      });
    });

    it('should handle cleanup failure gracefully', async () => {
      const error = new Error('Cleanup failed');
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce([]);
      mockWeatherService.cleanupExpiredData.mockRejectedValueOnce(error);

      await expect(weatherMonitor(mockTimer, mockContext)).rejects.toThrow('Cleanup failed');

      expect(mockContext.log.error).toHaveBeenCalledWith('Weather monitoring failed', {
        error: 'Cleanup failed',
        stack: expect.any(String),
        executionTimeMs: expect.any(Number)
      });
    });
  });

  describe('logging and monitoring', () => {
    it('should log detailed execution metrics', async () => {
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(mockThresholdChecks);
      mockWeatherService.createWeatherAlerts.mockResolvedValueOnce(['alert-1', 'alert-2']);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(5);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith('Weather monitoring completed successfully', {
        executionTimeMs: expect.any(Number),
        parishesProcessed: 2,
        thresholdViolations: 1,
        alertsCreated: 1,
        recordsCleaned: 5
      });
    });

    it('should log alert dispatch information', async () => {
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(mockThresholdChecks);
      mockWeatherService.createWeatherAlerts.mockResolvedValueOnce(['alert-1']);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(0);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith('Weather alert should be dispatched', {
        parish: Parish.ST_ANDREW,
        alertType: WeatherAlertType.HEAVY_RAIN,
        severity: Severity.MEDIUM,
        conditions: {
          rainfall: 65.0,
          windSpeed: 45.0,
          floodRisk: FloodRisk.HIGH
        }
      });
    });

    it('should measure and log execution time', async () => {
      const startTime = Date.now();
      
      mockWeatherService.fetchAllWeatherData.mockImplementation(async () => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockWeatherData;
      });
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce([]);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(0);

      await weatherMonitor(mockTimer, mockContext);

      const logCall = mockContext.log.mock.calls.find(call => 
        call[0] === 'Weather monitoring completed successfully'
      );
      
      expect(logCall).toBeDefined();
      expect(logCall[1].executionTimeMs).toBeGreaterThan(0);
      expect(logCall[1].executionTimeMs).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed success and failure scenarios', async () => {
      // Simulate partial weather data retrieval
      const partialWeatherData = [mockWeatherData[0]]; // Only one parish succeeded
      
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(partialWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce([mockThresholdChecks[0]]);
      mockWeatherService.createWeatherAlerts.mockResolvedValueOnce([]);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(2);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith('Successfully fetched weather data for 1 parishes');
      expect(mockContext.log).toHaveBeenCalledWith('Threshold checks completed: 0 parishes exceeded thresholds');
    });

    it('should handle large number of alerts', async () => {
      const manyAlerts = Array.from({ length: 10 }, (_, i) => `alert-${i + 1}`);
      
      mockWeatherService.fetchAllWeatherData.mockResolvedValueOnce(mockWeatherData);
      mockWeatherService.storeWeatherData.mockResolvedValueOnce(undefined);
      mockWeatherService.checkThresholds.mockResolvedValueOnce(mockThresholdChecks);
      mockWeatherService.createWeatherAlerts.mockResolvedValueOnce(manyAlerts);
      mockWeatherService.cleanupExpiredData.mockResolvedValueOnce(0);

      await weatherMonitor(mockTimer, mockContext);

      expect(mockContext.log).toHaveBeenCalledWith('Created 10 weather alerts', { alertIds: manyAlerts });
    });
  });
});