import { WeatherService, WeatherConditions, ThresholdCheck } from '../weather.service';
import { PrismaClient, Parish, FloodRisk, WeatherAlertType, Severity } from '@prisma/client';
import axios from 'axios';
import { getWeatherConfig } from '../../lib/config';
import { getDatabase } from '../../lib/database';

// Mock dependencies
jest.mock('axios');
jest.mock('../../lib/config');
jest.mock('../../lib/database');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetWeatherConfig = getWeatherConfig as jest.MockedFunction<typeof getWeatherConfig>;
const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe('WeatherService', () => {
  let weatherService: WeatherService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockConfig = {
    apiKey: 'test-api-key',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    jamaicaMetUrl: 'https://met.gov.jm/api',
    checkIntervalMinutes: 15,
    floodThresholdMm: 50,
    windThresholdKmh: 60,
    cacheTtlSeconds: 900
  };

  const mockWeatherApiResponse = {
    main: {
      temp: 28.5,
      humidity: 75,
      pressure: 1013
    },
    weather: [
      {
        main: 'Rain',
        description: 'heavy intensity rain'
      }
    ],
    wind: {
      speed: 8.5, // m/s
      deg: 180
    },
    visibility: 5000,
    rain: {
      '1h': 25.5
    },
    dt: 1640995200
  };

  const mockJamaicaMetResponse = {
    parish: 'kingston',
    temperature: 29.0,
    humidity: 80,
    rainfall: 45.2,
    windSpeed: 35.5,
    windDirection: 'SW',
    pressure: 1015,
    visibility: 8.5,
    conditions: 'Heavy Rain',
    timestamp: '2024-01-01T12:00:00Z'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock config
    mockedGetWeatherConfig.mockReturnValue(mockConfig);

    // Mock Prisma client
    mockPrisma = {
      weatherData: {
        create: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn()
      },
      weatherThreshold: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn()
      },
      weatherAlert: {
        findFirst: jest.fn(),
        create: jest.fn()
      }
    } as any;

    mockedGetDatabase.mockReturnValue(mockPrisma);
    weatherService = new WeatherService();
  });

  describe('fetchWeatherForParish', () => {
    it('should fetch weather data from Jamaica Met Service when available', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockJamaicaMetResponse });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://met.gov.jm/api/weather/kingston',
        { timeout: 10000 }
      );

      expect(result).toEqual({
        parish: Parish.KINGSTON,
        temperature: 29.0,
        humidity: 80,
        rainfall: 45.2,
        windSpeed: 35.5,
        windDirection: 'SW',
        pressure: 1015,
        visibility: 8.5,
        conditions: 'Heavy Rain',
        floodRisk: FloodRisk.LOW,
        recordedAt: new Date('2024-01-01T12:00:00Z')
      });
    });

    it('should fallback to OpenWeatherMap when Jamaica Met fails', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Jamaica Met API failed'))
        .mockResolvedValueOnce({ data: mockWeatherApiResponse });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            lat: 17.9970,
            lon: -76.7936,
            appid: 'test-api-key',
            units: 'metric'
          },
          timeout: 10000
        }
      );

      expect(result.parish).toBe(Parish.KINGSTON);
      expect(result.temperature).toBe(28.5);
      expect(result.windSpeed).toBe(30.6); // 8.5 m/s * 3.6 = 30.6 km/h
    });

    it('should use cached data when all APIs fail', async () => {
      const cachedWeather: WeatherConditions = {
        parish: Parish.KINGSTON,
        temperature: 27.0,
        humidity: 70,
        rainfall: 15.0,
        windSpeed: 25.0,
        windDirection: 'N',
        pressure: 1010,
        visibility: 10,
        conditions: 'Partly Cloudy',
        floodRisk: FloodRisk.LOW,
        recordedAt: new Date('2024-01-01T11:00:00Z')
      };

      mockedAxios.get.mockRejectedValue(new Error('All APIs failed'));
      mockPrisma.weatherData.findFirst.mockResolvedValueOnce({
        id: '1',
        parish: Parish.KINGSTON,
        temperature: 27.0,
        humidity: 70,
        rainfall: 15.0,
        windSpeed: 25.0,
        windDirection: 'N',
        pressure: 1010,
        visibility: 10,
        conditions: 'Partly Cloudy',
        floodRisk: FloodRisk.LOW,
        dataSource: 'OpenWeatherMap',
        recordedAt: new Date('2024-01-01T11:00:00Z'),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 900000)
      });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(result).toEqual(cachedWeather);
    });

    it('should throw error when all sources fail and no cached data', async () => {
      mockedAxios.get.mockRejectedValue(new Error('All APIs failed'));
      mockPrisma.weatherData.findFirst.mockResolvedValueOnce(null);

      await expect(weatherService.fetchWeatherForParish(Parish.KINGSTON))
        .rejects.toThrow('Failed to fetch weather data for KINGSTON');
    });
  });

  describe('fetchAllWeatherData', () => {
    it('should fetch weather data for all parishes', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockJamaicaMetResponse });

      const result = await weatherService.fetchAllWeatherData();

      expect(result).toHaveLength(14); // All 14 parishes
      expect(mockedAxios.get).toHaveBeenCalledTimes(14);
    });

    it('should handle partial failures gracefully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockJamaicaMetResponse })
        .mockRejectedValueOnce(new Error('API failed'))
        .mockResolvedValue({ data: mockJamaicaMetResponse });

      const result = await weatherService.fetchAllWeatherData();

      expect(result.length).toBeLessThan(14);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('storeWeatherData', () => {
    it('should store weather data with correct TTL', async () => {
      const weatherData: WeatherConditions[] = [{
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
      }];

      await weatherService.storeWeatherData(weatherData);

      expect(mockPrisma.weatherData.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
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
          dataSource: 'Jamaica Met Service',
          expiresAt: expect.any(Date)
        })
      });
    });
  });

  describe('checkThresholds', () => {
    const mockThresholds = [
      {
        id: '1',
        parish: Parish.KINGSTON,
        rainfallThreshold: 50,
        windSpeedThreshold: 60,
        floodRiskThreshold: FloodRisk.MEDIUM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockWeatherData: WeatherConditions[] = [{
      parish: Parish.KINGSTON,
      temperature: 28.5,
      humidity: 75,
      rainfall: 75.0, // Exceeds threshold
      windSpeed: 45.0, // Below threshold
      windDirection: 'S',
      pressure: 1013,
      visibility: 5,
      conditions: 'Heavy Rain',
      floodRisk: FloodRisk.HIGH, // Exceeds threshold
      recordedAt: new Date()
    }];

    it('should identify threshold violations correctly', async () => {
      mockPrisma.weatherThreshold.findMany.mockResolvedValueOnce(mockThresholds);

      const result = await weatherService.checkThresholds(mockWeatherData);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        parish: Parish.KINGSTON,
        exceeded: true,
        thresholds: {
          rainfall: 50,
          windSpeed: 60,
          floodRisk: FloodRisk.MEDIUM
        },
        actual: {
          rainfall: 75.0,
          windSpeed: 45.0,
          floodRisk: FloodRisk.HIGH
        },
        alertType: WeatherAlertType.HEAVY_RAIN,
        severity: Severity.MEDIUM
      });
    });

    it('should return no violations when thresholds are not exceeded', async () => {
      const safeWeatherData: WeatherConditions[] = [{
        ...mockWeatherData[0],
        rainfall: 25.0, // Below threshold
        floodRisk: FloodRisk.LOW // Below threshold
      }];

      mockPrisma.weatherThreshold.findMany.mockResolvedValueOnce(mockThresholds);

      const result = await weatherService.checkThresholds(safeWeatherData);

      expect(result).toHaveLength(1);
      expect(result[0].exceeded).toBe(false);
    });
  });

  describe('createWeatherAlerts', () => {
    const mockThresholdCheck: ThresholdCheck = {
      parish: Parish.KINGSTON,
      exceeded: true,
      thresholds: {
        rainfall: 50,
        windSpeed: 60,
        floodRisk: FloodRisk.MEDIUM
      },
      actual: {
        rainfall: 75.0,
        windSpeed: 45.0,
        floodRisk: FloodRisk.HIGH
      },
      alertType: WeatherAlertType.HEAVY_RAIN,
      severity: Severity.MEDIUM
    };

    it('should create weather alerts for threshold violations', async () => {
      mockPrisma.weatherAlert.findFirst.mockResolvedValueOnce(null); // No existing alert
      mockPrisma.weatherAlert.create.mockResolvedValueOnce({
        id: 'alert-1',
        parish: Parish.KINGSTON,
        alertType: WeatherAlertType.HEAVY_RAIN,
        severity: Severity.MEDIUM,
        conditions: mockThresholdCheck.actual,
        thresholdValues: mockThresholdCheck.thresholds,
        actualValues: mockThresholdCheck.actual,
        message: expect.any(String),
        isActive: true,
        triggeredAt: expect.any(Date),
        resolvedAt: null,
        alertId: null
      });

      const result = await weatherService.createWeatherAlerts([mockThresholdCheck]);

      expect(result).toEqual(['alert-1']);
      expect(mockPrisma.weatherAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parish: Parish.KINGSTON,
          alertType: WeatherAlertType.HEAVY_RAIN,
          severity: Severity.MEDIUM,
          message: expect.stringContaining('HEAVY RAIN ALERT for Kingston')
        })
      });
    });

    it('should not create duplicate alerts within the same hour', async () => {
      mockPrisma.weatherAlert.findFirst.mockResolvedValueOnce({
        id: 'existing-alert',
        parish: Parish.KINGSTON,
        alertType: WeatherAlertType.HEAVY_RAIN,
        severity: Severity.MEDIUM,
        conditions: {},
        thresholdValues: {},
        actualValues: {},
        message: 'Existing alert',
        isActive: true,
        triggeredAt: new Date(),
        resolvedAt: null,
        alertId: null
      });

      const result = await weatherService.createWeatherAlerts([mockThresholdCheck]);

      expect(result).toEqual([]);
      expect(mockPrisma.weatherAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredData', () => {
    it('should delete expired weather data', async () => {
      mockPrisma.weatherData.deleteMany.mockResolvedValueOnce({ count: 5 });

      const result = await weatherService.cleanupExpiredData();

      expect(result).toBe(5);
      expect(mockPrisma.weatherData.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('threshold management', () => {
    it('should get thresholds for a parish', async () => {
      const mockThreshold = {
        id: '1',
        parish: Parish.KINGSTON,
        rainfallThreshold: 50,
        windSpeedThreshold: 60,
        floodRiskThreshold: FloodRisk.MEDIUM,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.weatherThreshold.findUnique.mockResolvedValueOnce(mockThreshold);

      const result = await weatherService.getThresholds(Parish.KINGSTON);

      expect(result).toEqual(mockThreshold);
      expect(mockPrisma.weatherThreshold.findUnique).toHaveBeenCalledWith({
        where: { parish: Parish.KINGSTON }
      });
    });

    it('should update thresholds for a parish', async () => {
      const newThresholds = {
        rainfallThreshold: 75,
        windSpeedThreshold: 80,
        floodRiskThreshold: FloodRisk.HIGH
      };

      const updatedThreshold = {
        id: '1',
        parish: Parish.KINGSTON,
        ...newThresholds,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.weatherThreshold.upsert.mockResolvedValueOnce(updatedThreshold);

      const result = await weatherService.updateThresholds(Parish.KINGSTON, newThresholds);

      expect(result).toEqual(updatedThreshold);
      expect(mockPrisma.weatherThreshold.upsert).toHaveBeenCalledWith({
        where: { parish: Parish.KINGSTON },
        update: {
          ...newThresholds,
          updatedAt: expect.any(Date)
        },
        create: {
          parish: Parish.KINGSTON,
          ...newThresholds
        }
      });
    });
  });

  describe('flood risk calculation', () => {
    it('should calculate EXTREME flood risk for very high rainfall', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ...mockWeatherApiResponse,
          rain: { '1h': 120 } // Very high rainfall
        }
      });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(result.floodRisk).toBe(FloodRisk.EXTREME);
    });

    it('should calculate HIGH flood risk for high rainfall', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ...mockWeatherApiResponse,
          rain: { '1h': 80 } // High rainfall
        }
      });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(result.floodRisk).toBe(FloodRisk.HIGH);
    });

    it('should calculate MEDIUM flood risk for moderate rainfall', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ...mockWeatherApiResponse,
          rain: { '1h': 55 } // Moderate rainfall
        }
      });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(result.floodRisk).toBe(FloodRisk.MEDIUM);
    });

    it('should calculate LOW flood risk for light rainfall', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          ...mockWeatherApiResponse,
          rain: { '1h': 20 } // Light rainfall
        }
      });

      const result = await weatherService.fetchWeatherForParish(Parish.KINGSTON);

      expect(result.floodRisk).toBe(FloodRisk.LOW);
    });
  });
});