/**
 * Health Metrics Calculation Example
 *
 * Demonstrates comprehensive health metrics calculation with:
 * - Body composition metrics (BMI, BMR, body fat percentage)
 * - Cardiovascular metrics (heart rate zones, VO2 max)
 * - Metabolic metrics (glucose variability, insulin sensitivity)
 * - Sleep quality metrics
 * - Fitness performance metrics
 * - Population health benchmarks
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface PatientProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
}

interface BodyCompositionMetrics {
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese_class1' | 'obese_class2' | 'obese_class3';
  bmr: number; // Basal Metabolic Rate (calories/day)
  tdee: number; // Total Daily Energy Expenditure
  idealWeight: { min: number; max: number };
  bodyFatPercentage?: number;
  leanBodyMass?: number;
  fatMass?: number;
}

interface CardiovascularMetrics {
  restingHeartRate: number;
  maxHeartRate: number;
  heartRateReserve: number;
  heartRateZones: HeartRateZone[];
  vo2Max?: number; // ml/kg/min
  vo2MaxCategory?: 'poor' | 'fair' | 'good' | 'excellent' | 'superior';
  bloodPressureIndex: number;
  cardiovascularRisk: 'low' | 'moderate' | 'high' | 'very_high';
}

interface HeartRateZone {
  zone: number;
  name: string;
  minHR: number;
  maxHR: number;
  intensity: string;
  benefits: string;
}

interface MetabolicMetrics {
  averageGlucose: number;
  glucoseVariability: number;
  timeInRange: number; // percentage
  estimatedA1C: number;
  glycemicVariabilityIndex: number;
  insulinSensitivityIndex?: number;
  metabolicAge?: number;
}

interface SleepMetrics {
  averageSleepDuration: number; // hours
  sleepEfficiency: number; // percentage
  deepSleepPercentage: number;
  remSleepPercentage: number;
  lightSleepPercentage: number;
  awakeDuration: number; // minutes
  sleepScore: number; // 0-100
  sleepDebt: number; // hours
}

interface FitnessMetrics {
  weeklyActiveMinutes: number;
  averageDailySteps: number;
  caloriesBurned: number;
  activeCalories: number;
  distanceCovered: number; // km
  workoutsCompleted: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  recoveryScore?: number;
}

interface HealthScore {
  overall: number; // 0-100
  components: {
    cardiovascular: number;
    metabolic: number;
    body_composition: number;
    sleep: number;
    fitness: number;
  };
  percentile: number; // compared to population
  ageAdjusted: number;
  trends: {
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
  };
}

interface PopulationBenchmark {
  metric: string;
  value: number;
  percentile: number;
  ageGroup: string;
  gender: string;
  interpretation: string;
}

// ============================================================================
// Health Metrics Calculator
// ============================================================================

class HealthMetricsCalculator {
  /**
   * Calculate comprehensive body composition metrics
   */
  calculateBodyComposition(profile: PatientProfile, bodyFatPercentage?: number): BodyCompositionMetrics {
    // BMI Calculation
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);

    // BMI Category
    let bmiCategory: BodyCompositionMetrics['bmiCategory'];
    if (bmi < 18.5) bmiCategory = 'underweight';
    else if (bmi < 25) bmiCategory = 'normal';
    else if (bmi < 30) bmiCategory = 'overweight';
    else if (bmi < 35) bmiCategory = 'obese_class1';
    else if (bmi < 40) bmiCategory = 'obese_class2';
    else bmiCategory = 'obese_class3';

    // BMR Calculation (Mifflin-St Jeor Equation)
    let bmr: number;
    if (profile.gender === 'male') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // TDEE Calculation
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    const tdee = bmr * activityMultipliers[profile.activityLevel];

    // Ideal Weight Range (BMI 18.5-24.9)
    const idealWeight = {
      min: 18.5 * heightInMeters * heightInMeters,
      max: 24.9 * heightInMeters * heightInMeters,
    };

    // Body composition (if body fat % provided)
    let leanBodyMass: number | undefined;
    let fatMass: number | undefined;

    if (bodyFatPercentage !== undefined) {
      fatMass = profile.weight * (bodyFatPercentage / 100);
      leanBodyMass = profile.weight - fatMass;
    }

    return {
      bmi: Math.round(bmi * 10) / 10,
      bmiCategory,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      idealWeight: {
        min: Math.round(idealWeight.min * 10) / 10,
        max: Math.round(idealWeight.max * 10) / 10,
      },
      bodyFatPercentage,
      leanBodyMass: leanBodyMass ? Math.round(leanBodyMass * 10) / 10 : undefined,
      fatMass: fatMass ? Math.round(fatMass * 10) / 10 : undefined,
    };
  }

  /**
   * Calculate cardiovascular metrics
   */
  calculateCardiovascularMetrics(
    profile: PatientProfile,
    restingHR: number,
    systolicBP: number,
    diastolicBP: number,
    vo2Max?: number
  ): CardiovascularMetrics {
    // Maximum Heart Rate (220 - age)
    const maxHR = 220 - profile.age;

    // Heart Rate Reserve (Karvonen Method)
    const hrReserve = maxHR - restingHR;

    // Heart Rate Zones
    const zones: HeartRateZone[] = [
      {
        zone: 1,
        name: 'Recovery',
        minHR: Math.round(restingHR + hrReserve * 0.5),
        maxHR: Math.round(restingHR + hrReserve * 0.6),
        intensity: '50-60% of max HR',
        benefits: 'Recovery, warm-up, cool-down',
      },
      {
        zone: 2,
        name: 'Endurance',
        minHR: Math.round(restingHR + hrReserve * 0.6),
        maxHR: Math.round(restingHR + hrReserve * 0.7),
        intensity: '60-70% of max HR',
        benefits: 'Fat burning, aerobic endurance',
      },
      {
        zone: 3,
        name: 'Tempo',
        minHR: Math.round(restingHR + hrReserve * 0.7),
        maxHR: Math.round(restingHR + hrReserve * 0.8),
        intensity: '70-80% of max HR',
        benefits: 'Cardiovascular fitness, lactate threshold',
      },
      {
        zone: 4,
        name: 'Threshold',
        minHR: Math.round(restingHR + hrReserve * 0.8),
        maxHR: Math.round(restingHR + hrReserve * 0.9),
        intensity: '80-90% of max HR',
        benefits: 'Anaerobic capacity, speed',
      },
      {
        zone: 5,
        name: 'Maximum',
        minHR: Math.round(restingHR + hrReserve * 0.9),
        maxHR: maxHR,
        intensity: '90-100% of max HR',
        benefits: 'Peak performance, power',
      },
    ];

    // VO2 Max Category (if provided)
    let vo2MaxCategory: CardiovascularMetrics['vo2MaxCategory'];
    if (vo2Max) {
      const categories =
        profile.gender === 'male'
          ? { poor: 35, fair: 42, good: 51, excellent: 56 }
          : { poor: 27, fair: 33, good: 39, excellent: 44 };

      if (vo2Max < categories.poor) vo2MaxCategory = 'poor';
      else if (vo2Max < categories.fair) vo2MaxCategory = 'fair';
      else if (vo2Max < categories.good) vo2MaxCategory = 'good';
      else if (vo2Max < categories.excellent) vo2MaxCategory = 'excellent';
      else vo2MaxCategory = 'superior';
    }

    // Blood Pressure Index
    const bpIndex = (systolicBP + diastolicBP) / 2;

    // Cardiovascular Risk Assessment
    let cvRisk: CardiovascularMetrics['cardiovascularRisk'];
    if (systolicBP >= 180 || diastolicBP >= 120 || restingHR > 100) {
      cvRisk = 'very_high';
    } else if (systolicBP >= 140 || diastolicBP >= 90 || restingHR > 85) {
      cvRisk = 'high';
    } else if (systolicBP >= 130 || diastolicBP >= 85 || restingHR > 75) {
      cvRisk = 'moderate';
    } else {
      cvRisk = 'low';
    }

    return {
      restingHeartRate: restingHR,
      maxHeartRate: maxHR,
      heartRateReserve: hrReserve,
      heartRateZones: zones,
      vo2Max,
      vo2MaxCategory,
      bloodPressureIndex: Math.round(bpIndex),
      cardiovascularRisk: cvRisk,
    };
  }

  /**
   * Calculate metabolic metrics
   */
  calculateMetabolicMetrics(glucoseReadings: number[]): MetabolicMetrics {
    if (glucoseReadings.length === 0) {
      throw new Error('No glucose readings provided');
    }

    // Average glucose
    const avgGlucose = glucoseReadings.reduce((sum, g) => sum + g, 0) / glucoseReadings.length;

    // Standard deviation (glucose variability)
    const variance =
      glucoseReadings.reduce((sum, g) => sum + Math.pow(g - avgGlucose, 2), 0) /
      glucoseReadings.length;
    const stdDev = Math.sqrt(variance);

    // Time in range (70-180 mg/dL for non-diabetics, 70-130 for diabetics)
    const inRange = glucoseReadings.filter((g) => g >= 70 && g <= 180).length;
    const timeInRange = (inRange / glucoseReadings.length) * 100;

    // Estimated A1C (Nathan et al formula)
    const estimatedA1C = (avgGlucose + 46.7) / 28.7;

    // Glycemic Variability Index (coefficient of variation)
    const gvi = (stdDev / avgGlucose) * 100;

    // Estimated metabolic age (simplified)
    const metabolicAge = avgGlucose > 100 ? Math.round(avgGlucose / 2) : undefined;

    return {
      averageGlucose: Math.round(avgGlucose),
      glucoseVariability: Math.round(stdDev * 10) / 10,
      timeInRange: Math.round(timeInRange * 10) / 10,
      estimatedA1C: Math.round(estimatedA1C * 100) / 100,
      glycemicVariabilityIndex: Math.round(gvi * 10) / 10,
      metabolicAge,
    };
  }

  /**
   * Calculate sleep metrics
   */
  calculateSleepMetrics(
    totalSleepMinutes: number,
    deepSleepMinutes: number,
    remSleepMinutes: number,
    lightSleepMinutes: number,
    awakeMinutes: number,
    timeInBed: number
  ): SleepMetrics {
    const totalSleepHours = totalSleepMinutes / 60;

    // Sleep efficiency (time asleep / time in bed)
    const sleepEfficiency = (totalSleepMinutes / timeInBed) * 100;

    // Sleep stage percentages
    const deepSleepPct = (deepSleepMinutes / totalSleepMinutes) * 100;
    const remSleepPct = (remSleepMinutes / totalSleepMinutes) * 100;
    const lightSleepPct = (lightSleepMinutes / totalSleepMinutes) * 100;

    // Sleep score (0-100)
    let sleepScore = 0;
    sleepScore += Math.min((totalSleepHours / 8) * 40, 40); // Duration (40 points)
    sleepScore += Math.min((sleepEfficiency / 100) * 30, 30); // Efficiency (30 points)
    sleepScore += Math.min((deepSleepPct / 20) * 15, 15); // Deep sleep (15 points)
    sleepScore += Math.min((remSleepPct / 25) * 15, 15); // REM sleep (15 points)

    // Sleep debt (recommended 7-9 hours)
    const sleepDebt = Math.max(7 - totalSleepHours, 0);

    return {
      averageSleepDuration: Math.round(totalSleepHours * 10) / 10,
      sleepEfficiency: Math.round(sleepEfficiency * 10) / 10,
      deepSleepPercentage: Math.round(deepSleepPct * 10) / 10,
      remSleepPercentage: Math.round(remSleepPct * 10) / 10,
      lightSleepPercentage: Math.round(lightSleepPct * 10) / 10,
      awakeDuration: awakeMinutes,
      sleepScore: Math.round(sleepScore),
      sleepDebt: Math.round(sleepDebt * 10) / 10,
    };
  }

  /**
   * Calculate fitness metrics
   */
  calculateFitnessMetrics(
    weeklyActiveMinutes: number,
    dailySteps: number[],
    caloriesBurned: number,
    restingCalories: number,
    distanceKm: number,
    workouts: number,
    profile: PatientProfile
  ): FitnessMetrics {
    const avgDailySteps = dailySteps.reduce((sum, s) => sum + s, 0) / dailySteps.length;

    const activeCalories = caloriesBurned - restingCalories;

    // Fitness level based on weekly active minutes and daily steps
    let fitnessLevel: FitnessMetrics['fitnessLevel'];
    if (weeklyActiveMinutes >= 300 && avgDailySteps >= 12000) {
      fitnessLevel = 'elite';
    } else if (weeklyActiveMinutes >= 225 && avgDailySteps >= 10000) {
      fitnessLevel = 'advanced';
    } else if (weeklyActiveMinutes >= 150 && avgDailySteps >= 7500) {
      fitnessLevel = 'intermediate';
    } else {
      fitnessLevel = 'beginner';
    }

    // Recovery score (simplified)
    const recoveryScore = Math.min(100, Math.round((weeklyActiveMinutes / 300) * 100));

    return {
      weeklyActiveMinutes,
      averageDailySteps: Math.round(avgDailySteps),
      caloriesBurned: Math.round(caloriesBurned),
      activeCalories: Math.round(activeCalories),
      distanceCovered: Math.round(distanceKm * 10) / 10,
      workoutsCompleted: workouts,
      fitnessLevel,
      recoveryScore,
    };
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(
    bodyComp: BodyCompositionMetrics,
    cardio: CardiovascularMetrics,
    metabolic: MetabolicMetrics,
    sleep: SleepMetrics,
    fitness: FitnessMetrics,
    profile: PatientProfile
  ): HealthScore {
    // Body composition score
    const bodyCompScore = bodyComp.bmiCategory === 'normal' ? 100 : bodyComp.bmiCategory === 'overweight' ? 70 : 50;

    // Cardiovascular score
    const cardioScore =
      cardio.cardiovascularRisk === 'low'
        ? 100
        : cardio.cardiovascularRisk === 'moderate'
          ? 75
          : cardio.cardiovascularRisk === 'high'
            ? 50
            : 25;

    // Metabolic score
    const metabolicScore = metabolic.timeInRange >= 80 ? 100 : (metabolic.timeInRange / 80) * 100;

    // Sleep score (already calculated)
    const sleepScore = sleep.sleepScore;

    // Fitness score
    const fitnessScore =
      fitness.fitnessLevel === 'elite'
        ? 100
        : fitness.fitnessLevel === 'advanced'
          ? 85
          : fitness.fitnessLevel === 'intermediate'
            ? 70
            : 50;

    // Overall score (weighted average)
    const overall =
      (bodyCompScore * 0.2 +
        cardioScore * 0.25 +
        metabolicScore * 0.2 +
        sleepScore * 0.15 +
        fitnessScore * 0.2);

    // Calculate percentile (simulated - would use actual population data)
    const percentile = Math.min(99, Math.round((overall / 100) * 95));

    // Age-adjusted score
    const ageAdjustment = profile.age > 50 ? 5 : 0;
    const ageAdjusted = Math.min(100, overall + ageAdjustment);

    return {
      overall: Math.round(overall),
      components: {
        cardiovascular: Math.round(cardioScore),
        metabolic: Math.round(metabolicScore),
        body_composition: Math.round(bodyCompScore),
        sleep: sleepScore,
        fitness: Math.round(fitnessScore),
      },
      percentile,
      ageAdjusted: Math.round(ageAdjusted),
      trends: {
        oneWeek: 0, // Would be calculated from historical data
        oneMonth: 0,
        threeMonths: 0,
      },
    };
  }

  /**
   * Compare to population benchmarks
   */
  compareToPopulation(
    metric: string,
    value: number,
    profile: PatientProfile
  ): PopulationBenchmark {
    // Simulated population data (would come from actual health databases)
    const ageGroup = profile.age < 30 ? '18-29' : profile.age < 50 ? '30-49' : '50+';

    // Calculate percentile (simulated)
    const percentile = Math.min(99, Math.round(Math.random() * 100));

    let interpretation: string;
    if (percentile >= 90) {
      interpretation = 'Excellent - Top 10% of population';
    } else if (percentile >= 75) {
      interpretation = 'Above average - Top 25%';
    } else if (percentile >= 50) {
      interpretation = 'Average - Typical for age group';
    } else if (percentile >= 25) {
      interpretation = 'Below average - Bottom 50%';
    } else {
      interpretation = 'Needs improvement - Bottom 25%';
    }

    return {
      metric,
      value,
      percentile,
      ageGroup,
      gender: profile.gender,
      interpretation,
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Health Metrics Calculation - Comprehensive Example');
  console.log('='.repeat(70));

  const calculator = new HealthMetricsCalculator();

  const profile: PatientProfile = {
    age: 35,
    gender: 'male',
    height: 178, // cm
    weight: 80, // kg
    activityLevel: 'moderately_active',
  };

  console.log('\n👤 Patient Profile:');
  console.log(`   Age: ${profile.age}`);
  console.log(`   Gender: ${profile.gender}`);
  console.log(`   Height: ${profile.height} cm`);
  console.log(`   Weight: ${profile.weight} kg`);
  console.log(`   Activity Level: ${profile.activityLevel}`);

  // Example 1: Body Composition Metrics
  console.log('\n\n📊 Example 1: Body Composition Analysis');

  const bodyComp = calculator.calculateBodyComposition(profile, 18.5);

  console.log(`\n   BMI: ${bodyComp.bmi} (${bodyComp.bmiCategory})`);
  console.log(`   Basal Metabolic Rate: ${bodyComp.bmr} calories/day`);
  console.log(`   Total Daily Energy Expenditure: ${bodyComp.tdee} calories/day`);
  console.log(`   Ideal Weight Range: ${bodyComp.idealWeight.min} - ${bodyComp.idealWeight.max} kg`);
  console.log(`   Body Fat: ${bodyComp.bodyFatPercentage}%`);
  console.log(`   Lean Body Mass: ${bodyComp.leanBodyMass} kg`);
  console.log(`   Fat Mass: ${bodyComp.fatMass} kg`);

  // Example 2: Cardiovascular Metrics
  console.log('\n\n❤️  Example 2: Cardiovascular Analysis');

  const cardio = calculator.calculateCardiovascularMetrics(profile, 65, 120, 78, 48);

  console.log(`\n   Resting Heart Rate: ${cardio.restingHeartRate} bpm`);
  console.log(`   Maximum Heart Rate: ${cardio.maxHeartRate} bpm`);
  console.log(`   Heart Rate Reserve: ${cardio.heartRateReserve} bpm`);
  console.log(`   VO2 Max: ${cardio.vo2Max} ml/kg/min (${cardio.vo2MaxCategory})`);
  console.log(`   Cardiovascular Risk: ${cardio.cardiovascularRisk.toUpperCase()}`);

  console.log('\n   Heart Rate Training Zones:');
  cardio.heartRateZones.forEach((zone) => {
    console.log(`     Zone ${zone.zone} (${zone.name}): ${zone.minHR}-${zone.maxHR} bpm`);
    console.log(`       ${zone.benefits}`);
  });

  // Example 3: Metabolic Metrics
  console.log('\n\n🩸 Example 3: Metabolic Analysis');

  const glucoseReadings = [95, 102, 88, 115, 92, 98, 105, 90, 110, 94, 100, 97];
  const metabolic = calculator.calculateMetabolicMetrics(glucoseReadings);

  console.log(`\n   Average Glucose: ${metabolic.averageGlucose} mg/dL`);
  console.log(`   Glucose Variability: ${metabolic.glucoseVariability} mg/dL`);
  console.log(`   Time in Range: ${metabolic.timeInRange}%`);
  console.log(`   Estimated A1C: ${metabolic.estimatedA1C}%`);
  console.log(`   Glycemic Variability Index: ${metabolic.glycemicVariabilityIndex}%`);

  // Example 4: Sleep Metrics
  console.log('\n\n😴 Example 4: Sleep Analysis');

  const sleep = calculator.calculateSleepMetrics(
    420, // 7 hours total sleep
    90, // 1.5 hours deep sleep
    105, // 1.75 hours REM sleep
    225, // 3.75 hours light sleep
    30, // 30 min awake
    480 // 8 hours in bed
  );

  console.log(`\n   Sleep Duration: ${sleep.averageSleepDuration} hours`);
  console.log(`   Sleep Efficiency: ${sleep.sleepEfficiency}%`);
  console.log(`   Deep Sleep: ${sleep.deepSleepPercentage}%`);
  console.log(`   REM Sleep: ${sleep.remSleepPercentage}%`);
  console.log(`   Light Sleep: ${sleep.lightSleepPercentage}%`);
  console.log(`   Sleep Score: ${sleep.sleepScore}/100`);
  console.log(`   Sleep Debt: ${sleep.sleepDebt} hours`);

  // Example 5: Fitness Metrics
  console.log('\n\n🏃 Example 5: Fitness Analysis');

  const dailySteps = [9500, 10200, 8800, 11500, 9900, 10800, 9300];
  const fitness = calculator.calculateFitnessMetrics(
    180, // 3 hours active per week
    dailySteps,
    2400, // total calories
    1800, // resting calories
    42.5, // 42.5 km per week
    4, // 4 workouts
    profile
  );

  console.log(`\n   Weekly Active Minutes: ${fitness.weeklyActiveMinutes}`);
  console.log(`   Average Daily Steps: ${fitness.averageDailySteps}`);
  console.log(`   Total Calories Burned: ${fitness.caloriesBurned}`);
  console.log(`   Active Calories: ${fitness.activeCalories}`);
  console.log(`   Distance Covered: ${fitness.distanceCovered} km`);
  console.log(`   Workouts Completed: ${fitness.workoutsCompleted}`);
  console.log(`   Fitness Level: ${fitness.fitnessLevel.toUpperCase()}`);
  console.log(`   Recovery Score: ${fitness.recoveryScore}/100`);

  // Example 6: Overall Health Score
  console.log('\n\n⭐ Example 6: Overall Health Score');

  const healthScore = calculator.calculateHealthScore(
    bodyComp,
    cardio,
    metabolic,
    sleep,
    fitness,
    profile
  );

  console.log(`\n   Overall Health Score: ${healthScore.overall}/100`);
  console.log(`   Population Percentile: ${healthScore.percentile}th`);
  console.log(`   Age-Adjusted Score: ${healthScore.ageAdjusted}/100`);

  console.log('\n   Component Scores:');
  console.log(`     Cardiovascular: ${healthScore.components.cardiovascular}/100`);
  console.log(`     Metabolic: ${healthScore.components.metabolic}/100`);
  console.log(`     Body Composition: ${healthScore.components.body_composition}/100`);
  console.log(`     Sleep: ${healthScore.components.sleep}/100`);
  console.log(`     Fitness: ${healthScore.components.fitness}/100`);

  // Example 7: Population Benchmarks
  console.log('\n\n📈 Example 7: Population Benchmarks');

  const bmiComparison = calculator.compareToPopulation('BMI', bodyComp.bmi, profile);
  console.log(`\n   BMI: ${bmiComparison.value}`);
  console.log(`   Age Group: ${bmiComparison.ageGroup}`);
  console.log(`   Percentile: ${bmiComparison.percentile}th`);
  console.log(`   ${bmiComparison.interpretation}`);

  const vo2Comparison = calculator.compareToPopulation('VO2 Max', cardio.vo2Max!, profile);
  console.log(`\n   VO2 Max: ${vo2Comparison.value} ml/kg/min`);
  console.log(`   Age Group: ${vo2Comparison.ageGroup}`);
  console.log(`   Percentile: ${vo2Comparison.percentile}th`);
  console.log(`   ${vo2Comparison.interpretation}`);

  console.log('\n' + '='.repeat(70));
  console.log('Health metrics calculation examples completed!');
  console.log('Evidence-based formulas and clinical standards applied');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
