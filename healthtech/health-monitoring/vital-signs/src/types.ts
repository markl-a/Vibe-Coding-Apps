/**
 * Health Monitoring Types
 */

// Vital sign types
export type VitalSignType =
  | 'heart_rate'
  | 'blood_pressure'
  | 'temperature'
  | 'oxygen_saturation'
  | 'respiratory_rate'
  | 'blood_glucose'
  | 'weight'
  | 'bmi';

// Vital sign reading
export interface VitalReading {
  type: VitalSignType;
  value: number | { systolic: number; diastolic: number };
  unit: string;
  timestamp: Date;
  source?: string;
  notes?: string;
}

// Heart rate reading
export interface HeartRateReading extends VitalReading {
  type: 'heart_rate';
  value: number;
  unit: 'bpm';
  restingRate?: boolean;
}

// Blood pressure reading
export interface BloodPressureReading extends VitalReading {
  type: 'blood_pressure';
  value: { systolic: number; diastolic: number };
  unit: 'mmHg';
  pulse?: number;
}

// Temperature reading
export interface TemperatureReading extends VitalReading {
  type: 'temperature';
  value: number;
  unit: 'celsius' | 'fahrenheit';
  measurementSite?: 'oral' | 'axillary' | 'tympanic' | 'rectal';
}

// Oxygen saturation reading
export interface OxygenSaturationReading extends VitalReading {
  type: 'oxygen_saturation';
  value: number;
  unit: '%';
  supplementalOxygen?: boolean;
}

// Respiratory rate reading
export interface RespiratoryRateReading extends VitalReading {
  type: 'respiratory_rate';
  value: number;
  unit: 'breaths/min';
}

// Blood glucose reading
export interface BloodGlucoseReading extends VitalReading {
  type: 'blood_glucose';
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  mealStatus?: 'fasting' | 'before_meal' | 'after_meal' | 'random';
}

// Health status
export type HealthStatus = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

// Alert level
export type AlertLevel = 'info' | 'warning' | 'critical';

// Health alert
export interface HealthAlert {
  id: string;
  type: VitalSignType;
  level: AlertLevel;
  message: string;
  value: number | object;
  threshold: number | object;
  timestamp: Date;
  acknowledged: boolean;
}

// Normal ranges for vital signs
export interface NormalRange {
  min: number;
  max: number;
  warningMin?: number;
  warningMax?: number;
}

// Health profile
export interface HealthProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  conditions?: string[];
  medications?: string[];
  customRanges?: Partial<Record<VitalSignType, NormalRange>>;
}

// Health summary
export interface HealthSummary {
  profile: HealthProfile;
  latestReadings: Record<VitalSignType, VitalReading | null>;
  alerts: HealthAlert[];
  trends: Record<VitalSignType, 'improving' | 'stable' | 'declining' | 'unknown'>;
  overallStatus: HealthStatus;
  lastUpdated: Date;
}

// Analysis result
export interface AnalysisResult {
  type: VitalSignType;
  status: HealthStatus;
  value: number | object;
  normalRange: NormalRange;
  percentile?: number;
  trend?: 'improving' | 'stable' | 'declining';
  recommendations?: string[];
}
