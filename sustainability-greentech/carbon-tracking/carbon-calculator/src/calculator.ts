/**
 * Carbon Footprint Calculator
 *
 * Calculate and track carbon emissions from various activities
 */

import type {
  ActivityCategory,
  CarbonActivity,
  CarbonResult,
  CarbonSummary,
  CarbonProfile,
  ReductionGoal,
  ReductionTip,
  EmissionFactor,
} from './types.js';

import {
  TRANSPORTATION_FACTORS,
  ENERGY_FACTORS,
  FOOD_FACTORS,
  SHOPPING_FACTORS,
  WASTE_FACTORS,
  WATER_FACTORS,
  COUNTRY_AVERAGES,
  getFactorsForCategory,
} from './factors.js';

export class CarbonCalculator {
  private profile: CarbonProfile | null = null;
  private activities: CarbonActivity[] = [];
  private activityIdCounter = 0;
  private goals: ReductionGoal[] = [];

  constructor(profile?: CarbonProfile) {
    if (profile) {
      this.setProfile(profile);
    }
  }

  /**
   * Set user profile
   */
  setProfile(profile: CarbonProfile): void {
    this.profile = profile;
    if (profile.goals) {
      this.goals = profile.goals;
    }
  }

  /**
   * Get emission factor for an activity type
   */
  getEmissionFactor(category: ActivityCategory, type: string): EmissionFactor | null {
    const factors = getFactorsForCategory(category);
    return factors[type] || null;
  }

  /**
   * Calculate emissions for an activity
   */
  calculateEmissions(activity: CarbonActivity): CarbonResult {
    const factor = this.getEmissionFactor(activity.category, activity.type);

    if (!factor) {
      throw new Error(`Unknown activity type: ${activity.category}/${activity.type}`);
    }

    let emissions = activity.quantity * factor.factor;

    // Apply modifiers based on activity category
    emissions = this.applyModifiers(activity, emissions);

    return {
      activity,
      emissions,
      factor,
    };
  }

  /**
   * Apply modifiers to emissions calculation
   */
  private applyModifiers(activity: CarbonActivity, baseEmissions: number): number {
    let emissions = baseEmissions;

    // Transportation: adjust for passengers
    if (activity.category === 'transportation') {
      const transportActivity = activity as CarbonActivity & { passengers?: number };
      if (transportActivity.passengers && transportActivity.passengers > 1) {
        // Reduce per-person emissions when carpooling
        emissions = emissions / transportActivity.passengers;
      }
    }

    // Food: adjust for organic/local
    if (activity.category === 'food') {
      const foodActivity = activity as CarbonActivity & {
        organic?: boolean;
        local?: boolean;
      };
      if (foodActivity.organic) {
        emissions *= 0.9; // 10% reduction for organic
      }
      if (foodActivity.local) {
        emissions *= 0.85; // 15% reduction for local
      }
    }

    // Energy: adjust for renewable
    if (activity.category === 'energy') {
      const energyActivity = activity as CarbonActivity & { renewable?: boolean };
      if (energyActivity.renewable) {
        emissions *= 0.1; // 90% reduction for renewable
      }
    }

    return emissions;
  }

  /**
   * Add an activity and calculate its emissions
   */
  addActivity(
    activity: Omit<CarbonActivity, 'id'>
  ): CarbonResult {
    const fullActivity: CarbonActivity = {
      ...activity,
      id: `activity_${++this.activityIdCounter}`,
    };

    this.activities.push(fullActivity);
    return this.calculateEmissions(fullActivity);
  }

  /**
   * Get all activities
   */
  getActivities(): CarbonActivity[] {
    return [...this.activities];
  }

  /**
   * Get activities by category
   */
  getActivitiesByCategory(category: ActivityCategory): CarbonActivity[] {
    return this.activities.filter((a) => a.category === category);
  }

  /**
   * Get activities in date range
   */
  getActivitiesInRange(start: Date, end: Date): CarbonActivity[] {
    return this.activities.filter(
      (a) => a.timestamp >= start && a.timestamp <= end
    );
  }

  /**
   * Get carbon summary for a period
   */
  getSummary(start?: Date, end?: Date): CarbonSummary {
    const now = new Date();
    const periodStart = start || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = end || now;

    const activities = this.getActivitiesInRange(periodStart, periodEnd);

    // Calculate totals by category and type
    const byCategory: Record<ActivityCategory, number> = {
      transportation: 0,
      energy: 0,
      food: 0,
      shopping: 0,
      waste: 0,
      water: 0,
    };

    const byType: Record<string, number> = {};
    let totalEmissions = 0;

    for (const activity of activities) {
      const result = this.calculateEmissions(activity);
      totalEmissions += result.emissions;
      byCategory[activity.category] += result.emissions;
      byType[activity.type] = (byType[activity.type] || 0) + result.emissions;
    }

    // Calculate daily average
    const days = Math.max(
      1,
      Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const averageDaily = totalEmissions / days;

    // Calculate comparison with averages
    const comparison = this.calculateComparison(totalEmissions, days);

    return {
      totalEmissions,
      byCategory,
      byType,
      period: { start: periodStart, end: periodEnd },
      activityCount: activities.length,
      averageDaily,
      comparison,
    };
  }

  /**
   * Calculate comparison with national/global averages
   */
  private calculateComparison(
    emissions: number,
    days: number
  ): CarbonSummary['comparison'] {
    const yearlyEquivalent = (emissions / days) * 365;
    const yearlyTonnes = yearlyEquivalent / 1000;

    const country = this.profile?.country || 'US';
    const nationalAverage = COUNTRY_AVERAGES[country] || COUNTRY_AVERAGES['US'];
    const globalAverage = COUNTRY_AVERAGES['global'];

    // Simple percentile calculation
    const percentile = Math.min(
      100,
      Math.max(0, 100 - (yearlyTonnes / nationalAverage) * 50)
    );

    return {
      nationalAverage,
      globalAverage,
      percentile,
    };
  }

  /**
   * Add a reduction goal
   */
  addGoal(goal: Omit<ReductionGoal, 'id' | 'currentEmissions'>): ReductionGoal {
    const fullGoal: ReductionGoal = {
      ...goal,
      id: `goal_${this.goals.length + 1}`,
      currentEmissions: goal.baselineEmissions,
    };
    this.goals.push(fullGoal);
    return fullGoal;
  }

  /**
   * Get goal progress
   */
  getGoalProgress(goalId: string): {
    goal: ReductionGoal;
    progress: number;
    onTrack: boolean;
    projectedAchievement: Date | null;
  } | null {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return null;

    // Calculate current emissions for goal period/category
    const activities = goal.category
      ? this.getActivitiesByCategory(goal.category)
      : this.activities;

    const relevantActivities = activities.filter(
      (a) => a.timestamp >= goal.startDate && a.timestamp <= goal.endDate
    );

    let currentEmissions = 0;
    for (const activity of relevantActivities) {
      const result = this.calculateEmissions(activity);
      currentEmissions += result.emissions;
    }

    // Update goal's current emissions
    goal.currentEmissions = currentEmissions;

    // Calculate progress
    const targetEmissions =
      goal.baselineEmissions * (1 - goal.targetReduction / 100);
    const reductionNeeded = goal.baselineEmissions - targetEmissions;
    const reductionAchieved = goal.baselineEmissions - currentEmissions;
    const progress = Math.max(0, (reductionAchieved / reductionNeeded) * 100);

    // Check if on track
    const totalDays =
      (goal.endDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed =
      (Date.now() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const expectedProgress = (daysElapsed / totalDays) * 100;
    const onTrack = progress >= expectedProgress;

    // Project achievement date
    let projectedAchievement: Date | null = null;
    if (reductionAchieved > 0) {
      const dailyReduction = reductionAchieved / daysElapsed;
      const daysToComplete = reductionNeeded / dailyReduction;
      projectedAchievement = new Date(
        goal.startDate.getTime() + daysToComplete * 24 * 60 * 60 * 1000
      );
    }

    return { goal, progress, onTrack, projectedAchievement };
  }

  /**
   * Get reduction tips based on user's activities
   */
  getReductionTips(): ReductionTip[] {
    const summary = this.getSummary();
    const tips: ReductionTip[] = [];

    // Transportation tips
    if (summary.byCategory.transportation > 0) {
      const hasCarTravel = this.activities.some(
        (a) => a.type.startsWith('car_') && a.category === 'transportation'
      );
      if (hasCarTravel) {
        tips.push({
          id: 'tip_1',
          category: 'transportation',
          title: 'Switch to public transit',
          description:
            'Taking the bus or train instead of driving can reduce emissions by up to 75%',
          potentialSavings: 2000,
          difficulty: 'medium',
          cost: 'low',
        });
        tips.push({
          id: 'tip_2',
          category: 'transportation',
          title: 'Carpool when possible',
          description:
            'Sharing rides with others cuts per-person emissions significantly',
          potentialSavings: 1000,
          difficulty: 'easy',
          cost: 'free',
        });
      }

      const hasAirTravel = this.activities.some(
        (a) => a.type.startsWith('airplane') && a.category === 'transportation'
      );
      if (hasAirTravel) {
        tips.push({
          id: 'tip_3',
          category: 'transportation',
          title: 'Consider video calls instead of travel',
          description: 'One long-haul flight can equal a year of car driving emissions',
          potentialSavings: 3000,
          difficulty: 'easy',
          cost: 'free',
        });
      }
    }

    // Energy tips
    if (summary.byCategory.energy > 0) {
      tips.push({
        id: 'tip_4',
        category: 'energy',
        title: 'Switch to LED lighting',
        description: 'LEDs use 75% less energy than incandescent bulbs',
        potentialSavings: 100,
        difficulty: 'easy',
        cost: 'low',
      });
      tips.push({
        id: 'tip_5',
        category: 'energy',
        title: 'Improve home insulation',
        description: 'Better insulation can reduce heating/cooling energy by 30%',
        potentialSavings: 500,
        difficulty: 'hard',
        cost: 'high',
      });
    }

    // Food tips
    if (summary.byType['beef'] > 0) {
      tips.push({
        id: 'tip_6',
        category: 'food',
        title: 'Reduce beef consumption',
        description: 'Beef has 20x higher emissions than plant proteins',
        potentialSavings: 1500,
        difficulty: 'medium',
        cost: 'free',
      });
    }

    tips.push({
      id: 'tip_7',
      category: 'food',
      title: 'Buy local and seasonal',
      description: 'Reduces transportation emissions and supports local farmers',
      potentialSavings: 200,
      difficulty: 'easy',
      cost: 'low',
    });

    // Waste tips
    tips.push({
      id: 'tip_8',
      category: 'waste',
      title: 'Compost food scraps',
      description: 'Composting prevents methane emissions from landfills',
      potentialSavings: 150,
      difficulty: 'easy',
      cost: 'low',
    });

    return tips;
  }

  /**
   * Estimate annual footprint based on profile
   */
  estimateAnnualFootprint(): {
    estimated: number;
    breakdown: Record<string, number>;
    methodology: string;
  } {
    if (!this.profile) {
      throw new Error('Profile required for estimation');
    }

    const breakdown: Record<string, number> = {};

    // Transportation estimate
    let transportEmissions = 0;
    if (this.profile.vehicles > 0) {
      // Average 15,000 km per year per vehicle
      transportEmissions = 15000 * 0.21 * this.profile.vehicles;
    }
    // Add public transit base
    transportEmissions += 500;
    breakdown['transportation'] = transportEmissions;

    // Home energy estimate
    const homeSizeFactor = this.profile.homeSize / 100;
    const homeTypeFactor = this.profile.homeType === 'house' ? 1.5 : 1;
    const energyEmissions = 2000 * homeSizeFactor * homeTypeFactor;
    breakdown['energy'] = energyEmissions;

    // Food estimate based on diet
    const dietFactors: Record<string, number> = {
      vegan: 1000,
      vegetarian: 1500,
      pescatarian: 1800,
      omnivore: 2500,
    };
    const foodEmissions =
      (dietFactors[this.profile.dietType] || 2500) * this.profile.householdSize;
    breakdown['food'] = foodEmissions;

    // Shopping estimate based on lifestyle
    const lifestyleFactors: Record<string, number> = {
      minimal: 500,
      average: 1500,
      high_consumption: 4000,
    };
    const shoppingEmissions =
      (lifestyleFactors[this.profile.lifestyle] || 1500) * this.profile.householdSize;
    breakdown['shopping'] = shoppingEmissions;

    // Waste estimate
    const wasteEmissions = 200 * this.profile.householdSize;
    breakdown['waste'] = wasteEmissions;

    const estimated = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
      estimated,
      breakdown,
      methodology: 'Based on profile characteristics and regional averages',
    };
  }

  /**
   * Calculate offset needed
   */
  calculateOffsetNeeded(): {
    totalEmissions: number;
    offsetNeeded: number;
    estimatedCost: { min: number; max: number };
    recommendations: string[];
  } {
    const summary = this.getSummary();
    const annualizedEmissions =
      (summary.totalEmissions / summary.activityCount) * 365 || 0;

    // Typical offset costs: $10-50 per tonne CO2
    const tonnesNeeded = annualizedEmissions / 1000;
    const estimatedCost = {
      min: Math.round(tonnesNeeded * 10),
      max: Math.round(tonnesNeeded * 50),
    };

    const recommendations: string[] = [];
    if (tonnesNeeded > 10) {
      recommendations.push(
        'Consider reducing emissions before offsetting - offsets should be a last resort'
      );
    }
    recommendations.push('Look for verified carbon offset projects');
    recommendations.push(
      'Consider local reforestation or renewable energy projects'
    );

    return {
      totalEmissions: annualizedEmissions,
      offsetNeeded: tonnesNeeded,
      estimatedCost,
      recommendations,
    };
  }

  /**
   * Clear all activities
   */
  clearActivities(): void {
    this.activities = [];
  }

  /**
   * Export data as JSON
   */
  exportData(): string {
    return JSON.stringify(
      {
        profile: this.profile,
        activities: this.activities,
        goals: this.goals,
        exportDate: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Import data from JSON
   */
  importData(json: string): void {
    const data = JSON.parse(json);
    if (data.profile) {
      this.profile = data.profile;
    }
    if (data.activities) {
      this.activities = data.activities.map((a: CarbonActivity) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    }
    if (data.goals) {
      this.goals = data.goals.map((g: ReductionGoal) => ({
        ...g,
        startDate: new Date(g.startDate),
        endDate: new Date(g.endDate),
      }));
    }
  }
}
