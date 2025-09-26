import { PrismaClient, Parish, FloodRisk, WeatherAlertType, Severity } from '@prisma/client';
import axios from 'axios';
import { getWeatherConfig } from '../lib/config';
import { getDatabase } from '../lib/database';

export interface WeatherApiResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  dt: number;
}

export interface JamaicaMetResponse {
  parish: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  conditions: string;
  timestamp: string;
}

export interface WeatherConditions {
  parish: Parish;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  conditions: string;
  floodRisk: FloodRisk;
  recordedAt: Date;
}

export interface ThresholdCheck {
  parish: Parish;
  exceeded: boolean;
  thresholds: {
    rainfall: number;
    windSpeed: number;
    floodRisk: FloodRisk;
  };
  actual: {
    rainfall: number;
    windSpeed: number;
    floodRisk: FloodRisk;
  };
  alertType?: WeatherAlertType;
  severity?: Severity;
}

/**
 * Parish coordinates for weather API calls
 */
const PARISH_COORDINATES: Record<Parish, { lat: number; lon: number }> = {
  KINGSTON: { lat: 17.9970, lon: -76.7936 },
  ST_ANDREW: { lat: 18.0747, lon: -76.7936 },
  ST_THOMAS: { lat: 17.9970, lon: -76.2000 },
  PORTLAND: { lat: 18.2000, lon: -76.4500 },
  ST_MARY: { lat: 18.4667, lon: -76.9500 },
  ST_ANN: { lat: 18.4333, lon: -77.2000 },
  TRELAWNY: { lat: 18.3333, lon: -77.6000 },
  ST_JAMES: { lat: 18.5000, lon: -77.9167 },
  HANOVER: { lat: 18.4167, lon: -78.1333 },
  WESTMORELAND: { lat: 18.3000, lon: -78.1333 },
  ST_ELIZABETH: { lat: 18.0667, lon: -77.9167 },
  MANCHESTER: { lat: 18.0500, lon: -77.5000 },
  CLARENDON: { lat: 17.9667, lon: -77.2500 },
  ST_CATHERINE: { lat: 17.9667, lon: -76.9500 }
};

export class WeatherService {
  private prisma: PrismaClient;
  private config: ReturnType<typeof getWeatherConfig>;

  constructor() {
    this.prisma = getDatabase();
    this.config = getWeatherConfig();
  }

  /**
   * Fetch weather data for all parishes
   */
  async fetchAllWeatherData(): Promise<WeatherConditions[]> {
    const parishes = Object.keys(PARISH_COORDINATES) as Parish[];
    const weatherPromises = parishes.map(parish => this.fetchWeatherForParish(parish));
    
    const results = await Promise.allSettled(weatherPromises);
    const successfulResults: WeatherConditions[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        console.error(`Failed to fetch weather for ${parishes[index]}:`, result.reason);
      }
    });
    
    return successfulResults;
  }

  /**
   * Fetch weather data for a specific parish
   */
  async fetchWeatherForParish(parish: Parish): Promise<WeatherConditions> {
    try {
      // Try Jamaica Met Service first, fallback to OpenWeatherMap
      let weatherData: WeatherConditions;
      
      if (this.config.jamaicaMetUrl) {
        try {
          weatherData = await this.fetchFromJamaicaMet(parish);
        } catch (error) {
          console.warn(`Jamaica Met API failed for ${parish}, falling back to OpenWeatherMap:`, error);
          weatherData = await this.fetchFromOpenWeatherMap(parish);
        }
      } else {
        weatherData = await this.fetchFromOpenWeatherMap(parish);
      }
      
      return weatherData;
    } catch (error) {
      // Try to get cached data as last resort
      const cachedData = await this.getCachedWeatherData(parish);
      if (cachedData) {
        console.warn(`Using cached weather data for ${parish} due to API failure`);
        return cachedData;
      }
      
      throw new Error(`Failed to fetch weather data for ${parish}: ${error}`);
    }
  }

  /**
   * Fetch weather data from Jamaica Meteorological Service
   */
  private async fetchFromJamaicaMet(parish: Parish): Promise<WeatherConditions> {
    if (!this.config.jamaicaMetUrl) {
      throw new Error('Jamaica Met API URL not configured');
    }

    const response = await axios.get<JamaicaMetResponse>(
      `${this.config.jamaicaMetUrl}/weather/${parish.toLowerCase()}`,
      { timeout: 10000 }
    );

    const data = response.data;
    const floodRisk = this.calculateFloodRisk(data.rainfall, data.windSpeed);

    return {
      parish,
      temperature: data.temperature,
      humidity: data.humidity,
      rainfall: data.rainfall,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      pressure: data.pressure,
      visibility: data.visibility,
      conditions: data.conditions,
      floodRisk,
      recordedAt: new Date(data.timestamp)
    };
  }

  /**
   * Fetch weather data from OpenWeatherMap API
   */
  private async fetchFromOpenWeatherMap(parish: Parish): Promise<WeatherConditions> {
    const coordinates = PARISH_COORDINATES[parish];
    const response = await axios.get<WeatherApiResponse>(
      `${this.config.apiUrl}/weather`,
      {
        params: {
          lat: coordinates.lat,
          lon: coordinates.lon,
          appid: this.config.apiKey,
          units: 'metric'
        },
        timeout: 10000
      }
    );

    const data = response.data;
    const rainfall = data.rain?.['1h'] || 0;
    const windSpeed = data.wind.speed * 3.6; // Convert m/s to km/h
    const floodRisk = this.calculateFloodRisk(rainfall, windSpeed);

    return {
      parish,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      rainfall,
      windSpeed,
      windDirection: this.degreesToDirection(data.wind.deg),
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert meters to kilometers
      conditions: data.weather[0]?.description || 'Unknown',
      floodRisk,
      recordedAt: new Date(data.dt * 1000)
    };
  }

  /**
   * Store weather data in database with TTL
   */
  async storeWeatherData(weatherData: WeatherConditions[]): Promise<void> {
    const expiresAt = new Date(Date.now() + this.config.cacheTtlSeconds * 1000);
    
    const createPromises = weatherData.map(data => 
      this.prisma.weatherData.create({
        data: {
          parish: data.parish,
          temperature: data.temperature,
          humidity: data.humidity,
          rainfall: data.rainfall,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          pressure: data.pressure,
          visibility: data.visibility,
          conditions: data.conditions,
          floodRisk: data.floodRisk,
          dataSource: this.config.jamaicaMetUrl ? 'Jamaica Met Service' : 'OpenWeatherMap',
          recordedAt: data.recordedAt,
          expiresAt
        }
      })
    );

    await Promise.all(createPromises);
  }

  /**
   * Get cached weather data for a parish
   */
  async getCachedWeatherData(parish: Parish): Promise<WeatherConditions | null> {
    const cached = await this.prisma.weatherData.findFirst({
      where: {
        parish,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        recordedAt: 'desc'
      }
    });

    if (!cached) return null;

    return {
      parish: cached.parish,
      temperature: cached.temperature || 0,
      humidity: cached.humidity || 0,
      rainfall: cached.rainfall || 0,
      windSpeed: cached.windSpeed || 0,
      windDirection: cached.windDirection || 'N',
      pressure: cached.pressure || 0,
      visibility: cached.visibility || 0,
      conditions: cached.conditions || 'Unknown',
      floodRisk: cached.floodRisk,
      recordedAt: cached.recordedAt
    };
  }

  /**
   * Check weather thresholds for all parishes
   */
  async checkThresholds(weatherData: WeatherConditions[]): Promise<ThresholdCheck[]> {
    const thresholds = await this.prisma.weatherThreshold.findMany({
      where: { isActive: true }
    });

    const checks: ThresholdCheck[] = [];

    for (const weather of weatherData) {
      const threshold = thresholds.find(t => t.parish === weather.parish);
      if (!threshold) continue;

      const exceeded = this.isThresholdExceeded(weather, threshold);
      const { alertType, severity } = this.determineAlertTypeAndSeverity(weather, threshold);

      checks.push({
        parish: weather.parish,
        exceeded,
        thresholds: {
          rainfall: threshold.rainfallThreshold,
          windSpeed: threshold.windSpeedThreshold,
          floodRisk: threshold.floodRiskThreshold
        },
        actual: {
          rainfall: weather.rainfall,
          windSpeed: weather.windSpeed,
          floodRisk: weather.floodRisk
        },
        alertType: exceeded ? alertType : undefined,
        severity: exceeded ? severity : undefined
      });
    }

    return checks;
  }

  /**
   * Create weather alert records for threshold violations
   */
  async createWeatherAlerts(thresholdChecks: ThresholdCheck[]): Promise<string[]> {
    const alertIds: string[] = [];
    const exceededChecks = thresholdChecks.filter(check => check.exceeded);

    for (const check of exceededChecks) {
      // Check if there's already an active alert for this parish and type
      const existingAlert = await this.prisma.weatherAlert.findFirst({
        where: {
          parish: check.parish,
          alertType: check.alertType!,
          isActive: true,
          triggeredAt: {
            gte: new Date(Date.now() - 3600000) // Within last hour
          }
        }
      });

      if (existingAlert) {
        console.log(`Active weather alert already exists for ${check.parish} - ${check.alertType}`);
        continue;
      }

      const message = this.generateAlertMessage(check);
      
      const weatherAlert = await this.prisma.weatherAlert.create({
        data: {
          parish: check.parish,
          alertType: check.alertType!,
          severity: check.severity!,
          conditions: {
            rainfall: check.actual.rainfall,
            windSpeed: check.actual.windSpeed,
            floodRisk: check.actual.floodRisk
          },
          thresholdValues: {
            rainfall: check.thresholds.rainfall,
            windSpeed: check.thresholds.windSpeed,
            floodRisk: check.thresholds.floodRisk
          },
          actualValues: check.actual,
          message,
          triggeredAt: new Date()
        }
      });

      alertIds.push(weatherAlert.id);
    }

    return alertIds;
  }

  /**
   * Clean up expired weather data
   */
  async cleanupExpiredData(): Promise<number> {
    const result = await this.prisma.weatherData.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }

  /**
   * Get weather thresholds for a parish
   */
  async getThresholds(parish: Parish) {
    return await this.prisma.weatherThreshold.findUnique({
      where: { parish }
    });
  }

  /**
   * Update weather thresholds for a parish
   */
  async updateThresholds(parish: Parish, thresholds: {
    rainfallThreshold: number;
    windSpeedThreshold: number;
    floodRiskThreshold: FloodRisk;
  }) {
    return await this.prisma.weatherThreshold.upsert({
      where: { parish },
      update: {
        ...thresholds,
        updatedAt: new Date()
      },
      create: {
        parish,
        ...thresholds
      }
    });
  }

  /**
   * Calculate flood risk based on rainfall and wind speed
   */
  private calculateFloodRisk(rainfall: number, windSpeed: number): FloodRisk {
    if (rainfall >= 100 || windSpeed >= 120) return FloodRisk.EXTREME;
    if (rainfall >= 75 || windSpeed >= 90) return FloodRisk.HIGH;
    if (rainfall >= 50 || windSpeed >= 60) return FloodRisk.MEDIUM;
    return FloodRisk.LOW;
  }

  /**
   * Check if weather conditions exceed thresholds
   */
  private isThresholdExceeded(weather: WeatherConditions, threshold: any): boolean {
    return (
      weather.rainfall >= threshold.rainfallThreshold ||
      weather.windSpeed >= threshold.windSpeedThreshold ||
      this.compareFloodRisk(weather.floodRisk, threshold.floodRiskThreshold) >= 0
    );
  }

  /**
   * Compare flood risk levels
   */
  private compareFloodRisk(risk1: FloodRisk, risk2: FloodRisk): number {
    const levels = { LOW: 0, MEDIUM: 1, HIGH: 2, EXTREME: 3 };
    return levels[risk1] - levels[risk2];
  }

  /**
   * Determine alert type and severity based on conditions
   */
  private determineAlertTypeAndSeverity(weather: WeatherConditions, threshold: any): {
    alertType: WeatherAlertType;
    severity: Severity;
  } {
    if (weather.rainfall >= threshold.rainfallThreshold * 2) {
      return { alertType: WeatherAlertType.FLOOD_WARNING, severity: Severity.HIGH };
    }
    if (weather.windSpeed >= threshold.windSpeedThreshold * 1.5) {
      return { alertType: WeatherAlertType.HIGH_WINDS, severity: Severity.HIGH };
    }
    if (weather.rainfall >= threshold.rainfallThreshold) {
      return { alertType: WeatherAlertType.HEAVY_RAIN, severity: Severity.MEDIUM };
    }
    if (weather.windSpeed >= threshold.windSpeedThreshold) {
      return { alertType: WeatherAlertType.HIGH_WINDS, severity: Severity.MEDIUM };
    }
    
    return { alertType: WeatherAlertType.SEVERE_WEATHER, severity: Severity.LOW };
  }

  /**
   * Generate alert message based on threshold check
   */
  private generateAlertMessage(check: ThresholdCheck): string {
    const parishName = check.parish.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    switch (check.alertType) {
      case WeatherAlertType.FLOOD_WARNING:
        return `FLOOD WARNING for ${parishName}: Heavy rainfall of ${check.actual.rainfall.toFixed(1)}mm detected. Seek higher ground immediately and avoid flooded roads.`;
      
      case WeatherAlertType.HEAVY_RAIN:
        return `HEAVY RAIN ALERT for ${parishName}: Rainfall of ${check.actual.rainfall.toFixed(1)}mm recorded. Monitor local conditions and avoid low-lying areas.`;
      
      case WeatherAlertType.HIGH_WINDS:
        return `HIGH WIND WARNING for ${parishName}: Wind speeds of ${check.actual.windSpeed.toFixed(1)} km/h detected. Secure loose objects and avoid exposed areas.`;
      
      default:
        return `WEATHER ALERT for ${parishName}: Severe weather conditions detected. Stay indoors and monitor local conditions.`;
    }
  }

  /**
   * Convert wind degrees to direction
   */
  private degreesToDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}