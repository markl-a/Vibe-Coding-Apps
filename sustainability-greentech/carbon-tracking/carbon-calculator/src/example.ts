/**
 * Carbon Calculator Example
 */

import { CarbonCalculator, type CarbonProfile } from './index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Carbon Footprint Calculator Example');
  console.log('='.repeat(60));

  // Create user profile
  const profile: CarbonProfile = {
    id: 'user_1',
    name: 'Alex Green',
    country: 'US',
    householdSize: 3,
    lifestyle: 'average',
    dietType: 'omnivore',
    homeType: 'house',
    homeSize: 150, // sq meters
    vehicles: 1,
  };

  console.log('\n👤 Carbon Profile:');
  console.log(`   Name: ${profile.name}`);
  console.log(`   Household: ${profile.householdSize} people`);
  console.log(`   Diet: ${profile.dietType}`);
  console.log(`   Home: ${profile.homeSize}m² ${profile.homeType}`);

  // Create calculator
  const calculator = new CarbonCalculator(profile);

  // Estimate annual footprint
  const estimate = calculator.estimateAnnualFootprint();
  console.log('\n📊 Estimated Annual Footprint:');
  console.log(`   Total: ${(estimate.estimated / 1000).toFixed(1)} tonnes CO2e`);
  console.log('   Breakdown:');
  for (const [category, emissions] of Object.entries(estimate.breakdown)) {
    console.log(`     ${category}: ${emissions.toFixed(0)} kg`);
  }

  // Add some activities
  console.log('\n📝 Recording Activities...\n');

  // Transportation
  const carTrip = calculator.addActivity({
    category: 'transportation',
    type: 'car_gasoline',
    quantity: 50, // 50 km
    unit: 'km',
    timestamp: new Date(),
    notes: 'Commute to work',
  });
  console.log(`🚗 Car trip (50 km): ${carTrip.emissions.toFixed(2)} kg CO2e`);

  const busTrip = calculator.addActivity({
    category: 'transportation',
    type: 'bus',
    quantity: 20,
    unit: 'km',
    timestamp: new Date(),
  });
  console.log(`🚌 Bus ride (20 km): ${busTrip.emissions.toFixed(2)} kg CO2e`);

  const flight = calculator.addActivity({
    category: 'transportation',
    type: 'airplane_domestic',
    quantity: 800,
    unit: 'km',
    timestamp: new Date(),
    notes: 'Business trip',
  });
  console.log(`✈️  Flight (800 km): ${flight.emissions.toFixed(2)} kg CO2e`);

  // Energy
  console.log('');
  const electricity = calculator.addActivity({
    category: 'energy',
    type: 'electricity',
    quantity: 300, // kWh
    unit: 'kWh',
    timestamp: new Date(),
  });
  console.log(`💡 Electricity (300 kWh): ${electricity.emissions.toFixed(2)} kg CO2e`);

  const gas = calculator.addActivity({
    category: 'energy',
    type: 'natural_gas',
    quantity: 50, // therms
    unit: 'therms',
    timestamp: new Date(),
  });
  console.log(`🔥 Natural gas (50 therms): ${gas.emissions.toFixed(2)} kg CO2e`);

  // Food
  console.log('');
  const beef = calculator.addActivity({
    category: 'food',
    type: 'beef',
    quantity: 2, // kg
    unit: 'kg',
    timestamp: new Date(),
  });
  console.log(`🥩 Beef (2 kg): ${beef.emissions.toFixed(2)} kg CO2e`);

  const vegetables = calculator.addActivity({
    category: 'food',
    type: 'vegetables',
    quantity: 5,
    unit: 'kg',
    timestamp: new Date(),
  });
  console.log(`🥬 Vegetables (5 kg): ${vegetables.emissions.toFixed(2)} kg CO2e`);

  // Local organic food (with modifiers)
  const localOrganic = calculator.addActivity({
    category: 'food',
    type: 'vegetables',
    quantity: 3,
    unit: 'kg',
    timestamp: new Date(),
    notes: 'Local farmers market',
  });
  // Apply organic/local modifiers manually for demo
  console.log(`🌿 Local vegetables (3 kg): ${localOrganic.emissions.toFixed(2)} kg CO2e`);

  // Waste
  console.log('');
  const landfill = calculator.addActivity({
    category: 'waste',
    type: 'landfill',
    quantity: 10,
    unit: 'kg',
    timestamp: new Date(),
  });
  console.log(`🗑️  Landfill waste (10 kg): ${landfill.emissions.toFixed(2)} kg CO2e`);

  const recycling = calculator.addActivity({
    category: 'waste',
    type: 'recycling',
    quantity: 15,
    unit: 'kg',
    timestamp: new Date(),
  });
  console.log(
    `♻️  Recycling (15 kg): ${recycling.emissions.toFixed(2)} kg CO2e (saved!)`
  );

  // Get summary
  const summary = calculator.getSummary();
  console.log('\n📋 Carbon Summary:');
  console.log(`   Total Emissions: ${summary.totalEmissions.toFixed(2)} kg CO2e`);
  console.log(`   Activities: ${summary.activityCount}`);
  console.log(`   Daily Average: ${summary.averageDaily.toFixed(2)} kg`);

  console.log('\n   By Category:');
  for (const [category, emissions] of Object.entries(summary.byCategory)) {
    if (emissions !== 0) {
      const percentage = ((emissions / summary.totalEmissions) * 100).toFixed(1);
      console.log(`     ${category}: ${emissions.toFixed(2)} kg (${percentage}%)`);
    }
  }

  if (summary.comparison) {
    console.log('\n   Comparison:');
    console.log(`     National average: ${summary.comparison.nationalAverage} t/year`);
    console.log(`     Global average: ${summary.comparison.globalAverage} t/year`);
    console.log(`     Your percentile: ${summary.comparison.percentile.toFixed(0)}%`);
  }

  // Get reduction tips
  const tips = calculator.getReductionTips();
  console.log('\n💡 Reduction Tips:');
  tips.slice(0, 5).forEach((tip, i) => {
    console.log(`   ${i + 1}. ${tip.title}`);
    console.log(`      ${tip.description}`);
    console.log(`      Potential savings: ${tip.potentialSavings} kg/year`);
    console.log(`      Difficulty: ${tip.difficulty}, Cost: ${tip.cost}`);
  });

  // Calculate offset
  const offset = calculator.calculateOffsetNeeded();
  console.log('\n🌳 Carbon Offset:');
  console.log(`   Annual emissions: ${(offset.totalEmissions / 1000).toFixed(2)} tonnes`);
  console.log(`   Offset needed: ${offset.offsetNeeded.toFixed(2)} tonnes`);
  console.log(`   Estimated cost: $${offset.estimatedCost.min}-${offset.estimatedCost.max}/year`);

  // Add a reduction goal
  console.log('\n🎯 Setting Reduction Goal...');
  const goal = calculator.addGoal({
    name: 'Reduce transportation emissions by 25%',
    targetReduction: 25,
    category: 'transportation',
    startDate: new Date(new Date().getFullYear(), 0, 1),
    endDate: new Date(new Date().getFullYear(), 11, 31),
    baselineEmissions: 3000,
  });
  console.log(`   Goal: ${goal.name}`);
  console.log(`   Target: ${goal.targetReduction}% reduction`);

  // Export data
  console.log('\n💾 Exporting data...');
  const exportedData = calculator.exportData();
  console.log(`   Exported ${exportedData.length} bytes of data`);

  console.log('\n' + '='.repeat(60));
  console.log('Example completed!');
}

main().catch(console.error);
