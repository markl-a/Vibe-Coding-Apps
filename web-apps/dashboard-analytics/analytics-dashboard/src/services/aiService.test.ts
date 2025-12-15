import { describe, it, expect } from 'vitest'
import {
  analyzeTrend,
  detectAnomalies,
  generateForecast,
  generateInsights,
  calculateCorrelation,
  getSmartRecommendations,
} from './aiService'

describe('aiService', () => {
  describe('analyzeTrend', () => {
    it('should identify upward trend correctly', () => {
      const data = [100, 120, 140, 160, 180]
      const result = analyzeTrend(data)

      expect(result.direction).toBe('up')
      expect(result.strength).toBeDefined()
      expect(result.prediction).toBeGreaterThan(180)
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should identify downward trend correctly', () => {
      const data = [200, 180, 160, 140, 120]
      const result = analyzeTrend(data)

      expect(result.direction).toBe('down')
      expect(result.prediction).toBeLessThan(120)
    })

    it('should identify stable trend', () => {
      const data = [100, 101, 100, 99, 100]
      const result = analyzeTrend(data)

      expect(result.direction).toBe('stable')
    })

    it('should handle single data point', () => {
      const data = [100]
      const result = analyzeTrend(data)

      expect(result.direction).toBe('stable')
      expect(result.prediction).toBe(100)
    })

    it('should return strong strength for clear trends', () => {
      const data = [10, 20, 30, 40, 50]
      const result = analyzeTrend(data)

      expect(result.strength).toBe('strong')
      expect(result.confidence).toBeGreaterThan(0.7)
    })
  })

  describe('detectAnomalies', () => {
    it('should detect anomalies in data', () => {
      const data = [100, 100, 100, 500, 100, 100]
      const anomalies = detectAnomalies(data, 2)

      expect(anomalies.length).toBeGreaterThan(0)
      expect(anomalies[0].index).toBe(3)
      expect(anomalies[0].value).toBe(500)
    })

    it('should return empty array for consistent data', () => {
      const data = [100, 100, 100, 100, 100]
      const anomalies = detectAnomalies(data, 2)

      expect(anomalies).toHaveLength(0)
    })

    it('should handle small datasets', () => {
      const data = [100, 200]
      const anomalies = detectAnomalies(data)

      expect(anomalies).toHaveLength(0)
    })

    it('should classify severity correctly', () => {
      const data = [100, 100, 100, 1000, 100, 100]
      const anomalies = detectAnomalies(data, 1)

      expect(anomalies[0].severity).toBeDefined()
      expect(['high', 'medium', 'low']).toContain(anomalies[0].severity)
    })
  })

  describe('generateForecast', () => {
    it('should generate forecast for upward trend', () => {
      const data = [100, 120, 140, 160, 180]
      const forecast = generateForecast(data, 3)

      expect(forecast).toHaveLength(3)
      expect(forecast[0]).toBeGreaterThan(180)
    })

    it('should generate forecast for downward trend', () => {
      const data = [200, 180, 160, 140, 120]
      const forecast = generateForecast(data, 3)

      expect(forecast).toHaveLength(3)
      expect(forecast[0]).toBeLessThan(120)
    })

    it('should handle single data point', () => {
      const data = [100]
      const forecast = generateForecast(data, 5)

      expect(forecast).toHaveLength(5)
      forecast.forEach(value => expect(value).toBe(100))
    })

    it('should not generate negative forecasts', () => {
      const data = [10, 8, 6, 4, 2]
      const forecast = generateForecast(data, 5)

      forecast.forEach(value => expect(value).toBeGreaterThanOrEqual(0))
    })
  })

  describe('calculateCorrelation', () => {
    it('should calculate perfect positive correlation', () => {
      const data1 = [1, 2, 3, 4, 5]
      const data2 = [2, 4, 6, 8, 10]
      const correlation = calculateCorrelation(data1, data2)

      expect(correlation).toBeCloseTo(1, 1)
    })

    it('should calculate perfect negative correlation', () => {
      const data1 = [1, 2, 3, 4, 5]
      const data2 = [5, 4, 3, 2, 1]
      const correlation = calculateCorrelation(data1, data2)

      expect(correlation).toBeCloseTo(-1, 1)
    })

    it('should return 0 for no correlation', () => {
      const data1 = [1, 2, 3, 4, 5]
      const data2 = [1, 1, 1, 1, 1]
      const correlation = calculateCorrelation(data1, data2)

      expect(correlation).toBe(0)
    })

    it('should handle mismatched array lengths', () => {
      const data1 = [1, 2, 3]
      const data2 = [1, 2]
      const correlation = calculateCorrelation(data1, data2)

      expect(correlation).toBe(0)
    })
  })

  describe('generateInsights', () => {
    it('should generate insights from data', () => {
      const revenue = [1000, 1200, 1400, 1600, 1800]
      const users = [100, 120, 140, 160, 180]
      const orders = [50, 60, 70, 80, 90]

      const insights = generateInsights(revenue, users, orders)

      expect(insights.length).toBeGreaterThan(0)
      expect(insights.length).toBeLessThanOrEqual(5)
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type')
        expect(insight).toHaveProperty('title')
        expect(insight).toHaveProperty('description')
        expect(insight).toHaveProperty('impact')
        expect(insight).toHaveProperty('confidence')
      })
    })

    it('should identify revenue trends', () => {
      const revenue = [1000, 1500, 2000, 2500, 3000]
      const users = [100, 100, 100, 100, 100]
      const orders = [50, 50, 50, 50, 50]

      const insights = generateInsights(revenue, users, orders)
      const trendInsights = insights.filter(i => i.type === 'trend')

      expect(trendInsights.length).toBeGreaterThan(0)
    })

    it('should provide recommendations for low conversion', () => {
      const revenue = [1000, 1000, 1000, 1000, 1000]
      const users = [1000, 1000, 1000, 1000, 1000]
      const orders = [10, 10, 10, 10, 10]

      const insights = generateInsights(revenue, users, orders)
      const recommendations = insights.filter(i => i.type === 'recommendation')

      expect(recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('getSmartRecommendations', () => {
    it('should generate recommendations', () => {
      const metrics = {
        revenue: [1000, 1100, 1200, 1300, 1400],
        users: [100, 110, 120, 130, 140],
        orders: [50, 55, 60, 65, 70],
        conversion: [5, 5, 5, 5, 5]
      }

      const recommendations = getSmartRecommendations(metrics)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeLessThanOrEqual(4)
    })

    it('should recommend for declining conversion', () => {
      const metrics = {
        revenue: [1000, 1000, 1000, 1000, 1000],
        users: [100, 100, 100, 100, 100],
        orders: [50, 50, 50, 50, 50],
        conversion: [10, 8, 6, 4, 2]
      }

      const recommendations = getSmartRecommendations(metrics)

      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.includes('转化率'))).toBe(true)
    })

    it('should handle order volatility', () => {
      const metrics = {
        revenue: [1000, 1000, 1000, 1000, 1000],
        users: [100, 100, 100, 100, 100],
        orders: [10, 100, 20, 90, 15],
        conversion: [5, 5, 5, 5, 5]
      }

      const recommendations = getSmartRecommendations(metrics)

      expect(recommendations.length).toBeGreaterThan(0)
    })
  })
})
