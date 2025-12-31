/**
 * Carbon Footprint Tracking Example
 *
 * Demonstrates comprehensive carbon footprint calculation and tracking
 * for individuals, households, and organizations.
 */

import { CarbonCalculator, type CarbonProfile, type CarbonActivity } from '../carbon-tracking/carbon-calculator/src/index.js';

// ============================================================================
// Personal Carbon Footprint Tracking
// ============================================================================

async function personalCarbonTracking() {
  console.log('\n' + '='.repeat(70));
  console.log('Personal Carbon Footprint Tracking');
  console.log('='.repeat(70));

  // Create a personal profile
  const profile: CarbonProfile = {
    id: 'user_sarah_123',
    name: 'Sarah Johnson',
    country: 'US',
    householdSize: 1,
    lifestyle: 'average',
    dietType: 'vegetarian',
    homeType: 'apartment',
    homeSize: 80, // sq meters
    vehicles: 0, // no car, uses public transit
  };

  const calculator = new CarbonCalculator(profile);

  console.log(`\nProfile: ${profile.name}`);
  console.log(`Location: ${profile.country}`);
  console.log(`Lifestyle: ${profile.lifestyle}, Diet: ${profile.dietType}`);

  // Track daily commute
  console.log('\n--- Daily Commute ---');
  const morningBus = calculator.addActivity({
    category: 'transportation',
    type: 'bus',
    quantity: 12,
    unit: 'km',
    timestamp: new Date('2024-01-15T08:00:00'),
    notes: 'Morning commute to work',
  });
  console.log(`Bus to work (12 km): ${morningBus.emissions.toFixed(3)} kg CO2e`);

  const eveningBus = calculator.addActivity({
    category: 'transportation',
    type: 'bus',
    quantity: 12,
    unit: 'km',
    timestamp: new Date('2024-01-15T18:00:00'),
    notes: 'Evening commute home',
  });
  console.log(`Bus home (12 km): ${eveningBus.emissions.toFixed(3)} kg CO2e`);

  // Track home energy usage
  console.log('\n--- Home Energy Usage (January) ---');
  const electricity = calculator.addActivity({
    category: 'energy',
    type: 'electricity',
    quantity: 180, // kWh for the month
    unit: 'kWh',
    timestamp: new Date('2024-01-31'),
    notes: 'January electricity bill',
  });
  console.log(`Electricity (180 kWh): ${electricity.emissions.toFixed(2)} kg CO2e`);

  // Track food consumption
  console.log('\n--- Weekly Food Consumption ---');
  const vegetables = calculator.addActivity({
    category: 'food',
    type: 'vegetables',
    quantity: 4.5,
    unit: 'kg',
    timestamp: new Date('2024-01-15'),
  });
  console.log(`Vegetables (4.5 kg): ${vegetables.emissions.toFixed(2)} kg CO2e`);

  const dairy = calculator.addActivity({
    category: 'food',
    type: 'dairy',
    quantity: 2.0,
    unit: 'kg',
    timestamp: new Date('2024-01-15'),
  });
  console.log(`Dairy products (2 kg): ${dairy.emissions.toFixed(2)} kg CO2e`);

  const grains = calculator.addActivity({
    category: 'food',
    type: 'grains',
    quantity: 3.0,
    unit: 'kg',
    timestamp: new Date('2024-01-15'),
  });
  console.log(`Grains (3 kg): ${grains.emissions.toFixed(2)} kg CO2e`);

  // Get summary
  const summary = calculator.getSummary();
  console.log('\n--- Carbon Summary ---');
  console.log(`Total Emissions: ${summary.totalEmissions.toFixed(2)} kg CO2e`);
  console.log(`Activities Tracked: ${summary.activityCount}`);
  console.log(`Daily Average: ${summary.averageDaily.toFixed(2)} kg CO2e`);
  console.log(`\nAnnualized: ${(summary.averageDaily * 365 / 1000).toFixed(2)} tonnes/year`);

  // Compare with averages
  if (summary.comparison) {
    console.log('\n--- Comparison with Averages ---');
    console.log(`US Average: ${summary.comparison.nationalAverage} tonnes/year`);
    console.log(`Global Average: ${summary.comparison.globalAverage} tonnes/year`);
    console.log(`Your Performance: ${summary.comparison.percentile.toFixed(0)}th percentile`);
  }
}

// ============================================================================
// Household Carbon Footprint
// ============================================================================

async function householdCarbonTracking() {
  console.log('\n' + '='.repeat(70));
  console.log('Household Carbon Footprint Tracking');
  console.log('='.repeat(70));

  const householdProfile: CarbonProfile = {
    id: 'household_001',
    name: 'The Martinez Family',
    country: 'US',
    householdSize: 4,
    lifestyle: 'average',
    dietType: 'omnivore',
    homeType: 'house',
    homeSize: 180, // sq meters
    vehicles: 2,
  };

  const calculator = new CarbonCalculator(householdProfile);

  // Estimate baseline footprint
  const estimate = calculator.estimateAnnualFootprint();
  console.log('\nEstimated Annual Footprint:');
  console.log(`Total: ${(estimate.estimated / 1000).toFixed(1)} tonnes CO2e/year`);
  console.log('\nBreakdown by Category:');
  for (const [category, emissions] of Object.entries(estimate.breakdown)) {
    const percentage = ((emissions / estimate.estimated) * 100).toFixed(1);
    console.log(`  ${category}: ${(emissions / 1000).toFixed(2)} t/year (${percentage}%)`);
  }

  // Track monthly vehicle usage
  console.log('\n--- Vehicle Usage (Weekly) ---');
  const carCommute = calculator.addActivity({
    category: 'transportation',
    type: 'car_gasoline',
    quantity: 150, // km per week
    unit: 'km',
    timestamp: new Date('2024-01-21'),
    notes: 'Primary vehicle - work commute',
  });
  console.log(`Car 1 - Commute (150 km): ${carCommute.emissions.toFixed(2)} kg CO2e`);

  const carSchool = calculator.addActivity({
    category: 'transportation',
    type: 'car_hybrid',
    quantity: 80, // km per week
    unit: 'km',
    timestamp: new Date('2024-01-21'),
    notes: 'Secondary vehicle - school runs and errands',
  });
  console.log(`Car 2 - School/Errands (80 km): ${carSchool.emissions.toFixed(2)} kg CO2e`);

  // Track home energy
  console.log('\n--- Home Energy (Monthly) ---');
  const homeElectricity = calculator.addActivity({
    category: 'energy',
    type: 'electricity',
    quantity: 850, // kWh
    unit: 'kWh',
    timestamp: new Date('2024-01-31'),
  });
  console.log(`Electricity (850 kWh): ${homeElectricity.emissions.toFixed(2)} kg CO2e`);

  const heatingGas = calculator.addActivity({
    category: 'energy',
    type: 'natural_gas',
    quantity: 120, // therms
    unit: 'therms',
    timestamp: new Date('2024-01-31'),
    notes: 'Winter heating',
  });
  console.log(`Natural Gas (120 therms): ${heatingGas.emissions.toFixed(2)} kg CO2e`);

  // Track waste
  console.log('\n--- Waste Management (Weekly) ---');
  const landfillWaste = calculator.addActivity({
    category: 'waste',
    type: 'landfill',
    quantity: 18,
    unit: 'kg',
    timestamp: new Date('2024-01-21'),
  });
  console.log(`Landfill Waste (18 kg): ${landfillWaste.emissions.toFixed(2)} kg CO2e`);

  const recycling = calculator.addActivity({
    category: 'waste',
    type: 'recycling',
    quantity: 12,
    unit: 'kg',
    timestamp: new Date('2024-01-21'),
  });
  console.log(`Recycling (12 kg): ${recycling.emissions.toFixed(2)} kg CO2e (avoided!)`);

  const composting = calculator.addActivity({
    category: 'waste',
    type: 'composting',
    quantity: 5,
    unit: 'kg',
    timestamp: new Date('2024-01-21'),
  });
  console.log(`Composting (5 kg): ${composting.emissions.toFixed(2)} kg CO2e`);

  // Set reduction goals
  console.log('\n--- Setting Reduction Goals ---');
  const transportGoal = calculator.addGoal({
    name: 'Reduce transportation emissions by 20%',
    targetReduction: 20,
    category: 'transportation',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    baselineEmissions: 5000,
  });
  console.log(`Goal: ${transportGoal.name}`);
  console.log(`Target: ${transportGoal.targetReduction}% reduction by year end`);

  const energyGoal = calculator.addGoal({
    name: 'Reduce home energy emissions by 15%',
    targetReduction: 15,
    category: 'energy',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    baselineEmissions: 4000,
  });
  console.log(`\nGoal: ${energyGoal.name}`);
  console.log(`Target: ${energyGoal.targetReduction}% reduction by year end`);
}

// ============================================================================
// Business Carbon Footprint
// ============================================================================

async function businessCarbonTracking() {
  console.log('\n' + '='.repeat(70));
  console.log('Business Carbon Footprint Tracking');
  console.log('='.repeat(70));

  const businessProfile: CarbonProfile = {
    id: 'business_tech_startup',
    name: 'TechStart Inc.',
    country: 'US',
    householdSize: 50, // employees
    lifestyle: 'high_consumption',
    dietType: 'omnivore',
    homeType: 'condo', // office space
    homeSize: 500, // sq meters
    vehicles: 5, // company vehicles
  };

  const calculator = new CarbonCalculator(businessProfile);

  console.log(`\nBusiness: ${businessProfile.name}`);
  console.log(`Employees: ${businessProfile.householdSize}`);
  console.log(`Office Size: ${businessProfile.homeSize} sq meters`);

  // Track business travel
  console.log('\n--- Business Travel (Quarterly) ---');
  const domesticFlights = calculator.addActivity({
    category: 'transportation',
    type: 'airplane_domestic',
    quantity: 15000, // km total for quarter
    unit: 'km',
    timestamp: new Date('2024-03-31'),
    notes: 'Q1 domestic business flights',
  });
  console.log(`Domestic Flights (15,000 km): ${(domesticFlights.emissions / 1000).toFixed(2)} tonnes CO2e`);

  const internationalFlight = calculator.addActivity({
    category: 'transportation',
    type: 'airplane_international',
    quantity: 8000,
    unit: 'km',
    timestamp: new Date('2024-03-31'),
    notes: 'International conference trip',
  });
  console.log(`International Flight (8,000 km): ${(internationalFlight.emissions / 1000).toFixed(2)} tonnes CO2e`);

  const companyVehicles = calculator.addActivity({
    category: 'transportation',
    type: 'car_electric',
    quantity: 5000, // km for fleet
    unit: 'km',
    timestamp: new Date('2024-03-31'),
    notes: 'Company electric vehicle fleet',
  });
  console.log(`Company Vehicles (5,000 km): ${companyVehicles.emissions.toFixed(2)} kg CO2e`);

  // Track office energy
  console.log('\n--- Office Energy (Quarterly) ---');
  const officeElectricity = calculator.addActivity({
    category: 'energy',
    type: 'electricity',
    quantity: 12000, // kWh
    unit: 'kWh',
    timestamp: new Date('2024-03-31'),
    notes: 'Q1 office electricity',
  });
  console.log(`Electricity (12,000 kWh): ${(officeElectricity.emissions / 1000).toFixed(2)} tonnes CO2e`);

  // Calculate offset needed
  console.log('\n--- Carbon Offset Calculation ---');
  const offset = calculator.calculateOffsetNeeded();
  console.log(`Quarterly Emissions: ${(offset.totalEmissions / 1000).toFixed(2)} tonnes CO2e`);
  console.log(`Annual Projection: ${((offset.totalEmissions / 1000) * 4).toFixed(2)} tonnes CO2e`);
  console.log(`Estimated Offset Cost: $${offset.estimatedCost.min.toFixed(0)} - $${offset.estimatedCost.max.toFixed(0)} per year`);

  console.log('\n--- Recommendations ---');
  offset.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });

  // Get reduction tips
  console.log('\n--- Top Reduction Strategies ---');
  const tips = calculator.getReductionTips();
  tips.slice(0, 3).forEach((tip, i) => {
    console.log(`\n${i + 1}. ${tip.title}`);
    console.log(`   ${tip.description}`);
    console.log(`   Potential Savings: ${tip.potentialSavings} kg CO2e/year`);
    console.log(`   Implementation: ${tip.difficulty} difficulty, ${tip.cost} cost`);
  });
}

// ============================================================================
// Carbon Footprint Comparison
// ============================================================================

async function compareFootprints() {
  console.log('\n' + '='.repeat(70));
  console.log('Carbon Footprint Comparison: Lifestyle Impact');
  console.log('='.repeat(70));

  const scenarios = [
    {
      name: 'Minimal Lifestyle (Vegan, No Car)',
      profile: {
        id: 'scenario_1',
        name: 'Minimal Impact',
        country: 'US',
        householdSize: 1,
        lifestyle: 'minimal' as const,
        dietType: 'vegan' as const,
        homeType: 'apartment' as const,
        homeSize: 60,
        vehicles: 0,
      },
    },
    {
      name: 'Average Lifestyle (Omnivore, 1 Car)',
      profile: {
        id: 'scenario_2',
        name: 'Average Impact',
        country: 'US',
        householdSize: 1,
        lifestyle: 'average' as const,
        dietType: 'omnivore' as const,
        homeType: 'house' as const,
        homeSize: 150,
        vehicles: 1,
      },
    },
    {
      name: 'High Consumption (Omnivore, 2 Cars)',
      profile: {
        id: 'scenario_3',
        name: 'High Impact',
        country: 'US',
        householdSize: 1,
        lifestyle: 'high_consumption' as const,
        dietType: 'omnivore' as const,
        homeType: 'house' as const,
        homeSize: 250,
        vehicles: 2,
      },
    },
  ];

  console.log('\nEstimated Annual Footprints:\n');

  scenarios.forEach((scenario) => {
    const calculator = new CarbonCalculator(scenario.profile);
    const estimate = calculator.estimateAnnualFootprint();

    console.log(`${scenario.name}:`);
    console.log(`  Total: ${(estimate.estimated / 1000).toFixed(2)} tonnes CO2e/year`);
    console.log(`  Transportation: ${(estimate.breakdown.transportation / 1000).toFixed(2)} t`);
    console.log(`  Energy: ${(estimate.breakdown.energy / 1000).toFixed(2)} t`);
    console.log(`  Food: ${(estimate.breakdown.food / 1000).toFixed(2)} t`);
    console.log(`  Shopping: ${(estimate.breakdown.shopping / 1000).toFixed(2)} t`);
    console.log();
  });

  const minimalCalc = new CarbonCalculator(scenarios[0].profile);
  const averageCalc = new CarbonCalculator(scenarios[1].profile);
  const highCalc = new CarbonCalculator(scenarios[2].profile);

  const minimalEstimate = minimalCalc.estimateAnnualFootprint();
  const averageEstimate = averageCalc.estimateAnnualFootprint();
  const highEstimate = highCalc.estimateAnnualFootprint();

  const savingsVsAverage = ((averageEstimate.estimated - minimalEstimate.estimated) / 1000).toFixed(2);
  const savingsVsHigh = ((highEstimate.estimated - minimalEstimate.estimated) / 1000).toFixed(2);

  console.log('Impact of Lifestyle Choices:');
  console.log(`  Minimal vs Average: ${savingsVsAverage} tonnes/year saved`);
  console.log(`  Minimal vs High Consumption: ${savingsVsHigh} tonnes/year saved`);
  console.log(`  That's equivalent to ${(parseFloat(savingsVsHigh) * 2.5).toFixed(0)} trees planted!`);
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n');
  console.log('*'.repeat(70));
  console.log('CARBON FOOTPRINT TRACKING - COMPREHENSIVE EXAMPLES');
  console.log('*'.repeat(70));

  await personalCarbonTracking();
  await householdCarbonTracking();
  await businessCarbonTracking();
  await compareFootprints();

  console.log('\n' + '*'.repeat(70));
  console.log('Examples completed successfully!');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
