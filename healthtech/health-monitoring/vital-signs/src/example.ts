/**
 * Vital Signs Monitoring Example
 */

import { VitalSignsAnalyzer, type HealthProfile, type VitalReading } from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Vital Signs Monitoring Example');
  console.log('='.repeat(60));

  // Create health profile
  const profile: HealthProfile = {
    id: 'user_1',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    height: 175,
    weight: 80,
    conditions: ['hypertension'],
    medications: ['lisinopril'],
  };

  console.log('\n👤 Health Profile:');
  console.log(`   Name: ${profile.name}`);
  console.log(`   Age: ${profile.age}`);
  console.log(`   BMI: ${VitalSignsAnalyzer.calculateBMI(profile.weight, profile.height).toFixed(1)}`);

  // Create analyzer
  const analyzer = new VitalSignsAnalyzer(profile);

  // Add some readings
  console.log('\n📊 Adding Readings...\n');

  // Heart rate readings
  const heartRates = [72, 75, 68, 82, 78];
  for (const hr of heartRates) {
    const reading: VitalReading = {
      type: 'heart_rate',
      value: hr,
      unit: 'bpm',
      timestamp: new Date(),
    };
    const result = analyzer.addReading(reading);
    console.log(`❤️  Heart Rate: ${hr} bpm - ${result.status.toUpperCase()}`);
  }

  // Blood pressure readings
  const bpReadings = [
    { systolic: 125, diastolic: 82 },
    { systolic: 130, diastolic: 85 },
    { systolic: 145, diastolic: 92 },
  ];

  console.log('');
  for (const bp of bpReadings) {
    const reading: VitalReading = {
      type: 'blood_pressure',
      value: bp,
      unit: 'mmHg',
      timestamp: new Date(),
    };
    const result = analyzer.addReading(reading);
    console.log(`🩺 Blood Pressure: ${bp.systolic}/${bp.diastolic} mmHg - ${result.status.toUpperCase()}`);
    if (result.recommendations?.length) {
      result.recommendations.forEach((rec) => console.log(`   💡 ${rec}`));
    }
  }

  // Temperature reading
  const tempReading: VitalReading = {
    type: 'temperature',
    value: 37.5,
    unit: 'celsius',
    timestamp: new Date(),
  };
  const tempResult = analyzer.addReading(tempReading);
  console.log(`\n🌡️  Temperature: 37.5°C - ${tempResult.status.toUpperCase()}`);

  // Oxygen saturation
  const o2Reading: VitalReading = {
    type: 'oxygen_saturation',
    value: 97,
    unit: '%',
    timestamp: new Date(),
  };
  const o2Result = analyzer.addReading(o2Reading);
  console.log(`💨 Oxygen: 97% - ${o2Result.status.toUpperCase()}`);

  // Blood glucose (low example)
  const glucoseReading: VitalReading = {
    type: 'blood_glucose',
    value: 65,
    unit: 'mg/dL',
    timestamp: new Date(),
  };
  const glucoseResult = analyzer.addReading(glucoseReading);
  console.log(`\n🩸 Blood Glucose: 65 mg/dL - ${glucoseResult.status.toUpperCase()}`);
  if (glucoseResult.recommendations?.length) {
    glucoseResult.recommendations.forEach((rec) => console.log(`   💡 ${rec}`));
  }

  // Get alerts
  const alerts = analyzer.getActiveAlerts();
  if (alerts.length > 0) {
    console.log('\n⚠️  Active Alerts:');
    alerts.forEach((alert) => {
      const icon = alert.level === 'critical' ? '🚨' : '⚠️';
      console.log(`   ${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
    });
  }

  // Get summary
  const summary = analyzer.getSummary();
  if (summary) {
    console.log('\n📋 Health Summary:');
    console.log(`   Overall Status: ${summary.overallStatus.toUpperCase()}`);
    console.log(`   Active Alerts: ${summary.alerts.length}`);
    console.log('   Trends:');

    for (const [type, trend] of Object.entries(summary.trends)) {
      if (trend !== 'unknown') {
        const icon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
        console.log(`     ${icon} ${type}: ${trend}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Example completed!');
}

main().catch(console.error);
