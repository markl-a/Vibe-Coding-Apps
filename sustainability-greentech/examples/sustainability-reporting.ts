/**
 * Sustainability Reporting Example
 *
 * Demonstrates ESG (Environmental, Social, Governance) reporting,
 * GRI (Global Reporting Initiative) standards compliance,
 * carbon accounting, and sustainability metrics tracking.
 */

import { CarbonCalculator, type CarbonProfile } from '../carbon-tracking/carbon-calculator/src/index.js';

// ============================================================================
// Sustainability Reporting Types
// ============================================================================

interface ESGMetrics {
  period: {
    start: Date;
    end: Date;
  };
  environmental: EnvironmentalMetrics;
  social: SocialMetrics;
  governance: GovernanceMetrics;
}

interface EnvironmentalMetrics {
  // Climate & Energy
  totalEmissions: number; // tonnes CO2e
  scope1Emissions: number; // Direct emissions
  scope2Emissions: number; // Indirect from purchased energy
  scope3Emissions: number; // Other indirect emissions
  energyConsumption: number; // MWh
  renewableEnergy: number; // MWh
  renewablePercentage: number; // %

  // Water
  waterConsumption: number; // cubic meters
  waterRecycled: number; // cubic meters
  waterIntensity: number; // m³ per unit output

  // Waste
  wasteGenerated: number; // tonnes
  wasteRecycled: number; // tonnes
  wasteDiverted: number; // tonnes
  diversionRate: number; // %

  // Biodiversity
  landUse: number; // hectares
  protectedAreas: number; // hectares
  treesPlanted: number;
}

interface SocialMetrics {
  // Workforce
  totalEmployees: number;
  diversityRate: number; // %
  turnoverRate: number; // %
  trainingHours: number;
  safetyIncidents: number;

  // Community
  communityInvestment: number; // $
  volunteerHours: number;
  localSuppliers: number; // %
  communityProjects: number;
}

interface GovernanceMetrics {
  // Leadership
  boardDiversity: number; // %
  independentDirectors: number; // %
  esgCommittees: number;

  // Ethics
  ethicsTraining: number; // % of employees
  whistleblowerReports: number;
  policyViolations: number;

  // Compliance
  regulatoryFines: number; // $
  auditCompletions: number; // %
  certifications: string[];
}

interface GRIIndicator {
  code: string;
  category: 'environmental' | 'social' | 'governance';
  name: string;
  value: number | string;
  unit: string;
  target?: number;
  performance: 'on-track' | 'at-risk' | 'off-track' | 'achieved';
  disclosure: 'full' | 'partial' | 'none';
}

interface SustainabilityGoal {
  id: string;
  category: 'climate' | 'water' | 'waste' | 'social' | 'governance';
  goal: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: 'on-track' | 'at-risk' | 'achieved' | 'missed';
  initiatives: string[];
}

interface CarbonInventory {
  year: number;
  scope1: {
    stationaryCombustion: number;
    mobileCombustion: number;
    fugitiveEmissions: number;
    processEmissions: number;
    total: number;
  };
  scope2: {
    purchasedElectricity: number;
    purchasedSteam: number;
    purchasedHeating: number;
    purchasedCooling: number;
    total: number;
  };
  scope3: {
    purchasedGoods: number;
    capitalGoods: number;
    fuelEnergy: number;
    upstream: number;
    waste: number;
    businessTravel: number;
    employeeCommuting: number;
    downstreamTransport: number;
    useOfProducts: number;
    endOfLife: number;
    total: number;
  };
  totalEmissions: number;
  intensity: number; // per revenue or per employee
}

// ============================================================================
// Sustainability Reporting System
// ============================================================================

class SustainabilityReporter {
  private metrics: ESGMetrics[] = [];
  private goals: SustainabilityGoal[] = [];
  private indicators: GRIIndicator[] = [];
  private inventory: CarbonInventory[] = [];

  /**
   * Record ESG metrics for a period
   */
  recordMetrics(metrics: ESGMetrics): void {
    this.metrics.push(metrics);
  }

  /**
   * Add sustainability goal
   */
  addGoal(goal: SustainabilityGoal): void {
    this.goals.push(goal);
  }

  /**
   * Add GRI indicator
   */
  addGRIIndicator(indicator: GRIIndicator): void {
    this.indicators.push(indicator);
  }

  /**
   * Record carbon inventory
   */
  recordCarbonInventory(inventory: CarbonInventory): void {
    this.inventory.push(inventory);
  }

  /**
   * Calculate ESG score (simplified 0-100 scale)
   */
  calculateESGScore(metrics: ESGMetrics): {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
  } {
    // Environmental score (0-100)
    const envScore =
      (metrics.environmental.renewablePercentage +
        metrics.environmental.diversionRate +
        Math.min(100, (1 - metrics.environmental.waterIntensity / 10) * 100)) /
      3;

    // Social score (0-100)
    const socialScore =
      (metrics.social.diversityRate +
        Math.max(0, 100 - metrics.social.turnoverRate * 2) +
        Math.min(100, (metrics.social.trainingHours / metrics.social.totalEmployees / 40) * 100)) /
      3;

    // Governance score (0-100)
    const govScore =
      (metrics.governance.boardDiversity +
        metrics.governance.independentDirectors +
        metrics.governance.ethicsTraining) /
      3;

    const overall = (envScore + socialScore + govScore) / 3;

    return {
      overall: Math.round(overall),
      environmental: Math.round(envScore),
      social: Math.round(socialScore),
      governance: Math.round(govScore),
    };
  }

  /**
   * Generate carbon footprint summary
   */
  generateCarbonSummary(): void {
    if (this.inventory.length === 0) {
      console.log('No carbon inventory data available');
      return;
    }

    const latest = this.inventory[this.inventory.length - 1];

    console.log('\n' + '='.repeat(70));
    console.log(`CARBON INVENTORY - ${latest.year}`);
    console.log('='.repeat(70));

    console.log('\n--- Scope 1 (Direct Emissions) ---');
    console.log(`  Stationary Combustion: ${latest.scope1.stationaryCombustion.toFixed(2)} tonnes CO2e`);
    console.log(`  Mobile Combustion: ${latest.scope1.mobileCombustion.toFixed(2)} tonnes CO2e`);
    console.log(`  Fugitive Emissions: ${latest.scope1.fugitiveEmissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Process Emissions: ${latest.scope1.processEmissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 1 Total: ${latest.scope1.total.toFixed(2)} tonnes CO2e`);

    console.log('\n--- Scope 2 (Indirect - Purchased Energy) ---');
    console.log(`  Purchased Electricity: ${latest.scope2.purchasedElectricity.toFixed(2)} tonnes CO2e`);
    console.log(`  Purchased Steam: ${latest.scope2.purchasedSteam.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 2 Total: ${latest.scope2.total.toFixed(2)} tonnes CO2e`);

    console.log('\n--- Scope 3 (Other Indirect Emissions) ---');
    console.log(`  Purchased Goods & Services: ${latest.scope3.purchasedGoods.toFixed(2)} tonnes CO2e`);
    console.log(`  Business Travel: ${latest.scope3.businessTravel.toFixed(2)} tonnes CO2e`);
    console.log(`  Employee Commuting: ${latest.scope3.employeeCommuting.toFixed(2)} tonnes CO2e`);
    console.log(`  Waste Generated: ${latest.scope3.waste.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 3 Total: ${latest.scope3.total.toFixed(2)} tonnes CO2e`);

    console.log('\n--- Total Emissions ---');
    console.log(`  Total: ${latest.totalEmissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Intensity: ${latest.intensity.toFixed(4)} tonnes CO2e per unit`);

    const scope1Percent = ((latest.scope1.total / latest.totalEmissions) * 100).toFixed(1);
    const scope2Percent = ((latest.scope2.total / latest.totalEmissions) * 100).toFixed(1);
    const scope3Percent = ((latest.scope3.total / latest.totalEmissions) * 100).toFixed(1);

    console.log('\n--- Emissions Breakdown ---');
    console.log(`  Scope 1: ${scope1Percent}%`);
    console.log(`  Scope 2: ${scope2Percent}%`);
    console.log(`  Scope 3: ${scope3Percent}%`);

    // Year-over-year comparison
    if (this.inventory.length > 1) {
      const previous = this.inventory[this.inventory.length - 2];
      const change = ((latest.totalEmissions - previous.totalEmissions) / previous.totalEmissions) * 100;
      const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      console.log(`\n--- Year-over-Year Change ---`);
      console.log(`  ${previous.year}: ${previous.totalEmissions.toFixed(2)} tonnes CO2e`);
      console.log(`  ${latest.year}: ${latest.totalEmissions.toFixed(2)} tonnes CO2e`);
      console.log(`  Change: ${changeStr}`);
    }
  }

  /**
   * Generate GRI compliance report
   */
  generateGRIReport(): void {
    console.log('\n' + '='.repeat(70));
    console.log('GRI STANDARDS COMPLIANCE REPORT');
    console.log('='.repeat(70));

    const categories = ['environmental', 'social', 'governance'] as const;

    categories.forEach((category) => {
      const categoryIndicators = this.indicators.filter((i) => i.category === category);
      if (categoryIndicators.length === 0) return;

      console.log(`\n--- ${category.toUpperCase()} INDICATORS ---\n`);

      categoryIndicators.forEach((indicator) => {
        console.log(`${indicator.code}: ${indicator.name}`);
        console.log(`  Value: ${indicator.value} ${indicator.unit}`);
        if (indicator.target) {
          const progress = typeof indicator.value === 'number'
            ? ((indicator.value / indicator.target) * 100).toFixed(1)
            : 'N/A';
          console.log(`  Target: ${indicator.target} ${indicator.unit} (${progress}% achieved)`);
        }
        console.log(`  Performance: ${indicator.performance}`);
        console.log(`  Disclosure: ${indicator.disclosure}`);
        console.log();
      });
    });

    // Calculate disclosure rate
    const fullDisclosure = this.indicators.filter((i) => i.disclosure === 'full').length;
    const disclosureRate = ((fullDisclosure / this.indicators.length) * 100).toFixed(1);
    console.log(`\n--- Disclosure Summary ---`);
    console.log(`Total Indicators: ${this.indicators.length}`);
    console.log(`Full Disclosure: ${fullDisclosure}`);
    console.log(`Disclosure Rate: ${disclosureRate}%`);
  }

  /**
   * Track progress on sustainability goals
   */
  trackGoalProgress(): void {
    console.log('\n' + '='.repeat(70));
    console.log('SUSTAINABILITY GOALS PROGRESS');
    console.log('='.repeat(70));

    const categories = ['climate', 'water', 'waste', 'social', 'governance'] as const;

    categories.forEach((category) => {
      const categoryGoals = this.goals.filter((g) => g.category === category);
      if (categoryGoals.length === 0) return;

      console.log(`\n--- ${category.toUpperCase()} GOALS ---\n`);

      categoryGoals.forEach((goal) => {
        const progress = ((goal.current / goal.target) * 100).toFixed(1);
        const statusIcon =
          goal.status === 'achieved' ? '✓' :
          goal.status === 'on-track' ? '→' :
          goal.status === 'at-risk' ? '⚠' : '✗';

        console.log(`${statusIcon} ${goal.goal}`);
        console.log(`  Target: ${goal.target} ${goal.unit} by ${goal.deadline.toLocaleDateString()}`);
        console.log(`  Current: ${goal.current} ${goal.unit} (${progress}% of target)`);
        console.log(`  Status: ${goal.status}`);
        if (goal.initiatives.length > 0) {
          console.log(`  Initiatives:`);
          goal.initiatives.forEach((initiative) => {
            console.log(`    - ${initiative}`);
          });
        }
        console.log();
      });
    });
  }

  /**
   * Generate comprehensive sustainability report
   */
  generateComprehensiveReport(): void {
    if (this.metrics.length === 0) {
      console.log('No metrics data available');
      return;
    }

    const latest = this.metrics[this.metrics.length - 1];
    const scores = this.calculateESGScore(latest);

    console.log('\n' + '*'.repeat(70));
    console.log('COMPREHENSIVE SUSTAINABILITY REPORT');
    console.log('*'.repeat(70));

    console.log(`\nReporting Period: ${latest.period.start.toLocaleDateString()} - ${latest.period.end.toLocaleDateString()}`);

    // ESG Scores
    console.log('\n' + '='.repeat(70));
    console.log('ESG PERFORMANCE SCORES');
    console.log('='.repeat(70));
    console.log(`\nOverall ESG Score: ${scores.overall}/100`);
    console.log(`  Environmental: ${scores.environmental}/100`);
    console.log(`  Social: ${scores.social}/100`);
    console.log(`  Governance: ${scores.governance}/100`);

    // Environmental Performance
    console.log('\n' + '='.repeat(70));
    console.log('ENVIRONMENTAL PERFORMANCE');
    console.log('='.repeat(70));

    console.log('\n--- Climate & Energy ---');
    console.log(`Total Emissions: ${latest.environmental.totalEmissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 1: ${latest.environmental.scope1Emissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 2: ${latest.environmental.scope2Emissions.toFixed(2)} tonnes CO2e`);
    console.log(`  Scope 3: ${latest.environmental.scope3Emissions.toFixed(2)} tonnes CO2e`);
    console.log(`Energy Consumption: ${latest.environmental.energyConsumption.toFixed(2)} MWh`);
    console.log(`Renewable Energy: ${latest.environmental.renewableEnergy.toFixed(2)} MWh (${latest.environmental.renewablePercentage.toFixed(1)}%)`);

    console.log('\n--- Water ---');
    console.log(`Water Consumption: ${latest.environmental.waterConsumption.toLocaleString()} m³`);
    console.log(`Water Recycled: ${latest.environmental.waterRecycled.toLocaleString()} m³`);
    console.log(`Water Intensity: ${latest.environmental.waterIntensity.toFixed(3)} m³ per unit output`);

    console.log('\n--- Waste ---');
    console.log(`Waste Generated: ${latest.environmental.wasteGenerated.toFixed(2)} tonnes`);
    console.log(`Waste Recycled: ${latest.environmental.wasteRecycled.toFixed(2)} tonnes`);
    console.log(`Waste Diverted: ${latest.environmental.wasteDiverted.toFixed(2)} tonnes`);
    console.log(`Diversion Rate: ${latest.environmental.diversionRate.toFixed(1)}%`);

    console.log('\n--- Biodiversity ---');
    console.log(`Total Land Use: ${latest.environmental.landUse.toFixed(2)} hectares`);
    console.log(`Protected Areas: ${latest.environmental.protectedAreas.toFixed(2)} hectares`);
    console.log(`Trees Planted: ${latest.environmental.treesPlanted.toLocaleString()}`);

    // Social Performance
    console.log('\n' + '='.repeat(70));
    console.log('SOCIAL PERFORMANCE');
    console.log('='.repeat(70));

    console.log('\n--- Workforce ---');
    console.log(`Total Employees: ${latest.social.totalEmployees.toLocaleString()}`);
    console.log(`Diversity Rate: ${latest.social.diversityRate.toFixed(1)}%`);
    console.log(`Turnover Rate: ${latest.social.turnoverRate.toFixed(1)}%`);
    console.log(`Training Hours: ${latest.social.trainingHours.toLocaleString()} total (${(latest.social.trainingHours / latest.social.totalEmployees).toFixed(1)} per employee)`);
    console.log(`Safety Incidents: ${latest.social.safetyIncidents}`);

    console.log('\n--- Community Engagement ---');
    console.log(`Community Investment: $${latest.social.communityInvestment.toLocaleString()}`);
    console.log(`Volunteer Hours: ${latest.social.volunteerHours.toLocaleString()}`);
    console.log(`Local Suppliers: ${latest.social.localSuppliers.toFixed(1)}%`);
    console.log(`Community Projects: ${latest.social.communityProjects}`);

    // Governance Performance
    console.log('\n' + '='.repeat(70));
    console.log('GOVERNANCE PERFORMANCE');
    console.log('='.repeat(70));

    console.log('\n--- Leadership ---');
    console.log(`Board Diversity: ${latest.governance.boardDiversity.toFixed(1)}%`);
    console.log(`Independent Directors: ${latest.governance.independentDirectors.toFixed(1)}%`);
    console.log(`ESG Committees: ${latest.governance.esgCommittees}`);

    console.log('\n--- Ethics & Compliance ---');
    console.log(`Ethics Training Completion: ${latest.governance.ethicsTraining.toFixed(1)}%`);
    console.log(`Whistleblower Reports: ${latest.governance.whistleblowerReports}`);
    console.log(`Policy Violations: ${latest.governance.policyViolations}`);
    console.log(`Regulatory Fines: $${latest.governance.regulatoryFines.toLocaleString()}`);
    console.log(`Audit Completions: ${latest.governance.auditCompletions.toFixed(1)}%`);

    if (latest.governance.certifications.length > 0) {
      console.log(`\n--- Certifications ---`);
      latest.governance.certifications.forEach((cert) => {
        console.log(`  ✓ ${cert}`);
      });
    }

    // Additional reports
    this.generateCarbonSummary();
    this.generateGRIReport();
    this.trackGoalProgress();

    console.log('\n' + '*'.repeat(70));
    console.log('END OF SUSTAINABILITY REPORT');
    console.log('*'.repeat(70));
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('\n' + '*'.repeat(70));
  console.log('SUSTAINABILITY REPORTING - COMPREHENSIVE EXAMPLE');
  console.log('*'.repeat(70));

  const reporter = new SustainabilityReporter();

  // ============================================================================
  // Record ESG Metrics
  // ============================================================================

  const metrics: ESGMetrics = {
    period: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    environmental: {
      totalEmissions: 8450.5,
      scope1Emissions: 1250.0,
      scope2Emissions: 3200.5,
      scope3Emissions: 4000.0,
      energyConsumption: 12500,
      renewableEnergy: 4375,
      renewablePercentage: 35,
      waterConsumption: 125000,
      waterRecycled: 25000,
      waterIntensity: 2.5,
      wasteGenerated: 450,
      wasteRecycled: 320,
      wasteDiverted: 360,
      diversionRate: 71,
      landUse: 50,
      protectedAreas: 15,
      treesPlanted: 5000,
    },
    social: {
      totalEmployees: 500,
      diversityRate: 45,
      turnoverRate: 12,
      trainingHours: 20000,
      safetyIncidents: 3,
      communityInvestment: 250000,
      volunteerHours: 3500,
      localSuppliers: 65,
      communityProjects: 8,
    },
    governance: {
      boardDiversity: 40,
      independentDirectors: 60,
      esgCommittees: 2,
      ethicsTraining: 98,
      whistleblowerReports: 5,
      policyViolations: 2,
      regulatoryFines: 0,
      auditCompletions: 100,
      certifications: [
        'ISO 14001 - Environmental Management',
        'ISO 45001 - Occupational Health & Safety',
        'B Corporation Certified',
        'Carbon Neutral Certified',
      ],
    },
  };

  reporter.recordMetrics(metrics);

  // ============================================================================
  // Record Carbon Inventory
  // ============================================================================

  const inventory: CarbonInventory = {
    year: 2024,
    scope1: {
      stationaryCombustion: 850.0,
      mobileCombustion: 300.0,
      fugitiveEmissions: 50.0,
      processEmissions: 50.0,
      total: 1250.0,
    },
    scope2: {
      purchasedElectricity: 3000.5,
      purchasedSteam: 150.0,
      purchasedHeating: 50.0,
      purchasedCooling: 0,
      total: 3200.5,
    },
    scope3: {
      purchasedGoods: 1500.0,
      capitalGoods: 300.0,
      fuelEnergy: 200.0,
      upstream: 150.0,
      waste: 100.0,
      businessTravel: 800.0,
      employeeCommuting: 650.0,
      downstreamTransport: 200.0,
      useOfProducts: 0,
      endOfLife: 100.0,
      total: 4000.0,
    },
    totalEmissions: 8450.5,
    intensity: 16.9, // per employee
  };

  reporter.recordCarbonInventory(inventory);

  // Previous year for comparison
  const previousInventory: CarbonInventory = {
    year: 2023,
    scope1: { stationaryCombustion: 900.0, mobileCombustion: 350.0, fugitiveEmissions: 60.0, processEmissions: 55.0, total: 1365.0 },
    scope2: { purchasedElectricity: 3500.0, purchasedSteam: 180.0, purchasedHeating: 70.0, purchasedCooling: 0, total: 3750.0 },
    scope3: { purchasedGoods: 1600.0, capitalGoods: 350.0, fuelEnergy: 250.0, upstream: 180.0, waste: 120.0, businessTravel: 900.0, employeeCommuting: 700.0, downstreamTransport: 250.0, useOfProducts: 0, endOfLife: 120.0, total: 4470.0 },
    totalEmissions: 9585.0,
    intensity: 19.2,
  };

  reporter.recordCarbonInventory(previousInventory);

  // ============================================================================
  // Add GRI Indicators
  // ============================================================================

  const indicators: GRIIndicator[] = [
    {
      code: 'GRI 305-1',
      category: 'environmental',
      name: 'Direct (Scope 1) GHG emissions',
      value: 1250.0,
      unit: 'tonnes CO2e',
      target: 1000,
      performance: 'at-risk',
      disclosure: 'full',
    },
    {
      code: 'GRI 305-2',
      category: 'environmental',
      name: 'Energy indirect (Scope 2) GHG emissions',
      value: 3200.5,
      unit: 'tonnes CO2e',
      target: 2500,
      performance: 'at-risk',
      disclosure: 'full',
    },
    {
      code: 'GRI 302-1',
      category: 'environmental',
      name: 'Energy consumption within the organization',
      value: 12500,
      unit: 'MWh',
      target: 12000,
      performance: 'at-risk',
      disclosure: 'full',
    },
    {
      code: 'GRI 303-5',
      category: 'environmental',
      name: 'Water consumption',
      value: 125000,
      unit: 'm³',
      target: 100000,
      performance: 'at-risk',
      disclosure: 'full',
    },
    {
      code: 'GRI 306-3',
      category: 'environmental',
      name: 'Waste generated',
      value: 450,
      unit: 'tonnes',
      performance: 'on-track',
      disclosure: 'full',
    },
    {
      code: 'GRI 401-1',
      category: 'social',
      name: 'New employee hires and employee turnover',
      value: 12,
      unit: '%',
      target: 15,
      performance: 'on-track',
      disclosure: 'full',
    },
    {
      code: 'GRI 404-1',
      category: 'social',
      name: 'Average hours of training per employee',
      value: 40,
      unit: 'hours',
      target: 40,
      performance: 'achieved',
      disclosure: 'full',
    },
    {
      code: 'GRI 405-1',
      category: 'social',
      name: 'Diversity of governance bodies and employees',
      value: 45,
      unit: '%',
      target: 50,
      performance: 'on-track',
      disclosure: 'full',
    },
    {
      code: 'GRI 205-2',
      category: 'governance',
      name: 'Communication and training about anti-corruption',
      value: 98,
      unit: '%',
      target: 100,
      performance: 'on-track',
      disclosure: 'full',
    },
    {
      code: 'GRI 307-1',
      category: 'governance',
      name: 'Non-compliance with environmental laws',
      value: 0,
      unit: 'incidents',
      performance: 'achieved',
      disclosure: 'full',
    },
  ];

  indicators.forEach((indicator) => reporter.addGRIIndicator(indicator));

  // ============================================================================
  // Add Sustainability Goals
  // ============================================================================

  const goals: SustainabilityGoal[] = [
    {
      id: 'goal_1',
      category: 'climate',
      goal: 'Achieve carbon neutrality',
      target: 0,
      current: 8450.5,
      unit: 'tonnes CO2e',
      deadline: new Date('2030-12-31'),
      status: 'on-track',
      initiatives: [
        'Transition to 100% renewable energy by 2027',
        'Electrify vehicle fleet',
        'Purchase carbon offsets for residual emissions',
      ],
    },
    {
      id: 'goal_2',
      category: 'climate',
      goal: 'Reduce Scope 1 & 2 emissions by 50%',
      target: 2225,
      current: 4450.5,
      unit: 'tonnes CO2e',
      deadline: new Date('2030-12-31'),
      status: 'on-track',
      initiatives: [
        'Energy efficiency upgrades',
        'On-site solar installation',
        'LED lighting conversion complete',
      ],
    },
    {
      id: 'goal_3',
      category: 'climate',
      goal: 'Use 100% renewable energy',
      target: 100,
      current: 35,
      unit: '%',
      deadline: new Date('2027-12-31'),
      status: 'on-track',
      initiatives: [
        'Power Purchase Agreement signed',
        'Rooftop solar installation in progress',
        'Exploring community solar options',
      ],
    },
    {
      id: 'goal_4',
      category: 'water',
      goal: 'Reduce water consumption by 30%',
      target: 87500,
      current: 125000,
      unit: 'm³',
      deadline: new Date('2028-12-31'),
      status: 'at-risk',
      initiatives: [
        'Low-flow fixtures installed',
        'Rainwater harvesting system planned',
        'Water efficiency training',
      ],
    },
    {
      id: 'goal_5',
      category: 'waste',
      goal: 'Achieve 90% waste diversion rate',
      target: 90,
      current: 71,
      unit: '%',
      deadline: new Date('2026-12-31'),
      status: 'on-track',
      initiatives: [
        'Expanded recycling program',
        'Composting program launched',
        'Zero-waste cafeteria initiative',
      ],
    },
    {
      id: 'goal_6',
      category: 'social',
      goal: 'Achieve 50% workforce diversity',
      target: 50,
      current: 45,
      unit: '%',
      deadline: new Date('2025-12-31'),
      status: 'on-track',
      initiatives: [
        'Diverse hiring panels',
        'Partnership with diversity organizations',
        'Inclusive job descriptions',
      ],
    },
  ];

  goals.forEach((goal) => reporter.addGoal(goal));

  // ============================================================================
  // Generate Comprehensive Report
  // ============================================================================

  reporter.generateComprehensiveReport();

  console.log('\n' + '*'.repeat(70));
  console.log('Example completed successfully!');
  console.log('Report exported to sustainability-report-2024.pdf (simulated)');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
