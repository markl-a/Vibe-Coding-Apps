import type {
  VitalSignType,
  VitalReading,
  HealthStatus,
  NormalRange,
  AnalysisResult,
  HealthAlert,
  AlertLevel,
  HealthProfile,
  HealthSummary,
} from './types.js';

/**
 * Vital Signs Analyzer
 *
 * Analyzes health data and provides insights:
 * - Status classification
 * - Trend analysis
 * - Alert generation
 * - Health recommendations
 */

// Default normal ranges (adult values)
const DEFAULT_RANGES: Record<VitalSignType, NormalRange> = {
  heart_rate: { min: 60, max: 100, warningMin: 50, warningMax: 110 },
  blood_pressure: { min: 90, max: 120 }, // systolic
  temperature: { min: 36.1, max: 37.2, warningMin: 35.5, warningMax: 38.0 },
  oxygen_saturation: { min: 95, max: 100, warningMin: 92, warningMax: 100 },
  respiratory_rate: { min: 12, max: 20, warningMin: 10, warningMax: 24 },
  blood_glucose: { min: 70, max: 100, warningMin: 60, warningMax: 140 }, // fasting
  weight: { min: 0, max: 500 }, // kg
  bmi: { min: 18.5, max: 24.9, warningMin: 16, warningMax: 30 },
};

// Blood pressure ranges (systolic/diastolic)
const BP_RANGES = {
  normal: { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
  elevated: { systolic: { min: 120, max: 129 }, diastolic: { min: 60, max: 80 } },
  high_stage1: { systolic: { min: 130, max: 139 }, diastolic: { min: 80, max: 89 } },
  high_stage2: { systolic: { min: 140, max: 180 }, diastolic: { min: 90, max: 120 } },
  crisis: { systolic: { min: 180, max: 999 }, diastolic: { min: 120, max: 999 } },
};

export class VitalSignsAnalyzer {
  private profile: HealthProfile | null = null;
  private readings: Map<VitalSignType, VitalReading[]> = new Map();
  private alerts: HealthAlert[] = [];
  private alertIdCounter = 0;

  constructor(profile?: HealthProfile) {
    if (profile) {
      this.setProfile(profile);
    }
  }

  /**
   * Set health profile
   */
  setProfile(profile: HealthProfile): void {
    this.profile = profile;
  }

  /**
   * Get normal range for a vital sign
   */
  getNormalRange(type: VitalSignType): NormalRange {
    // Use custom ranges if defined in profile
    const customRange = this.profile?.customRanges?.[type];
    if (customRange) return customRange;

    // Adjust ranges based on age if available
    if (this.profile?.age) {
      return this.getAgeAdjustedRange(type, this.profile.age);
    }

    return DEFAULT_RANGES[type];
  }

  /**
   * Get age-adjusted normal range
   */
  private getAgeAdjustedRange(type: VitalSignType, age: number): NormalRange {
    const baseRange = DEFAULT_RANGES[type];

    // Heart rate adjustments
    if (type === 'heart_rate') {
      if (age < 1) return { min: 100, max: 160 };
      if (age < 3) return { min: 90, max: 150 };
      if (age < 6) return { min: 80, max: 140 };
      if (age < 12) return { min: 70, max: 120 };
      if (age > 65) return { min: 60, max: 90 };
    }

    // Respiratory rate adjustments
    if (type === 'respiratory_rate') {
      if (age < 1) return { min: 30, max: 60 };
      if (age < 3) return { min: 24, max: 40 };
      if (age < 6) return { min: 22, max: 34 };
      if (age < 12) return { min: 18, max: 30 };
    }

    return baseRange;
  }

  /**
   * Add a reading
   */
  addReading(reading: VitalReading): AnalysisResult {
    const readings = this.readings.get(reading.type) || [];
    readings.push(reading);
    this.readings.set(reading.type, readings);

    const analysis = this.analyzeReading(reading);

    // Generate alert if needed
    if (analysis.status !== 'normal') {
      this.generateAlert(reading, analysis);
    }

    return analysis;
  }

  /**
   * Analyze a single reading
   */
  analyzeReading(reading: VitalReading): AnalysisResult {
    const range = this.getNormalRange(reading.type);
    let status: HealthStatus;
    let value: number;

    // Handle blood pressure specially
    if (reading.type === 'blood_pressure' && typeof reading.value === 'object') {
      const bp = reading.value as { systolic: number; diastolic: number };
      status = this.classifyBloodPressure(bp.systolic, bp.diastolic);
      value = bp.systolic; // Use systolic for trend analysis
    } else {
      value = reading.value as number;
      status = this.classifyValue(value, range);
    }

    // Calculate trend
    const readings = this.readings.get(reading.type) || [];
    const trend = this.calculateTrend(readings);

    // Generate recommendations
    const recommendations = this.getRecommendations(reading.type, status);

    return {
      type: reading.type,
      status,
      value: reading.value,
      normalRange: range,
      trend,
      recommendations,
    };
  }

  /**
   * Classify a value against a normal range
   */
  private classifyValue(value: number, range: NormalRange): HealthStatus {
    if (value < (range.warningMin ?? range.min * 0.8)) return 'critical_low';
    if (value < range.min) return 'low';
    if (value > (range.warningMax ?? range.max * 1.2)) return 'critical_high';
    if (value > range.max) return 'high';
    return 'normal';
  }

  /**
   * Classify blood pressure
   */
  private classifyBloodPressure(systolic: number, diastolic: number): HealthStatus {
    if (systolic >= 180 || diastolic >= 120) return 'critical_high';
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 130 || diastolic >= 80) return 'high';
    if (systolic < 90 || diastolic < 60) return 'low';
    return 'normal';
  }

  /**
   * Calculate trend from recent readings
   */
  private calculateTrend(
    readings: VitalReading[]
  ): 'improving' | 'stable' | 'declining' | 'unknown' {
    if (readings.length < 3) return 'unknown';

    // Get last 5 readings
    const recent = readings.slice(-5);
    const values = recent.map((r) =>
      typeof r.value === 'number' ? r.value : (r.value as any).systolic
    );

    // Calculate average change
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }
    const avgChange = totalChange / (values.length - 1);

    // Determine trend based on change magnitude
    const range = this.getNormalRange(readings[0].type);
    const threshold = (range.max - range.min) * 0.1;

    if (Math.abs(avgChange) < threshold) return 'stable';
    return avgChange > 0 ? 'declining' : 'improving'; // Lower is often better
  }

  /**
   * Generate alert for abnormal reading
   */
  private generateAlert(reading: VitalReading, analysis: AnalysisResult): void {
    const level: AlertLevel =
      analysis.status.includes('critical') ? 'critical' : 'warning';

    const alert: HealthAlert = {
      id: `alert_${++this.alertIdCounter}`,
      type: reading.type,
      level,
      message: this.getAlertMessage(reading.type, analysis.status),
      value: reading.value,
      threshold: analysis.normalRange.max,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
  }

  /**
   * Get alert message
   */
  private getAlertMessage(type: VitalSignType, status: HealthStatus): string {
    const typeNames: Record<VitalSignType, string> = {
      heart_rate: 'Heart rate',
      blood_pressure: 'Blood pressure',
      temperature: 'Body temperature',
      oxygen_saturation: 'Oxygen saturation',
      respiratory_rate: 'Respiratory rate',
      blood_glucose: 'Blood glucose',
      weight: 'Weight',
      bmi: 'BMI',
    };

    const statusMessages: Record<HealthStatus, string> = {
      normal: 'is within normal range',
      low: 'is below normal range',
      high: 'is above normal range',
      critical_low: 'is critically low - seek medical attention',
      critical_high: 'is critically high - seek medical attention',
    };

    return `${typeNames[type]} ${statusMessages[status]}`;
  }

  /**
   * Get health recommendations
   */
  private getRecommendations(type: VitalSignType, status: HealthStatus): string[] {
    const recommendations: string[] = [];

    if (status === 'normal') {
      recommendations.push('Continue monitoring regularly');
      return recommendations;
    }

    switch (type) {
      case 'heart_rate':
        if (status === 'high') {
          recommendations.push('Practice deep breathing exercises');
          recommendations.push('Reduce caffeine intake');
          recommendations.push('Consider stress management techniques');
        } else if (status === 'low') {
          recommendations.push('Consult with healthcare provider');
          recommendations.push('Monitor for symptoms like dizziness');
        }
        break;

      case 'blood_pressure':
        if (status === 'high' || status === 'critical_high') {
          recommendations.push('Reduce sodium intake');
          recommendations.push('Increase physical activity');
          recommendations.push('Manage stress levels');
          recommendations.push('Limit alcohol consumption');
        }
        break;

      case 'blood_glucose':
        if (status === 'high') {
          recommendations.push('Review carbohydrate intake');
          recommendations.push('Increase physical activity');
          recommendations.push('Stay hydrated');
        } else if (status === 'low') {
          recommendations.push('Consume fast-acting carbohydrates');
          recommendations.push('Check blood sugar again in 15 minutes');
        }
        break;

      case 'oxygen_saturation':
        if (status === 'low' || status === 'critical_low') {
          recommendations.push('Practice deep breathing');
          recommendations.push('Sit upright or lean forward');
          recommendations.push('Seek medical attention if symptoms worsen');
        }
        break;
    }

    if (status.includes('critical')) {
      recommendations.unshift('Contact healthcare provider immediately');
    }

    return recommendations;
  }

  /**
   * Get all unacknowledged alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Get health summary
   */
  getSummary(): HealthSummary | null {
    if (!this.profile) return null;

    const latestReadings: Record<VitalSignType, VitalReading | null> = {
      heart_rate: null,
      blood_pressure: null,
      temperature: null,
      oxygen_saturation: null,
      respiratory_rate: null,
      blood_glucose: null,
      weight: null,
      bmi: null,
    };

    const trends: Record<VitalSignType, 'improving' | 'stable' | 'declining' | 'unknown'> = {
      heart_rate: 'unknown',
      blood_pressure: 'unknown',
      temperature: 'unknown',
      oxygen_saturation: 'unknown',
      respiratory_rate: 'unknown',
      blood_glucose: 'unknown',
      weight: 'unknown',
      bmi: 'unknown',
    };

    let overallStatus: HealthStatus = 'normal';

    for (const [type, readings] of this.readings) {
      if (readings.length > 0) {
        latestReadings[type] = readings[readings.length - 1];
        trends[type] = this.calculateTrend(readings);

        const analysis = this.analyzeReading(readings[readings.length - 1]);
        if (analysis.status.includes('critical')) {
          overallStatus = analysis.status;
        } else if (analysis.status !== 'normal' && overallStatus === 'normal') {
          overallStatus = analysis.status;
        }
      }
    }

    return {
      profile: this.profile,
      latestReadings,
      alerts: this.getActiveAlerts(),
      trends,
      overallStatus,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate BMI
   */
  static calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  /**
   * Convert temperature units
   */
  static convertTemperature(value: number, from: 'celsius' | 'fahrenheit'): number {
    if (from === 'celsius') {
      return (value * 9) / 5 + 32;
    }
    return ((value - 32) * 5) / 9;
  }
}
