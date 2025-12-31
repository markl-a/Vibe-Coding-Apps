# Vital Signs Monitor

A health monitoring library for tracking and analyzing vital signs with alerts and recommendations.

## Features

- **Vital Sign Tracking**: Heart rate, blood pressure, temperature, O2, glucose
- **Status Classification**: Normal, low, high, critical levels
- **Trend Analysis**: Track improvements or declines over time
- **Smart Alerts**: Automatic alerts for abnormal readings
- **Health Recommendations**: Personalized suggestions based on readings
- **Age-Adjusted Ranges**: Normal ranges adjust for patient age

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Monitoring

```typescript
import { VitalSignsAnalyzer, type HealthProfile } from '@vibe/vital-signs';

// Create profile
const profile: HealthProfile = {
  id: 'user_1',
  name: 'John Doe',
  age: 45,
  gender: 'male',
  height: 175,
  weight: 80,
};

// Create analyzer
const analyzer = new VitalSignsAnalyzer(profile);

// Add reading
const result = analyzer.addReading({
  type: 'heart_rate',
  value: 75,
  unit: 'bpm',
  timestamp: new Date(),
});

console.log('Status:', result.status);
console.log('Trend:', result.trend);
```

### Blood Pressure

```typescript
analyzer.addReading({
  type: 'blood_pressure',
  value: { systolic: 120, diastolic: 80 },
  unit: 'mmHg',
  timestamp: new Date(),
});
```

### Get Alerts

```typescript
const alerts = analyzer.getActiveAlerts();
alerts.forEach(alert => {
  console.log(`[${alert.level}] ${alert.message}`);
});

// Acknowledge alert
analyzer.acknowledgeAlert(alert.id);
```

### Health Summary

```typescript
const summary = analyzer.getSummary();
console.log('Overall status:', summary.overallStatus);
console.log('Active alerts:', summary.alerts.length);
console.log('Trends:', summary.trends);
```

## Vital Sign Types

| Type | Unit | Normal Range (Adult) |
|------|------|---------------------|
| heart_rate | bpm | 60-100 |
| blood_pressure | mmHg | 90-120 / 60-80 |
| temperature | °C | 36.1-37.2 |
| oxygen_saturation | % | 95-100 |
| respiratory_rate | breaths/min | 12-20 |
| blood_glucose | mg/dL | 70-100 (fasting) |
| bmi | kg/m² | 18.5-24.9 |

## Status Levels

| Status | Description |
|--------|-------------|
| normal | Within normal range |
| low | Below normal range |
| high | Above normal range |
| critical_low | Dangerously low |
| critical_high | Dangerously high |

## Blood Pressure Categories

| Category | Systolic | Diastolic |
|----------|----------|-----------|
| Normal | <120 | <80 |
| Elevated | 120-129 | <80 |
| High Stage 1 | 130-139 | 80-89 |
| High Stage 2 | ≥140 | ≥90 |
| Crisis | >180 | >120 |

## Age-Adjusted Ranges

Normal ranges are automatically adjusted for age:

### Heart Rate (bpm)
- Infant (<1 year): 100-160
- Toddler (1-3): 90-150
- Child (3-6): 80-140
- School age (6-12): 70-120
- Adult: 60-100
- Senior (65+): 60-90

## Custom Ranges

```typescript
const profile: HealthProfile = {
  // ...
  customRanges: {
    heart_rate: { min: 55, max: 95 },
    blood_glucose: { min: 80, max: 120 },
  },
};
```

## Utilities

```typescript
// Calculate BMI
const bmi = VitalSignsAnalyzer.calculateBMI(80, 175); // weight kg, height cm

// Convert temperature
const fahrenheit = VitalSignsAnalyzer.convertTemperature(37, 'celsius');
const celsius = VitalSignsAnalyzer.convertTemperature(98.6, 'fahrenheit');
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  VitalSignsAnalyzer                         │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │   Profile    │  │   Readings    │  │   Alerts     │    │
│  │   Manager    │  │   Store       │  │   System     │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│         │                 │                   │            │
│         ▼                 ▼                   ▼            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │    Range     │  │    Trend      │  │   Alert      │    │
│  │   Adjuster   │  │   Calculator  │  │   Generator  │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│                           │                                │
│                           ▼                                │
│                   ┌───────────────┐                       │
│                   │Recommendations│                       │
│                   │   Engine      │                       │
│                   └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Important Notes

This library is for educational/demonstration purposes only. It is NOT a medical device and should NOT be used for actual health decisions. Always consult healthcare professionals for medical advice.

## Resources

- [American Heart Association](https://www.heart.org/)
- [CDC Vital Signs](https://www.cdc.gov/vitalsigns/)
- [WHO Health Topics](https://www.who.int/health-topics/)

## License

MIT
