/**
 * Remote Health Monitoring Example
 *
 * Demonstrates remote patient monitoring with:
 * - Wearable device integration
 * - Real-time vital signs tracking
 * - Alert and notification system
 * - Trend analysis and reporting
 * - Care team communication
 * - Compliance tracking
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface MonitoringProgram {
  id: string;
  patientId: string;
  providerId: string;
  programType: ProgramType;
  status: 'active' | 'paused' | 'completed' | 'terminated';
  startDate: Date;
  endDate?: Date;
  devices: MonitoringDevice[];
  parameters: MonitoringParameters;
  alerts: AlertConfiguration[];
  careTeam: CareTeamMember[];
}

type ProgramType =
  | 'chronic_care_management'
  | 'post_discharge'
  | 'cardiac_monitoring'
  | 'diabetes_management'
  | 'respiratory_monitoring'
  | 'maternal_health';

interface MonitoringDevice {
  id: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'active' | 'inactive' | 'maintenance' | 'lost';
  lastSync: Date;
  batteryLevel?: number;
  firmwareVersion: string;
  measurements: string[]; // Types of measurements this device can take
}

type DeviceType =
  | 'blood_pressure_monitor'
  | 'glucose_meter'
  | 'pulse_oximeter'
  | 'weight_scale'
  | 'thermometer'
  | 'ecg_monitor'
  | 'spirometer'
  | 'activity_tracker'
  | 'continuous_glucose_monitor';

interface MonitoringParameters {
  requiredMeasurements: RequiredMeasurement[];
  reportingSchedule: ReportingSchedule;
  escalationCriteria: EscalationCriteria[];
  complianceTarget: number; // percentage
}

interface RequiredMeasurement {
  type: string;
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'as_needed';
  timesPerDay?: number;
  preferredTimes?: string[];
}

interface ReportingSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  recipients: string[];
}

interface EscalationCriteria {
  measurementType: string;
  condition: 'above' | 'below' | 'outside_range';
  threshold: number | { min: number; max: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

interface AlertConfiguration {
  id: string;
  type: string;
  enabled: boolean;
  threshold: number | { min: number; max: number };
  recipients: string[];
  escalationDelay?: number; // minutes
}

interface CareTeamMember {
  id: string;
  role: 'primary_provider' | 'nurse' | 'care_coordinator' | 'specialist' | 'family_member';
  name: string;
  contact: {
    email: string;
    phone: string;
  };
  notificationPreferences: {
    alerts: boolean;
    reports: boolean;
    urgentOnly: boolean;
  };
}

interface VitalReading {
  id: string;
  patientId: string;
  programId: string;
  deviceId: string;
  type: string;
  value: number | { systolic: number; diastolic: number };
  unit: string;
  timestamp: Date;
  location?: 'home' | 'clinic' | 'hospital' | 'other';
  notes?: string;
  flagged: boolean;
  verified: boolean;
}

interface Alert {
  id: string;
  programId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  reading?: VitalReading;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
  actions: AlertAction[];
}

interface AlertAction {
  timestamp: Date;
  performedBy: string;
  action: string;
  notes?: string;
}

interface ComplianceReport {
  programId: string;
  patientId: string;
  period: {
    start: Date;
    end: Date;
  };
  overallCompliance: number; // percentage
  measurementCompliance: Record<string, number>;
  missedMeasurements: number;
  totalRequired: number;
  trends: string[];
  recommendations: string[];
}

interface HealthTrend {
  measurementType: string;
  period: {
    start: Date;
    end: Date;
  };
  readings: number[];
  average: number;
  min: number;
  max: number;
  stdDev: number;
  trend: 'improving' | 'stable' | 'declining' | 'volatile';
  percentChange: number;
}

// ============================================================================
// Remote Health Monitoring System
// ============================================================================

class RemoteMonitoringSystem {
  private programs: Map<string, MonitoringProgram> = new Map();
  private readings: VitalReading[] = [];
  private alerts: Alert[] = [];

  /**
   * Enroll patient in monitoring program
   */
  async enrollPatient(
    patientId: string,
    providerId: string,
    programType: ProgramType,
    devices: Omit<MonitoringDevice, 'status' | 'lastSync'>[],
    careTeam: CareTeamMember[]
  ): Promise<{ success: boolean; program?: MonitoringProgram }> {
    const program: MonitoringProgram = {
      id: this.generateProgramId(),
      patientId,
      providerId,
      programType,
      status: 'active',
      startDate: new Date(),
      devices: devices.map((d) => ({
        ...d,
        status: 'active' as const,
        lastSync: new Date(),
      })),
      parameters: this.getDefaultParameters(programType),
      alerts: this.getDefaultAlerts(programType),
      careTeam,
    };

    this.programs.set(program.id, program);

    console.log('\n✅ Patient enrolled in monitoring program');
    console.log(`   Program ID: ${program.id}`);
    console.log(`   Type: ${programType}`);
    console.log(`   Devices: ${program.devices.length}`);
    console.log(`   Care team: ${careTeam.length} members`);

    program.devices.forEach((device) => {
      console.log(`   📱 ${device.type}: ${device.manufacturer} ${device.model}`);
    });

    return { success: true, program };
  }

  /**
   * Record vital sign reading
   */
  async recordReading(
    programId: string,
    deviceId: string,
    type: string,
    value: number | { systolic: number; diastolic: number },
    unit: string,
    location: VitalReading['location'] = 'home'
  ): Promise<{ success: boolean; reading?: VitalReading; alerts?: Alert[] }> {
    const program = this.programs.get(programId);
    if (!program) {
      return { success: false };
    }

    const reading: VitalReading = {
      id: this.generateReadingId(),
      patientId: program.patientId,
      programId,
      deviceId,
      type,
      value,
      unit,
      timestamp: new Date(),
      location,
      flagged: false,
      verified: false,
    };

    this.readings.push(reading);

    // Update device last sync
    const device = program.devices.find((d) => d.id === deviceId);
    if (device) {
      device.lastSync = new Date();
    }

    console.log(`\n📊 Reading recorded: ${type}`);
    console.log(`   Value: ${this.formatValue(value)} ${unit}`);
    console.log(`   Location: ${location}`);
    console.log(`   Device: ${deviceId}`);

    // Check for alerts
    const triggeredAlerts = await this.checkAlerts(program, reading);

    if (triggeredAlerts.length > 0) {
      console.log(`   ⚠️  ${triggeredAlerts.length} alert(s) triggered`);
    }

    return { success: true, reading, alerts: triggeredAlerts };
  }

  /**
   * Check if reading triggers any alerts
   */
  private async checkAlerts(
    program: MonitoringProgram,
    reading: VitalReading
  ): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    program.alerts
      .filter((alert) => alert.enabled && alert.type === reading.type)
      .forEach((alertConfig) => {
        let triggered = false;
        let message = '';

        const value = typeof reading.value === 'number' ? reading.value : reading.value.systolic;

        if (typeof alertConfig.threshold === 'number') {
          if (value > alertConfig.threshold) {
            triggered = true;
            message = `${reading.type} above threshold: ${this.formatValue(reading.value)} ${reading.unit}`;
          }
        } else {
          if (value < alertConfig.threshold.min || value > alertConfig.threshold.max) {
            triggered = true;
            message = `${reading.type} outside normal range: ${this.formatValue(reading.value)} ${reading.unit}`;
          }
        }

        if (triggered) {
          const alert = this.createAlert(program, reading, message);
          this.alerts.push(alert);
          triggeredAlerts.push(alert);
          reading.flagged = true;

          // Notify care team
          this.notifyCareTeam(program, alert);
        }
      });

    return triggeredAlerts;
  }

  /**
   * Create alert
   */
  private createAlert(
    program: MonitoringProgram,
    reading: VitalReading,
    message: string
  ): Alert {
    // Determine severity based on escalation criteria
    const severity = this.determineSeverity(program, reading);

    const alert: Alert = {
      id: this.generateAlertId(),
      programId: program.id,
      severity,
      type: reading.type,
      message,
      reading,
      triggeredAt: new Date(),
      resolved: false,
      actions: [],
    };

    return alert;
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(
    program: MonitoringProgram,
    reading: VitalReading
  ): Alert['severity'] {
    const criteria = program.parameters.escalationCriteria.find(
      (c) => c.measurementType === reading.type
    );

    if (!criteria) return 'low';

    const value = typeof reading.value === 'number' ? reading.value : reading.value.systolic;

    if (criteria.condition === 'above' && typeof criteria.threshold === 'number') {
      const deviation = value - criteria.threshold;
      if (deviation > criteria.threshold * 0.3) return 'critical';
      if (deviation > criteria.threshold * 0.2) return 'high';
      if (deviation > criteria.threshold * 0.1) return 'medium';
    }

    return criteria.severity;
  }

  /**
   * Notify care team
   */
  private notifyCareTeam(program: MonitoringProgram, alert: Alert): void {
    console.log('\n📧 Notifying care team...');

    program.careTeam
      .filter((member) => {
        if (member.notificationPreferences.urgentOnly && alert.severity === 'low') {
          return false;
        }
        return member.notificationPreferences.alerts;
      })
      .forEach((member) => {
        console.log(`   • ${member.name} (${member.role}) - ${member.contact.email}`);
        // In production: send actual email/SMS
      });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): { success: boolean } {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) {
      return { success: false };
    }

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    alert.actions.push({
      timestamp: new Date(),
      performedBy: acknowledgedBy,
      action: 'Alert acknowledged',
      notes,
    });

    console.log(`\n✅ Alert acknowledged by ${acknowledgedBy}`);
    if (notes) {
      console.log(`   Notes: ${notes}`);
    }

    return { success: true };
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string, notes?: string): { success: boolean } {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) {
      return { success: false };
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    alert.actions.push({
      timestamp: new Date(),
      performedBy: resolvedBy,
      action: 'Alert resolved',
      notes,
    });

    console.log(`\n✅ Alert resolved by ${resolvedBy}`);

    return { success: true };
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(
    programId: string,
    startDate: Date,
    endDate: Date
  ): ComplianceReport | null {
    const program = this.programs.get(programId);
    if (!program) return null;

    const programReadings = this.readings.filter(
      (r) =>
        r.programId === programId && r.timestamp >= startDate && r.timestamp <= endDate
    );

    // Calculate required measurements
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const required = program.parameters.requiredMeasurements.reduce((total, req) => {
      const times = req.timesPerDay || (req.frequency === 'daily' ? 1 : 2);
      return total + times * days;
    }, 0);

    const overallCompliance = (programReadings.length / required) * 100;

    // Calculate compliance by measurement type
    const measurementCompliance: Record<string, number> = {};
    program.parameters.requiredMeasurements.forEach((req) => {
      const typeReadings = programReadings.filter((r) => r.type === req.type);
      const times = req.timesPerDay || 1;
      const typeRequired = times * days;
      measurementCompliance[req.type] = (typeReadings.length / typeRequired) * 100;
    });

    const report: ComplianceReport = {
      programId,
      patientId: program.patientId,
      period: { start: startDate, end: endDate },
      overallCompliance: Math.round(overallCompliance),
      measurementCompliance,
      missedMeasurements: required - programReadings.length,
      totalRequired: required,
      trends: this.identifyTrends(programReadings),
      recommendations: this.generateRecommendations(overallCompliance, measurementCompliance),
    };

    return report;
  }

  /**
   * Analyze health trends
   */
  analyzeHealthTrends(
    programId: string,
    measurementType: string,
    startDate: Date,
    endDate: Date
  ): HealthTrend | null {
    const readings = this.readings.filter(
      (r) =>
        r.programId === programId &&
        r.type === measurementType &&
        r.timestamp >= startDate &&
        r.timestamp <= endDate
    );

    if (readings.length === 0) return null;

    const values = readings.map((r) =>
      typeof r.value === 'number' ? r.value : r.value.systolic
    );

    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Determine trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trend: HealthTrend['trend'];
    if (stdDev > average * 0.2) {
      trend = 'volatile';
    } else if (Math.abs(percentChange) < 5) {
      trend = 'stable';
    } else if (percentChange > 0) {
      trend = measurementType.includes('glucose') || measurementType.includes('pressure')
        ? 'declining'
        : 'improving';
    } else {
      trend = measurementType.includes('glucose') || measurementType.includes('pressure')
        ? 'improving'
        : 'declining';
    }

    return {
      measurementType,
      period: { start: startDate, end: endDate },
      readings: values,
      average: Math.round(average * 10) / 10,
      min,
      max,
      stdDev: Math.round(stdDev * 10) / 10,
      trend,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  }

  /**
   * Get active alerts for a program
   */
  getActiveAlerts(programId: string): Alert[] {
    return this.alerts.filter((a) => a.programId === programId && !a.resolved);
  }

  /**
   * Get device status
   */
  getDeviceStatus(programId: string): MonitoringDevice[] {
    const program = this.programs.get(programId);
    return program?.devices || [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateProgramId(): string {
    return `PROG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReadingId(): string {
    return `READ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private formatValue(value: number | { systolic: number; diastolic: number }): string {
    return typeof value === 'number' ? value.toString() : `${value.systolic}/${value.diastolic}`;
  }

  private getDefaultParameters(programType: ProgramType): MonitoringParameters {
    // Simplified - would be customized per program type
    return {
      requiredMeasurements: [
        { type: 'blood_pressure', frequency: 'twice_daily', timesPerDay: 2 },
        { type: 'weight', frequency: 'daily', timesPerDay: 1 },
      ],
      reportingSchedule: {
        frequency: 'weekly',
        recipients: [],
      },
      escalationCriteria: [
        {
          measurementType: 'blood_pressure',
          condition: 'above',
          threshold: 140,
          severity: 'high',
          action: 'Contact provider immediately',
        },
      ],
      complianceTarget: 80,
    };
  }

  private getDefaultAlerts(programType: ProgramType): AlertConfiguration[] {
    return [
      {
        id: this.generateAlertId(),
        type: 'blood_pressure',
        enabled: true,
        threshold: { min: 90, max: 140 },
        recipients: [],
      },
    ];
  }

  private identifyTrends(readings: VitalReading[]): string[] {
    const trends: string[] = [];

    if (readings.length > 7) {
      const recent = readings.slice(-7);
      const older = readings.slice(-14, -7);

      if (recent.length > 0 && older.length > 0) {
        trends.push('7-day trend analysis available');
      }
    }

    return trends;
  }

  private generateRecommendations(
    overallCompliance: number,
    measurementCompliance: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (overallCompliance < 80) {
      recommendations.push('Increase measurement frequency to meet compliance targets');
    }

    Object.entries(measurementCompliance).forEach(([type, compliance]) => {
      if (compliance < 70) {
        recommendations.push(`Focus on improving ${type} measurement compliance`);
      }
    });

    return recommendations;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Remote Health Monitoring System - Comprehensive Example');
  console.log('='.repeat(70));

  const system = new RemoteMonitoringSystem();

  // Example 1: Enroll Patient in Monitoring Program
  console.log('\n👤 Example 1: Enrolling Patient in Cardiac Monitoring Program');

  const careTeam: CareTeamMember[] = [
    {
      id: 'CT-001',
      role: 'primary_provider',
      name: 'Dr. Sarah Johnson',
      contact: { email: 'sjohnson@clinic.com', phone: '+15551234567' },
      notificationPreferences: { alerts: true, reports: true, urgentOnly: false },
    },
    {
      id: 'CT-002',
      role: 'nurse',
      name: 'Nurse Kelly Brown',
      contact: { email: 'kbrown@clinic.com', phone: '+15551234568' },
      notificationPreferences: { alerts: true, reports: false, urgentOnly: true },
    },
  ];

  const devices = [
    {
      id: 'DEV-001',
      type: 'blood_pressure_monitor' as DeviceType,
      manufacturer: 'Omron',
      model: 'BP7000',
      serialNumber: 'OM123456789',
      firmwareVersion: '2.1.0',
      measurements: ['blood_pressure', 'heart_rate'],
    },
    {
      id: 'DEV-002',
      type: 'weight_scale' as DeviceType,
      manufacturer: 'Withings',
      model: 'Body+',
      serialNumber: 'WI987654321',
      firmwareVersion: '1.5.2',
      measurements: ['weight', 'bmi'],
    },
  ];

  const enrollResult = await system.enrollPatient(
    'PATIENT-001',
    'DR-001',
    'cardiac_monitoring',
    devices,
    careTeam
  );

  if (!enrollResult.success || !enrollResult.program) {
    console.error('Failed to enroll patient');
    return;
  }

  const program = enrollResult.program;

  // Example 2: Record Normal Blood Pressure Reading
  console.log('\n\n📊 Example 2: Recording Normal Blood Pressure');

  await system.recordReading(
    program.id,
    'DEV-001',
    'blood_pressure',
    { systolic: 120, diastolic: 80 },
    'mmHg'
  );

  // Example 3: Record Elevated Blood Pressure (Triggers Alert)
  console.log('\n\n⚠️  Example 3: Recording Elevated Blood Pressure');

  await system.recordReading(
    program.id,
    'DEV-001',
    'blood_pressure',
    { systolic: 165, diastolic: 95 },
    'mmHg'
  );

  // Example 4: Record Weight Measurements
  console.log('\n\n⚖️  Example 4: Recording Weight');

  await system.recordReading(program.id, 'DEV-002', 'weight', 82.5, 'kg');

  // Example 5: View Active Alerts
  console.log('\n\n🚨 Example 5: Active Alerts');

  const activeAlerts = system.getActiveAlerts(program.id);
  console.log(`\nActive alerts: ${activeAlerts.length}\n`);

  activeAlerts.forEach((alert) => {
    console.log(`   [${alert.severity.toUpperCase()}] ${alert.message}`);
    console.log(`   Triggered: ${alert.triggeredAt.toLocaleString()}`);
    console.log('');
  });

  // Example 6: Acknowledge Alert
  if (activeAlerts.length > 0) {
    console.log('\n\n✅ Example 6: Acknowledging Alert');

    system.acknowledgeAlert(
      activeAlerts[0].id,
      'NURSE-001',
      'Contacted patient, will monitor closely'
    );
  }

  // Example 7: Record More Readings for Trend Analysis
  console.log('\n\n📈 Example 7: Recording Multiple Readings for Trend Analysis');

  const testReadings = [
    { systolic: 135, diastolic: 85 },
    { systolic: 130, diastolic: 82 },
    { systolic: 128, diastolic: 80 },
    { systolic: 125, diastolic: 78 },
    { systolic: 122, diastolic: 76 },
  ];

  for (const reading of testReadings) {
    await system.recordReading(program.id, 'DEV-001', 'blood_pressure', reading, 'mmHg');
  }

  // Example 8: Analyze Health Trends
  console.log('\n\n📊 Example 8: Health Trend Analysis');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const trend = system.analyzeHealthTrends(program.id, 'blood_pressure', startDate, endDate);

  if (trend) {
    console.log(`\nBlood Pressure Trend (7 days):`);
    console.log(`   Average: ${trend.average} mmHg`);
    console.log(`   Range: ${trend.min} - ${trend.max} mmHg`);
    console.log(`   Std Dev: ${trend.stdDev}`);
    console.log(`   Trend: ${trend.trend.toUpperCase()}`);
    console.log(`   Change: ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange}%`);
  }

  // Example 9: Generate Compliance Report
  console.log('\n\n📋 Example 9: Compliance Report');

  const complianceReport = system.generateComplianceReport(program.id, startDate, endDate);

  if (complianceReport) {
    console.log(`\nCompliance Report (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}):`);
    console.log(`   Overall Compliance: ${complianceReport.overallCompliance}%`);
    console.log(`   Measurements: ${complianceReport.totalRequired - complianceReport.missedMeasurements} / ${complianceReport.totalRequired}`);
    console.log(`   Missed: ${complianceReport.missedMeasurements}`);

    console.log('\n   By Measurement Type:');
    Object.entries(complianceReport.measurementCompliance).forEach(([type, compliance]) => {
      console.log(`     ${type}: ${Math.round(compliance)}%`);
    });

    if (complianceReport.recommendations.length > 0) {
      console.log('\n   Recommendations:');
      complianceReport.recommendations.forEach((rec) => {
        console.log(`     • ${rec}`);
      });
    }
  }

  // Example 10: Check Device Status
  console.log('\n\n📱 Example 10: Device Status');

  const deviceStatus = system.getDeviceStatus(program.id);
  console.log(`\nMonitoring Devices (${deviceStatus.length}):\n`);

  deviceStatus.forEach((device) => {
    console.log(`   ${device.type}:`);
    console.log(`     Manufacturer: ${device.manufacturer} ${device.model}`);
    console.log(`     Status: ${device.status}`);
    console.log(`     Last sync: ${device.lastSync.toLocaleString()}`);
    console.log(`     Battery: ${device.batteryLevel || 'N/A'}%`);
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('Remote health monitoring examples completed!');
  console.log('Real-time monitoring with HIPAA compliance');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
