# Carbon Footprint Calculator

A comprehensive library for tracking, calculating, and reducing personal and household carbon emissions.

## Features

- **Multi-Category Tracking**: Transportation, energy, food, shopping, waste, water
- **Emission Factors Database**: EPA, IPCC, and other verified sources
- **Profile-Based Estimates**: Estimate annual footprint from lifestyle data
- **Reduction Goals**: Set and track emission reduction targets
- **Smart Tips**: Personalized reduction recommendations
- **Carbon Offsets**: Calculate offset needs and costs
- **Data Import/Export**: Save and restore tracking data

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Tracking

```typescript
import { CarbonCalculator, type CarbonProfile } from '@vibe/carbon-calculator';

// Create profile
const profile: CarbonProfile = {
  id: 'user_1',
  name: 'Alex Green',
  country: 'US',
  householdSize: 3,
  lifestyle: 'average',
  dietType: 'omnivore',
  homeType: 'house',
  homeSize: 150,
  vehicles: 1,
};

// Create calculator
const calculator = new CarbonCalculator(profile);

// Add activities
const result = calculator.addActivity({
  category: 'transportation',
  type: 'car_gasoline',
  quantity: 50, // km
  unit: 'km',
  timestamp: new Date(),
});

console.log('Emissions:', result.emissions, 'kg CO2e');
```

### Track Energy Usage

```typescript
calculator.addActivity({
  category: 'energy',
  type: 'electricity',
  quantity: 300, // kWh
  unit: 'kWh',
  timestamp: new Date(),
});

calculator.addActivity({
  category: 'energy',
  type: 'natural_gas',
  quantity: 50, // therms
  unit: 'therms',
  timestamp: new Date(),
});
```

### Track Food Consumption

```typescript
calculator.addActivity({
  category: 'food',
  type: 'beef',
  quantity: 2, // kg
  unit: 'kg',
  timestamp: new Date(),
});
```

### Get Summary

```typescript
const summary = calculator.getSummary();
console.log('Total:', summary.totalEmissions, 'kg CO2e');
console.log('By category:', summary.byCategory);
console.log('Daily average:', summary.averageDaily, 'kg');
```

### Set Reduction Goals

```typescript
const goal = calculator.addGoal({
  name: 'Reduce transportation by 25%',
  targetReduction: 25,
  category: 'transportation',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  baselineEmissions: 3000,
});

const progress = calculator.getGoalProgress(goal.id);
console.log('Progress:', progress?.progress, '%');
console.log('On track:', progress?.onTrack);
```

### Get Reduction Tips

```typescript
const tips = calculator.getReductionTips();
tips.forEach(tip => {
  console.log(tip.title);
  console.log('Savings:', tip.potentialSavings, 'kg/year');
});
```

## Activity Categories

### Transportation

| Type | Factor (kg CO2e/km) | Notes |
|------|---------------------|-------|
| car_gasoline | 0.21 | Average sedan |
| car_diesel | 0.17 | |
| car_hybrid | 0.12 | |
| car_electric | 0.05 | Grid-dependent |
| bus | 0.089 | Per passenger |
| train | 0.041 | Per passenger |
| airplane_domestic | 0.255 | |
| airplane_international | 0.195 | |
| bicycle | 0 | Zero emissions |

### Energy

| Type | Factor | Unit |
|------|--------|------|
| electricity | 0.42 | kWh |
| natural_gas | 2.0 | therm |
| heating_oil | 10.16 | gallon |
| solar | 0.05 | kWh (lifecycle) |
| wind | 0.01 | kWh (lifecycle) |

### Food

| Type | Factor (kg CO2e/kg) | Notes |
|------|---------------------|-------|
| beef | 27.0 | Highest impact |
| pork | 12.1 | |
| chicken | 6.9 | |
| fish | 5.1 | |
| dairy | 3.2 | |
| vegetables | 0.4 | Lowest impact |
| fruits | 0.5 | |

## Profile Options

### Diet Types
- `vegan` - Plant-based only (~1000 kg/year)
- `vegetarian` - No meat (~1500 kg/year)
- `pescatarian` - Fish allowed (~1800 kg/year)
- `omnivore` - All foods (~2500 kg/year)

### Lifestyle
- `minimal` - Low consumption
- `average` - Typical consumption
- `high_consumption` - Above average

## Emission Modifiers

Activities can include modifiers that adjust calculations:

```typescript
// Carpooling reduces per-person emissions
calculator.addActivity({
  category: 'transportation',
  type: 'car_gasoline',
  quantity: 50,
  unit: 'km',
  passengers: 3, // Divides emissions by 3
  timestamp: new Date(),
});

// Organic food has lower emissions
calculator.addActivity({
  category: 'food',
  type: 'vegetables',
  quantity: 5,
  unit: 'kg',
  organic: true, // 10% reduction
  local: true,   // 15% reduction
  timestamp: new Date(),
});

// Renewable energy
calculator.addActivity({
  category: 'energy',
  type: 'electricity',
  quantity: 300,
  unit: 'kWh',
  renewable: true, // 90% reduction
  timestamp: new Date(),
});
```

## Data Management

### Export Data

```typescript
const json = calculator.exportData();
// Save to file or storage
```

### Import Data

```typescript
const json = loadFromStorage();
calculator.importData(json);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CarbonCalculator                          │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Profile    │  │  Activities   │  │    Goals     │     │
│  │   Manager    │  │    Store      │  │   Tracker    │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │  Footprint   │  │   Emission    │  │   Progress   │     │
│  │  Estimator   │  │  Calculator   │  │   Analyzer   │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│                           │                                  │
│                           ▼                                  │
│         ┌───────────────────────────────────┐               │
│         │        Emission Factors DB         │               │
│         │  (EPA, IPCC, verified sources)     │               │
│         └───────────────────────────────────┘               │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                     │
│              │   Reduction Tips &     │                     │
│              │   Offset Calculator    │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Country Averages (tonnes CO2e/capita/year)

| Country | Average |
|---------|---------|
| Australia | 17.0 |
| USA | 16.0 |
| Canada | 15.5 |
| Japan | 9.0 |
| Germany | 8.0 |
| China | 7.4 |
| UK | 5.5 |
| France | 4.5 |
| **Global** | **4.7** |
| India | 1.9 |

## Important Notes

- Emission factors are approximate and vary by region
- Data should not be used for official carbon accounting
- Consider consulting environmental professionals for accurate assessments
- Offset recommendations are estimates only

## Data Sources

- [EPA Emission Factors](https://www.epa.gov/climateleadership/ghg-emission-factors-hub)
- [IPCC Guidelines](https://www.ipcc.ch/)
- [Our World in Data](https://ourworldindata.org/environmental-impacts-of-food)
- [Carbon Trust](https://www.carbontrust.com/)

## License

MIT
