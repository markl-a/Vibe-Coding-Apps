/**
 * Waste Management and Recycling Tracking Example
 *
 * Demonstrates comprehensive waste tracking, recycling optimization,
 * circular economy principles, and waste-to-energy calculations.
 */

// ============================================================================
// Waste Management Types
// ============================================================================

interface WasteItem {
  id: string;
  timestamp: Date;
  category: 'organic' | 'recyclable' | 'hazardous' | 'electronic' | 'general' | 'construction';
  subcategory: string;
  weight: number; // kg
  volume: number; // liters
  source: string;
  disposed: boolean;
  disposalMethod?: 'landfill' | 'recycling' | 'composting' | 'incineration' | 'donation' | 'reuse';
}

interface RecyclingStream {
  material: 'paper' | 'cardboard' | 'plastic' | 'glass' | 'metal' | 'electronics' | 'organic';
  weight: number; // kg
  contaminationRate: number; // 0-1
  marketValue: number; // $ per kg
  co2Savings: number; // kg CO2e per kg recycled
}

interface WasteFacility {
  id: string;
  name: string;
  type: 'landfill' | 'recycling_center' | 'composting' | 'waste_to_energy' | 'transfer_station';
  location: string;
  capacity: number; // tonnes
  currentLoad: number; // tonnes
  acceptedMaterials: string[];
  processingRate: number; // tonnes per day
}

interface CompostingOperation {
  id: string;
  method: 'aerobic' | 'anaerobic' | 'vermicomposting';
  inputWeight: number; // kg
  outputWeight: number; // kg (finished compost)
  conversionRate: number; // 0-1
  methaneReduction: number; // kg CO2e avoided
  nutrientContent: {
    nitrogen: number; // %
    phosphorus: number; // %
    potassium: number; // %
  };
}

interface WasteAudit {
  date: Date;
  location: string;
  totalWaste: number; // kg
  composition: Map<string, number>; // material -> percentage
  diversionRate: number; // percentage diverted from landfill
  recommendations: string[];
}

// ============================================================================
// Waste Tracking System
// ============================================================================

class WasteTracker {
  private wasteItems: WasteItem[] = [];
  private facilities: Map<string, WasteFacility> = new Map();
  private recyclingStreams: Map<string, RecyclingStream> = new Map();
  private idCounter = 0;

  constructor() {
    this.initializeRecyclingStreams();
  }

  /**
   * Initialize recycling stream data
   */
  private initializeRecyclingStreams(): void {
    const streams: RecyclingStream[] = [
      {
        material: 'paper',
        weight: 0,
        contaminationRate: 0.05,
        marketValue: 0.10,
        co2Savings: 1.84, // kg CO2e per kg
      },
      {
        material: 'cardboard',
        weight: 0,
        contaminationRate: 0.03,
        marketValue: 0.15,
        co2Savings: 1.56,
      },
      {
        material: 'plastic',
        weight: 0,
        contaminationRate: 0.15,
        marketValue: 0.30,
        co2Savings: 1.72,
      },
      {
        material: 'glass',
        weight: 0,
        contaminationRate: 0.02,
        marketValue: 0.05,
        co2Savings: 0.31,
      },
      {
        material: 'metal',
        weight: 0,
        contaminationRate: 0.08,
        marketValue: 0.80,
        co2Savings: 3.90,
      },
      {
        material: 'electronics',
        weight: 0,
        contaminationRate: 0.10,
        marketValue: 2.50,
        co2Savings: 5.20,
      },
      {
        material: 'organic',
        weight: 0,
        contaminationRate: 0.20,
        marketValue: 0,
        co2Savings: 0.45, // via composting
      },
    ];

    streams.forEach((stream) => {
      this.recyclingStreams.set(stream.material, stream);
    });
  }

  /**
   * Add waste facility
   */
  addFacility(facility: WasteFacility): void {
    this.facilities.set(facility.id, facility);
    console.log(`Added facility: ${facility.name} (${facility.type})`);
  }

  /**
   * Track waste item
   */
  trackWaste(waste: Omit<WasteItem, 'id' | 'timestamp' | 'disposed'>): WasteItem {
    const item: WasteItem = {
      ...waste,
      id: `waste_${++this.idCounter}`,
      timestamp: new Date(),
      disposed: false,
    };

    this.wasteItems.push(item);
    return item;
  }

  /**
   * Dispose waste item
   */
  disposeWaste(itemId: string, method: WasteItem['disposalMethod']): void {
    const item = this.wasteItems.find((w) => w.id === itemId);
    if (item) {
      item.disposed = true;
      item.disposalMethod = method;

      // Update recycling stream if applicable
      if (method === 'recycling') {
        this.updateRecyclingStream(item);
      }
    }
  }

  /**
   * Update recycling stream data
   */
  private updateRecyclingStream(item: WasteItem): void {
    const materialMap: Record<string, RecyclingStream['material']> = {
      paper: 'paper',
      cardboard: 'cardboard',
      plastic: 'plastic',
      glass: 'glass',
      metal: 'metal',
      electronics: 'electronics',
      food: 'organic',
      yard: 'organic',
    };

    const material = materialMap[item.subcategory];
    if (material) {
      const stream = this.recyclingStreams.get(material);
      if (stream) {
        stream.weight += item.weight;
      }
    }
  }

  /**
   * Calculate waste diversion rate
   */
  calculateDiversionRate(): number {
    const totalWaste = this.wasteItems.reduce((sum, item) => sum + item.weight, 0);
    const divertedWaste = this.wasteItems
      .filter(
        (item) =>
          item.disposalMethod &&
          ['recycling', 'composting', 'donation', 'reuse'].includes(item.disposalMethod)
      )
      .reduce((sum, item) => sum + item.weight, 0);

    return totalWaste > 0 ? (divertedWaste / totalWaste) * 100 : 0;
  }

  /**
   * Calculate environmental impact
   */
  calculateImpact(): {
    co2Avoided: number;
    landfillAvoided: number;
    recyclingValue: number;
  } {
    let co2Avoided = 0;
    let recyclingValue = 0;

    this.recyclingStreams.forEach((stream) => {
      co2Avoided += stream.weight * stream.co2Savings;
      recyclingValue += stream.weight * stream.marketValue;
    });

    const landfillAvoided = Array.from(this.recyclingStreams.values()).reduce(
      (sum, stream) => sum + stream.weight,
      0
    );

    return { co2Avoided, landfillAvoided, recyclingValue };
  }

  /**
   * Perform waste audit
   */
  performAudit(location: string, samples: WasteItem[]): WasteAudit {
    const totalWaste = samples.reduce((sum, item) => sum + item.weight, 0);
    const composition = new Map<string, number>();

    // Calculate composition
    samples.forEach((item) => {
      const current = composition.get(item.subcategory) || 0;
      composition.set(item.subcategory, current + item.weight);
    });

    // Convert to percentages
    composition.forEach((weight, material) => {
      composition.set(material, (weight / totalWaste) * 100);
    });

    const diversionRate = this.calculateDiversionRate();
    const recommendations = this.generateRecommendations(composition, diversionRate);

    return {
      date: new Date(),
      location,
      totalWaste,
      composition,
      diversionRate,
      recommendations,
    };
  }

  /**
   * Generate waste reduction recommendations
   */
  private generateRecommendations(
    composition: Map<string, number>,
    diversionRate: number
  ): string[] {
    const recommendations: string[] = [];

    // Check for high recyclable content
    const recyclables = ['paper', 'cardboard', 'plastic', 'glass', 'metal'];
    let recyclablePercent = 0;
    recyclables.forEach((material) => {
      recyclablePercent += composition.get(material) || 0;
    });

    if (recyclablePercent > 30) {
      recommendations.push(
        `High recyclable content (${recyclablePercent.toFixed(1)}%) - improve recycling bin access and signage`
      );
    }

    // Check for organic waste
    const organicPercent = (composition.get('food') || 0) + (composition.get('yard') || 0);
    if (organicPercent > 20) {
      recommendations.push(
        `Significant organic waste (${organicPercent.toFixed(1)}%) - implement composting program`
      );
    }

    // Check diversion rate
    if (diversionRate < 50) {
      recommendations.push(
        `Low diversion rate (${diversionRate.toFixed(1)}%) - target 50% or higher`
      );
    } else if (diversionRate >= 75) {
      recommendations.push(`Excellent diversion rate (${diversionRate.toFixed(1)}%) - maintain!`);
    }

    // Check for specific materials
    if ((composition.get('electronics') || 0) > 5) {
      recommendations.push('E-waste detected - set up dedicated electronics recycling program');
    }

    return recommendations;
  }

  /**
   * Get waste statistics
   */
  getStatistics(): {
    totalWaste: number;
    byCategory: Map<string, number>;
    byDisposal: Map<string, number>;
    diversionRate: number;
  } {
    const totalWaste = this.wasteItems.reduce((sum, item) => sum + item.weight, 0);
    const byCategory = new Map<string, number>();
    const byDisposal = new Map<string, number>();

    this.wasteItems.forEach((item) => {
      // By category
      const catWeight = byCategory.get(item.category) || 0;
      byCategory.set(item.category, catWeight + item.weight);

      // By disposal method
      if (item.disposalMethod) {
        const dispWeight = byDisposal.get(item.disposalMethod) || 0;
        byDisposal.set(item.disposalMethod, dispWeight + item.weight);
      }
    });

    return {
      totalWaste,
      byCategory,
      byDisposal,
      diversionRate: this.calculateDiversionRate(),
    };
  }
}

// ============================================================================
// Composting System
// ============================================================================

class CompostingSystem {
  private operations: CompostingOperation[] = [];

  /**
   * Process organic waste into compost
   */
  processCompost(
    inputWeight: number,
    method: CompostingOperation['method'] = 'aerobic'
  ): CompostingOperation {
    // Conversion rates vary by method
    const conversionRates = {
      aerobic: 0.40, // 40% of input becomes finished compost
      anaerobic: 0.35,
      vermicomposting: 0.45,
    };

    const conversionRate = conversionRates[method];
    const outputWeight = inputWeight * conversionRate;

    // Methane reduction (avoided if sent to landfill)
    const methaneReduction = inputWeight * 0.58; // kg CO2e per kg

    const operation: CompostingOperation = {
      id: `compost_${this.operations.length + 1}`,
      method,
      inputWeight,
      outputWeight,
      conversionRate,
      methaneReduction,
      nutrientContent: {
        nitrogen: 1.5 + Math.random() * 0.5,
        phosphorus: 0.8 + Math.random() * 0.3,
        potassium: 1.2 + Math.random() * 0.4,
      },
    };

    this.operations.push(operation);
    return operation;
  }

  /**
   * Get composting statistics
   */
  getStatistics(): {
    totalInput: number;
    totalOutput: number;
    totalMethaneAvoided: number;
    avgConversionRate: number;
  } {
    const totalInput = this.operations.reduce((sum, op) => sum + op.inputWeight, 0);
    const totalOutput = this.operations.reduce((sum, op) => sum + op.outputWeight, 0);
    const totalMethaneAvoided = this.operations.reduce((sum, op) => sum + op.methaneReduction, 0);
    const avgConversionRate =
      this.operations.length > 0
        ? this.operations.reduce((sum, op) => sum + op.conversionRate, 0) / this.operations.length
        : 0;

    return {
      totalInput,
      totalOutput,
      totalMethaneAvoided,
      avgConversionRate,
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('\n' + '*'.repeat(70));
  console.log('WASTE MANAGEMENT & RECYCLING - COMPREHENSIVE EXAMPLE');
  console.log('*'.repeat(70));

  // ============================================================================
  // Initialize Waste Tracking System
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('WASTE TRACKING SYSTEM');
  console.log('='.repeat(70));

  const tracker = new WasteTracker();

  // Add facilities
  console.log('\n--- Adding Waste Facilities ---\n');
  tracker.addFacility({
    id: 'facility_1',
    name: 'City Recycling Center',
    type: 'recycling_center',
    location: 'Downtown',
    capacity: 50000,
    currentLoad: 25000,
    acceptedMaterials: ['paper', 'cardboard', 'plastic', 'glass', 'metal'],
    processingRate: 100,
  });

  tracker.addFacility({
    id: 'facility_2',
    name: 'Composting Facility',
    type: 'composting',
    location: 'Industrial Zone',
    capacity: 20000,
    currentLoad: 8000,
    acceptedMaterials: ['food', 'yard', 'paper'],
    processingRate: 50,
  });

  // Track weekly waste for an office building
  console.log('\n--- Tracking Office Building Waste (Weekly) ---\n');

  const officeWaste = [
    { category: 'recyclable' as const, subcategory: 'paper', weight: 45, volume: 200, source: 'offices' },
    { category: 'recyclable' as const, subcategory: 'cardboard', weight: 30, volume: 150, source: 'shipping' },
    { category: 'recyclable' as const, subcategory: 'plastic', weight: 12, volume: 80, source: 'breakroom' },
    { category: 'recyclable' as const, subcategory: 'glass', weight: 8, volume: 40, source: 'breakroom' },
    { category: 'recyclable' as const, subcategory: 'metal', weight: 5, volume: 20, source: 'breakroom' },
    { category: 'organic' as const, subcategory: 'food', weight: 25, volume: 60, source: 'cafeteria' },
    { category: 'general' as const, subcategory: 'mixed', weight: 35, volume: 100, source: 'offices' },
    { category: 'electronic' as const, subcategory: 'electronics', weight: 15, volume: 30, source: 'IT' },
  ];

  officeWaste.forEach((waste) => {
    const item = tracker.trackWaste(waste);
    console.log(`Tracked: ${waste.weight} kg of ${waste.subcategory} from ${waste.source}`);

    // Dispose items appropriately
    if (waste.category === 'recyclable' || waste.subcategory === 'electronics') {
      tracker.disposeWaste(item.id, 'recycling');
    } else if (waste.category === 'organic') {
      tracker.disposeWaste(item.id, 'composting');
    } else {
      tracker.disposeWaste(item.id, 'landfill');
    }
  });

  // Get statistics
  console.log('\n--- Waste Statistics ---');
  const stats = tracker.getStatistics();
  console.log(`Total Waste: ${stats.totalWaste.toFixed(1)} kg`);
  console.log(`Diversion Rate: ${stats.diversionRate.toFixed(1)}%`);

  console.log('\n--- Waste by Category ---');
  stats.byCategory.forEach((weight, category) => {
    const percentage = ((weight / stats.totalWaste) * 100).toFixed(1);
    console.log(`  ${category}: ${weight.toFixed(1)} kg (${percentage}%)`);
  });

  console.log('\n--- Waste by Disposal Method ---');
  stats.byDisposal.forEach((weight, method) => {
    const percentage = ((weight / stats.totalWaste) * 100).toFixed(1);
    console.log(`  ${method}: ${weight.toFixed(1)} kg (${percentage}%)`);
  });

  // Calculate environmental impact
  console.log('\n--- Environmental Impact ---');
  const impact = tracker.calculateImpact();
  console.log(`CO2 Avoided: ${impact.co2Avoided.toFixed(2)} kg`);
  console.log(`Waste Diverted from Landfill: ${impact.landfillAvoided.toFixed(1)} kg`);
  console.log(`Recycling Value: $${impact.recyclingValue.toFixed(2)}`);

  // ============================================================================
  // Waste Audit
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('WASTE AUDIT');
  console.log('='.repeat(70));

  // Create audit samples
  const auditSamples: WasteItem[] = [];
  officeWaste.forEach((waste, i) => {
    auditSamples.push({
      id: `audit_${i}`,
      timestamp: new Date(),
      category: waste.category,
      subcategory: waste.subcategory,
      weight: waste.weight,
      volume: waste.volume,
      source: waste.source,
      disposed: true,
      disposalMethod: waste.category === 'recyclable' ? 'recycling' : 'landfill',
    });
  });

  const audit = tracker.performAudit('Main Office Building', auditSamples);

  console.log(`\nAudit Date: ${audit.date.toLocaleDateString()}`);
  console.log(`Location: ${audit.location}`);
  console.log(`Total Waste Sampled: ${audit.totalWaste.toFixed(1)} kg`);
  console.log(`Current Diversion Rate: ${audit.diversionRate.toFixed(1)}%`);

  console.log('\n--- Waste Composition ---');
  const sortedComposition = Array.from(audit.composition.entries()).sort((a, b) => b[1] - a[1]);
  sortedComposition.forEach(([material, percentage]) => {
    console.log(`  ${material}: ${percentage.toFixed(1)}%`);
  });

  console.log('\n--- Recommendations ---');
  audit.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  // ============================================================================
  // Composting System
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('COMPOSTING OPERATIONS');
  console.log('='.repeat(70));

  const composting = new CompostingSystem();

  console.log('\n--- Processing Organic Waste ---\n');

  // Process different types of organic waste
  const operations = [
    { weight: 100, method: 'aerobic' as const, name: 'Food waste from cafeteria' },
    { weight: 75, method: 'aerobic' as const, name: 'Yard waste from landscaping' },
    { weight: 50, method: 'vermicomposting' as const, name: 'Office food scraps' },
  ];

  operations.forEach((op) => {
    const result = composting.processCompost(op.weight, op.method);
    console.log(`${op.name}:`);
    console.log(`  Input: ${result.inputWeight} kg`);
    console.log(`  Method: ${result.method}`);
    console.log(`  Output: ${result.outputWeight.toFixed(1)} kg finished compost`);
    console.log(`  Conversion Rate: ${(result.conversionRate * 100).toFixed(0)}%`);
    console.log(`  Methane Avoided: ${result.methaneReduction.toFixed(2)} kg CO2e`);
    console.log(`  Nutrients: N=${result.nutrientContent.nitrogen.toFixed(1)}%, ` +
      `P=${result.nutrientContent.phosphorus.toFixed(1)}%, ` +
      `K=${result.nutrientContent.potassium.toFixed(1)}%`);
    console.log();
  });

  const compostStats = composting.getStatistics();
  console.log('--- Composting Statistics ---');
  console.log(`Total Input: ${compostStats.totalInput} kg`);
  console.log(`Total Compost Produced: ${compostStats.totalOutput.toFixed(1)} kg`);
  console.log(`Average Conversion Rate: ${(compostStats.avgConversionRate * 100).toFixed(1)}%`);
  console.log(`Total Methane Avoided: ${compostStats.totalMethaneAvoided.toFixed(2)} kg CO2e`);
  console.log(`Equivalent to removing ${(compostStats.totalMethaneAvoided / 4600).toFixed(2)} cars for a year`);

  // ============================================================================
  // Annual Projections
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('ANNUAL PROJECTIONS');
  console.log('='.repeat(70));

  const weeksPerYear = 52;
  const annualWaste = stats.totalWaste * weeksPerYear;
  const annualDiverted = (annualWaste * stats.diversionRate) / 100;
  const annualLandfill = annualWaste - annualDiverted;
  const annualCO2Avoided = impact.co2Avoided * weeksPerYear;
  const annualRecyclingValue = impact.recyclingValue * weeksPerYear;

  console.log(`\nProjected Annual Totals:`);
  console.log(`  Total Waste: ${(annualWaste / 1000).toFixed(2)} tonnes`);
  console.log(`  Diverted: ${(annualDiverted / 1000).toFixed(2)} tonnes (${stats.diversionRate.toFixed(1)}%)`);
  console.log(`  To Landfill: ${(annualLandfill / 1000).toFixed(2)} tonnes`);
  console.log(`  CO2 Avoided: ${(annualCO2Avoided / 1000).toFixed(2)} tonnes`);
  console.log(`  Recycling Revenue: $${annualRecyclingValue.toFixed(2)}`);

  console.log(`\nWaste Reduction Goals:`);
  const targetDiversion = 75; // %
  const currentDiversion = stats.diversionRate;
  const improvementNeeded = targetDiversion - currentDiversion;
  const additionalDiversionWeight = (annualWaste * improvementNeeded) / 100;

  console.log(`  Current Diversion: ${currentDiversion.toFixed(1)}%`);
  console.log(`  Target Diversion: ${targetDiversion}%`);
  console.log(`  Improvement Needed: ${improvementNeeded.toFixed(1)}%`);
  console.log(`  Additional Diversion Required: ${(additionalDiversionWeight / 1000).toFixed(2)} tonnes/year`);

  console.log('\n' + '*'.repeat(70));
  console.log('Example completed successfully!');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
