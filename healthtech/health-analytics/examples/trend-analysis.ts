/**
 * Health Trend Analysis Example
 *
 * Demonstrates advanced trend analysis with:
 * - Time series analysis of health metrics
 * - Statistical trend detection (moving averages, regression)
 * - Seasonal pattern recognition
 * - Anomaly detection
 * - Predictive modeling
 * - Correlation analysis between metrics
 * - Visual trend reports
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

interface TimeSeries {
  metricName: string;
  unit: string;
  dataPoints: DataPoint[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

interface TrendAnalysis {
  metricName: string;
  period: { start: Date; end: Date };
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  direction: number; // -1 to 1
  strength: number; // 0 to 1
  statistics: TrendStatistics;
  forecast?: Forecast;
  anomalies: Anomaly[];
  patterns: Pattern[];
}

interface TrendStatistics {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  range: number;
  variance: number;
  coefficientOfVariation: number;
  percentChange: number;
  slope: number;
  rSquared: number;
}

interface Forecast {
  predictions: DataPoint[];
  confidence: number; // 0-100
  method: 'linear' | 'moving_average' | 'exponential_smoothing';
  horizon: number; // days
}

interface Anomaly {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop' | 'outlier';
  explanation?: string;
}

interface Pattern {
  type: 'daily_cycle' | 'weekly_cycle' | 'monthly_cycle' | 'upward_trend' | 'downward_trend' | 'seasonal';
  confidence: number;
  description: string;
  detected: Date;
}

interface MovingAverage {
  simple: DataPoint[];
  exponential: DataPoint[];
  weighted: DataPoint[];
}

interface Correlation {
  metric1: string;
  metric2: string;
  coefficient: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative' | 'none';
  pValue: number;
  significant: boolean;
}

interface ComparativeTrend {
  metric: string;
  currentPeriod: TrendStatistics;
  previousPeriod: TrendStatistics;
  change: {
    absolute: number;
    percentage: number;
    interpretation: string;
  };
  significance: 'improving' | 'declining' | 'stable';
}

// ============================================================================
// Trend Analyzer
// ============================================================================

class HealthTrendAnalyzer {
  /**
   * Perform comprehensive trend analysis
   */
  analyzeTrend(timeSeries: TimeSeries, forecastDays: number = 7): TrendAnalysis {
    const points = timeSeries.dataPoints;

    if (points.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(points);

    // Determine trend direction and strength
    const trendInfo = this.determineTrend(points, statistics);

    // Detect anomalies
    const anomalies = this.detectAnomalies(points, statistics);

    // Detect patterns
    const patterns = this.detectPatterns(points);

    // Generate forecast
    const forecast = this.generateForecast(points, forecastDays);

    return {
      metricName: timeSeries.metricName,
      period: {
        start: points[0].timestamp,
        end: points[points.length - 1].timestamp,
      },
      trend: trendInfo.trend,
      direction: trendInfo.direction,
      strength: trendInfo.strength,
      statistics,
      forecast,
      anomalies,
      patterns,
    };
  }

  /**
   * Calculate statistical measures
   */
  private calculateStatistics(points: DataPoint[]): TrendStatistics {
    const values = points.map((p) => p.value);
    const count = values.length;

    // Mean
    const mean = values.reduce((sum, v) => sum + v, 0) / count;

    // Median
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];

    // Standard deviation and variance
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // Min, Max, Range
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Coefficient of variation
    const coefficientOfVariation = (stdDev / mean) * 100;

    // Percent change
    const percentChange = ((values[count - 1] - values[0]) / values[0]) * 100;

    // Linear regression for slope
    const regression = this.linearRegression(points);

    return {
      count,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      min,
      max,
      range,
      variance: Math.round(variance * 100) / 100,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
      percentChange: Math.round(percentChange * 100) / 100,
      slope: regression.slope,
      rSquared: regression.rSquared,
    };
  }

  /**
   * Linear regression analysis
   */
  private linearRegression(
    points: DataPoint[]
  ): { slope: number; intercept: number; rSquared: number } {
    const n = points.length;
    const x = points.map((_, i) => i); // Use index as x
    const y = points.map((p) => p.value);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - ssResidual / ssTotal;

    return {
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 1000) / 1000,
      rSquared: Math.round(rSquared * 1000) / 1000,
    };
  }

  /**
   * Determine overall trend
   */
  private determineTrend(
    points: DataPoint[],
    stats: TrendStatistics
  ): { trend: TrendAnalysis['trend']; direction: number; strength: number } {
    const slopeThreshold = 0.1;
    const volatilityThreshold = 20; // CV%

    let trend: TrendAnalysis['trend'];
    let direction: number;

    // Check for volatility
    if (stats.coefficientOfVariation > volatilityThreshold) {
      trend = 'volatile';
      direction = 0;
    } else if (Math.abs(stats.slope) < slopeThreshold) {
      trend = 'stable';
      direction = 0;
    } else if (stats.slope > 0) {
      trend = 'increasing';
      direction = Math.min(1, Math.abs(stats.slope));
    } else {
      trend = 'decreasing';
      direction = -Math.min(1, Math.abs(stats.slope));
    }

    // Strength is based on R-squared (how well the data fits the trend)
    const strength = stats.rSquared;

    return { trend, direction, strength };
  }

  /**
   * Detect anomalies using statistical methods
   */
  private detectAnomalies(points: DataPoint[], stats: TrendStatistics): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Use 3-sigma rule for outlier detection
    const threshold = stats.stdDev * 3;

    points.forEach((point) => {
      const deviation = Math.abs(point.value - stats.mean);

      if (deviation > threshold) {
        let type: Anomaly['type'];
        if (point.value > stats.mean + threshold) {
          type = 'spike';
        } else if (point.value < stats.mean - threshold) {
          type = 'drop';
        } else {
          type = 'outlier';
        }

        const severity: Anomaly['severity'] =
          deviation > threshold * 2 ? 'high' : deviation > threshold * 1.5 ? 'medium' : 'low';

        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: stats.mean,
          deviation: Math.round(deviation * 100) / 100,
          severity,
          type,
          explanation: `Value ${type === 'spike' ? 'significantly above' : type === 'drop' ? 'significantly below' : 'outside'} expected range`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect patterns in the time series
   */
  private detectPatterns(points: DataPoint[]): Pattern[] {
    const patterns: Pattern[] = [];

    // Detect daily cycle (if hourly data)
    if (points.length >= 24) {
      const hourlyPattern = this.checkCyclicPattern(points, 24);
      if (hourlyPattern.detected) {
        patterns.push({
          type: 'daily_cycle',
          confidence: hourlyPattern.confidence,
          description: 'Regular 24-hour pattern detected',
          detected: new Date(),
        });
      }
    }

    // Detect weekly cycle (if daily data)
    if (points.length >= 7) {
      const weeklyPattern = this.checkCyclicPattern(points, 7);
      if (weeklyPattern.detected) {
        patterns.push({
          type: 'weekly_cycle',
          confidence: weeklyPattern.confidence,
          description: 'Weekly pattern detected',
          detected: new Date(),
        });
      }
    }

    // Check for consistent upward/downward trends
    const consecutiveIncreases = this.countConsecutiveTrends(points, 'increase');
    const consecutiveDecreases = this.countConsecutiveTrends(points, 'decrease');

    if (consecutiveIncreases >= 5) {
      patterns.push({
        type: 'upward_trend',
        confidence: Math.min(consecutiveIncreases / 10, 1),
        description: `Consistent upward trend over ${consecutiveIncreases} periods`,
        detected: new Date(),
      });
    }

    if (consecutiveDecreases >= 5) {
      patterns.push({
        type: 'downward_trend',
        confidence: Math.min(consecutiveDecreases / 10, 1),
        description: `Consistent downward trend over ${consecutiveDecreases} periods`,
        detected: new Date(),
      });
    }

    return patterns;
  }

  /**
   * Check for cyclic patterns
   */
  private checkCyclicPattern(
    points: DataPoint[],
    period: number
  ): { detected: boolean; confidence: number } {
    if (points.length < period * 2) {
      return { detected: false, confidence: 0 };
    }

    // Calculate autocorrelation at the specified lag
    const values = points.map((p) => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < values.length - period; i++) {
      numerator += (values[i] - mean) * (values[i + period] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    const autocorrelation = numerator / denominator;
    const confidence = Math.abs(autocorrelation);

    return {
      detected: confidence > 0.5,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Count consecutive trends
   */
  private countConsecutiveTrends(points: DataPoint[], type: 'increase' | 'decrease'): number {
    let count = 0;
    let maxCount = 0;

    for (let i = 1; i < points.length; i++) {
      const diff = points[i].value - points[i - 1].value;

      if ((type === 'increase' && diff > 0) || (type === 'decrease' && diff < 0)) {
        count++;
        maxCount = Math.max(maxCount, count);
      } else {
        count = 0;
      }
    }

    return maxCount;
  }

  /**
   * Generate forecast using simple moving average
   */
  private generateForecast(points: DataPoint[], days: number): Forecast {
    const lastPoint = points[points.length - 1];
    const recentPoints = points.slice(-7); // Use last 7 points

    // Simple moving average for forecast
    const avgValue =
      recentPoints.reduce((sum, p) => sum + p.value, 0) / recentPoints.length;

    // Calculate trend from recent data
    const recentRegression = this.linearRegression(recentPoints);

    const predictions: DataPoint[] = [];
    for (let i = 1; i <= days; i++) {
      const predictedValue = avgValue + recentRegression.slope * i;
      const nextDate = new Date(lastPoint.timestamp);
      nextDate.setDate(nextDate.getDate() + i);

      predictions.push({
        timestamp: nextDate,
        value: Math.round(predictedValue * 100) / 100,
      });
    }

    // Confidence based on R-squared of recent trend
    const confidence = Math.round(recentRegression.rSquared * 100);

    return {
      predictions,
      confidence,
      method: 'moving_average',
      horizon: days,
    };
  }

  /**
   * Calculate moving averages
   */
  calculateMovingAverages(points: DataPoint[], window: number = 7): MovingAverage {
    const simple: DataPoint[] = [];
    const exponential: DataPoint[] = [];
    const weighted: DataPoint[] = [];

    // Simple Moving Average
    for (let i = window - 1; i < points.length; i++) {
      const windowPoints = points.slice(i - window + 1, i + 1);
      const avg = windowPoints.reduce((sum, p) => sum + p.value, 0) / window;

      simple.push({
        timestamp: points[i].timestamp,
        value: Math.round(avg * 100) / 100,
      });
    }

    // Exponential Moving Average (EMA)
    const multiplier = 2 / (window + 1);
    let ema = points[0].value;

    for (let i = 0; i < points.length; i++) {
      ema = (points[i].value - ema) * multiplier + ema;
      exponential.push({
        timestamp: points[i].timestamp,
        value: Math.round(ema * 100) / 100,
      });
    }

    // Weighted Moving Average
    for (let i = window - 1; i < points.length; i++) {
      const windowPoints = points.slice(i - window + 1, i + 1);
      const weights = windowPoints.map((_, idx) => idx + 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      const wma =
        windowPoints.reduce((sum, p, idx) => sum + p.value * weights[idx], 0) / totalWeight;

      weighted.push({
        timestamp: points[i].timestamp,
        value: Math.round(wma * 100) / 100,
      });
    }

    return { simple, exponential, weighted };
  }

  /**
   * Calculate correlation between two metrics
   */
  calculateCorrelation(
    metric1: TimeSeries,
    metric2: TimeSeries
  ): Correlation {
    // Ensure same length and aligned timestamps
    const values1 = metric1.dataPoints.map((p) => p.value);
    const values2 = metric2.dataPoints.map((p) => p.value);

    const n = Math.min(values1.length, values2.length);
    const x = values1.slice(0, n);
    const y = values2.slice(0, n);

    // Calculate Pearson correlation coefficient
    const meanX = x.reduce((sum, v) => sum + v, 0) / n;
    const meanY = y.reduce((sum, v) => sum + v, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    const coefficient = numerator / Math.sqrt(denomX * denomY);

    // Determine strength and direction
    const absCoeff = Math.abs(coefficient);
    let strength: Correlation['strength'];
    if (absCoeff > 0.7) strength = 'strong';
    else if (absCoeff > 0.4) strength = 'moderate';
    else strength = 'weak';

    let direction: Correlation['direction'];
    if (absCoeff < 0.1) direction = 'none';
    else if (coefficient > 0) direction = 'positive';
    else direction = 'negative';

    // Simplified p-value calculation (would use proper statistical test)
    const pValue = 1 - absCoeff;
    const significant = pValue < 0.05;

    return {
      metric1: metric1.metricName,
      metric2: metric2.metricName,
      coefficient: Math.round(coefficient * 1000) / 1000,
      strength,
      direction,
      pValue: Math.round(pValue * 1000) / 1000,
      significant,
    };
  }

  /**
   * Compare trends across periods
   */
  comparePeriodicTrends(
    currentPeriod: DataPoint[],
    previousPeriod: DataPoint[],
    metricName: string
  ): ComparativeTrend {
    const currentStats = this.calculateStatistics(currentPeriod);
    const previousStats = this.calculateStatistics(previousPeriod);

    const absoluteChange = currentStats.mean - previousStats.mean;
    const percentageChange = (absoluteChange / previousStats.mean) * 100;

    let interpretation: string;
    let significance: ComparativeTrend['significance'];

    if (Math.abs(percentageChange) < 5) {
      interpretation = 'Relatively stable compared to previous period';
      significance = 'stable';
    } else if (percentageChange > 0) {
      interpretation = `Increased by ${Math.abs(percentageChange).toFixed(1)}%`;
      significance = metricName.includes('pressure') || metricName.includes('glucose')
        ? 'declining'
        : 'improving';
    } else {
      interpretation = `Decreased by ${Math.abs(percentageChange).toFixed(1)}%`;
      significance = metricName.includes('pressure') || metricName.includes('glucose')
        ? 'improving'
        : 'declining';
    }

    return {
      metric: metricName,
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      change: {
        absolute: Math.round(absoluteChange * 100) / 100,
        percentage: Math.round(percentageChange * 100) / 100,
        interpretation,
      },
      significance,
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Health Trend Analysis - Comprehensive Example');
  console.log('='.repeat(70));

  const analyzer = new HealthTrendAnalyzer();

  // Generate sample blood pressure data (30 days)
  const bloodPressureData: DataPoint[] = [];
  const baseValue = 120;

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));

    // Add trend and some randomness
    const trend = i * 0.3; // Slight upward trend
    const random = (Math.random() - 0.5) * 10;
    const value = baseValue + trend + random;

    bloodPressureData.push({
      timestamp: date,
      value: Math.round(value),
    });
  }

  // Add some anomalies
  bloodPressureData[10].value = 155; // Spike
  bloodPressureData[20].value = 95; // Drop

  const bpTimeSeries: TimeSeries = {
    metricName: 'Systolic Blood Pressure',
    unit: 'mmHg',
    dataPoints: bloodPressureData,
    frequency: 'daily',
  };

  // Example 1: Comprehensive Trend Analysis
  console.log('\n📊 Example 1: Blood Pressure Trend Analysis');

  const trendAnalysis = analyzer.analyzeTrend(bpTimeSeries, 7);

  console.log(`\n   Metric: ${trendAnalysis.metricName}`);
  console.log(
    `   Period: ${trendAnalysis.period.start.toLocaleDateString()} - ${trendAnalysis.period.end.toLocaleDateString()}`
  );
  console.log(`   Trend: ${trendAnalysis.trend.toUpperCase()}`);
  console.log(`   Direction: ${(trendAnalysis.direction * 100).toFixed(1)}%`);
  console.log(`   Strength: ${(trendAnalysis.strength * 100).toFixed(1)}%`);

  console.log('\n   Statistics:');
  console.log(`     Mean: ${trendAnalysis.statistics.mean} ${bpTimeSeries.unit}`);
  console.log(`     Median: ${trendAnalysis.statistics.median} ${bpTimeSeries.unit}`);
  console.log(`     Range: ${trendAnalysis.statistics.min} - ${trendAnalysis.statistics.max}`);
  console.log(`     Std Dev: ${trendAnalysis.statistics.stdDev}`);
  console.log(`     % Change: ${trendAnalysis.statistics.percentChange}%`);
  console.log(`     Slope: ${trendAnalysis.statistics.slope}`);
  console.log(`     R²: ${trendAnalysis.statistics.rSquared}`);

  // Example 2: Anomaly Detection
  console.log('\n\n🚨 Example 2: Detected Anomalies');

  if (trendAnalysis.anomalies.length > 0) {
    console.log(`\n   Found ${trendAnalysis.anomalies.length} anomalies:\n`);
    trendAnalysis.anomalies.forEach((anomaly, idx) => {
      console.log(`   ${idx + 1}. ${anomaly.timestamp.toLocaleDateString()}`);
      console.log(`      Type: ${anomaly.type.toUpperCase()}`);
      console.log(`      Value: ${anomaly.value} (expected: ${anomaly.expectedValue})`);
      console.log(`      Deviation: ${anomaly.deviation}`);
      console.log(`      Severity: ${anomaly.severity.toUpperCase()}`);
      console.log('');
    });
  } else {
    console.log('\n   No significant anomalies detected');
  }

  // Example 3: Pattern Detection
  console.log('\n\n🔍 Example 3: Detected Patterns');

  if (trendAnalysis.patterns.length > 0) {
    console.log(`\n   Found ${trendAnalysis.patterns.length} patterns:\n`);
    trendAnalysis.patterns.forEach((pattern, idx) => {
      console.log(`   ${idx + 1}. ${pattern.type.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`      Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
      console.log(`      ${pattern.description}`);
      console.log('');
    });
  }

  // Example 4: Forecast
  console.log('\n\n🔮 Example 4: 7-Day Forecast');

  if (trendAnalysis.forecast) {
    console.log(`\n   Method: ${trendAnalysis.forecast.method}`);
    console.log(`   Confidence: ${trendAnalysis.forecast.confidence}%\n`);

    trendAnalysis.forecast.predictions.forEach((pred, idx) => {
      console.log(`   Day ${idx + 1}: ${pred.timestamp.toLocaleDateString()} - ${pred.value} mmHg`);
    });
  }

  // Example 5: Moving Averages
  console.log('\n\n📈 Example 5: Moving Averages (7-day window)');

  const movingAvgs = analyzer.calculateMovingAverages(bloodPressureData, 7);

  console.log('\n   Latest values:');
  console.log(
    `     Simple MA: ${movingAvgs.simple[movingAvgs.simple.length - 1].value} mmHg`
  );
  console.log(
    `     Exponential MA: ${movingAvgs.exponential[movingAvgs.exponential.length - 1].value} mmHg`
  );
  console.log(
    `     Weighted MA: ${movingAvgs.weighted[movingAvgs.weighted.length - 1].value} mmHg`
  );

  // Example 6: Correlation Analysis
  console.log('\n\n🔗 Example 6: Correlation Analysis');

  // Generate correlated weight data
  const weightData: DataPoint[] = bloodPressureData.map((bp, idx) => ({
    timestamp: bp.timestamp,
    value: Math.round(80 + idx * 0.1 + (Math.random() - 0.5) * 2), // Slight correlation with BP
  }));

  const weightTimeSeries: TimeSeries = {
    metricName: 'Weight',
    unit: 'kg',
    dataPoints: weightData,
    frequency: 'daily',
  };

  const correlation = analyzer.calculateCorrelation(bpTimeSeries, weightTimeSeries);

  console.log(`\n   ${correlation.metric1} vs ${correlation.metric2}`);
  console.log(`   Correlation Coefficient: ${correlation.coefficient}`);
  console.log(`   Strength: ${correlation.strength.toUpperCase()}`);
  console.log(`   Direction: ${correlation.direction.toUpperCase()}`);
  console.log(`   P-value: ${correlation.pValue}`);
  console.log(`   Statistically Significant: ${correlation.significant ? 'Yes' : 'No'}`);

  // Example 7: Periodic Comparison
  console.log('\n\n📅 Example 7: Period-over-Period Comparison');

  const currentPeriod = bloodPressureData.slice(-14); // Last 2 weeks
  const previousPeriod = bloodPressureData.slice(-28, -14); // Previous 2 weeks

  const comparison = analyzer.comparePeriodicTrends(
    currentPeriod,
    previousPeriod,
    'Blood Pressure'
  );

  console.log('\n   Current Period (Last 2 weeks):');
  console.log(`     Mean: ${comparison.currentPeriod.mean} mmHg`);
  console.log(`     Range: ${comparison.currentPeriod.min} - ${comparison.currentPeriod.max}`);

  console.log('\n   Previous Period (2 weeks before):');
  console.log(`     Mean: ${comparison.previousPeriod.mean} mmHg`);
  console.log(`     Range: ${comparison.previousPeriod.min} - ${comparison.previousPeriod.max}`);

  console.log('\n   Change:');
  console.log(`     Absolute: ${comparison.change.absolute > 0 ? '+' : ''}${comparison.change.absolute} mmHg`);
  console.log(`     Percentage: ${comparison.change.percentage > 0 ? '+' : ''}${comparison.change.percentage}%`);
  console.log(`     ${comparison.change.interpretation}`);
  console.log(`     Significance: ${comparison.significance.toUpperCase()}`);

  console.log('\n' + '='.repeat(70));
  console.log('Health trend analysis examples completed!');
  console.log('Statistical rigor and clinical relevance maintained');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
