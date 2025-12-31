/**
 * Health Risk Assessment Example
 *
 * Demonstrates comprehensive health risk evaluation with:
 * - Cardiovascular disease risk (Framingham, ASCVD scores)
 * - Diabetes risk assessment (ADA guidelines)
 * - Cancer risk screening
 * - Fall risk for elderly patients
 * - Medication adherence risk
 * - Hospitalization risk prediction
 * - Personalized prevention recommendations
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface PatientRiskProfile {
  demographics: {
    age: number;
    gender: 'male' | 'female';
    race?: string;
    ethnicity?: string;
  };
  vitals: {
    systolicBP: number;
    diastolicBP: number;
    totalCholesterol: number;
    hdlCholesterol: number;
    ldlCholesterol?: number;
    weight: number;
    height: number;
  };
  labResults?: {
    fastingGlucose?: number;
    a1c?: number;
    triglycerides?: number;
    creatinine?: number;
  };
  lifestyle: {
    smoker: boolean;
    physicalActivity: 'sedentary' | 'light' | 'moderate' | 'active';
    alcoholUse: 'none' | 'moderate' | 'heavy';
    diet: 'poor' | 'fair' | 'good' | 'excellent';
  };
  medicalHistory: {
    diabetes: boolean;
    hypertension: boolean;
    heartDisease: boolean;
    stroke: boolean;
    kidneyDisease: boolean;
    familyHistory: {
      heartDisease: boolean;
      diabetes: boolean;
      cancer: boolean;
    };
  };
  medications: string[];
}

interface RiskAssessment {
  assessmentType: string;
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  percentile?: number;
  absoluteRisk?: number; // e.g., 10-year risk %
  interpretation: string;
  factors: RiskFactor[];
  recommendations: Recommendation[];
  targetMetrics?: TargetMetric[];
}

interface RiskFactor {
  factor: string;
  value: string | number;
  impact: 'protective' | 'neutral' | 'risk_increasing';
  points?: number;
  modifiable: boolean;
}

interface Recommendation {
  priority: 'critical' | 'high' | 'moderate' | 'low';
  category: 'lifestyle' | 'medication' | 'screening' | 'monitoring';
  action: string;
  rationale: string;
  timeline?: string;
}

interface TargetMetric {
  metric: string;
  current: number;
  target: number;
  unit: string;
  importance: 'critical' | 'important' | 'beneficial';
}

interface CardiovascularRisk {
  framinghamScore: number;
  ascvdScore: number;
  tenYearRisk: number;
  heartAge: number;
  riskLevel: 'low' | 'borderline' | 'intermediate' | 'high';
  statin_recommended: boolean;
}

interface DiabetesRisk {
  riskScore: number;
  category: 'low' | 'moderate' | 'high' | 'very_high' | 'prediabetic' | 'diabetic';
  tenYearRisk?: number;
  prediabetesIndicators: string[];
  screening_recommended: boolean;
}

interface FallRisk {
  score: number;
  category: 'low' | 'moderate' | 'high';
  factors: string[];
  interventions: string[];
}

interface HospitalizationRisk {
  score: number;
  thirtyDayRisk: number;
  ninetyDayRisk: number;
  drivers: string[];
  preventiveActions: string[];
}

// ============================================================================
// Health Risk Assessor
// ============================================================================

class HealthRiskAssessor {
  /**
   * Calculate cardiovascular disease risk (ASCVD)
   */
  assessCardiovascularRisk(profile: PatientRiskProfile): CardiovascularRisk {
    const age = profile.demographics.age;
    const isMale = profile.demographics.gender === 'male';
    const systolic = profile.vitals.systolicBP;
    const totalChol = profile.vitals.totalCholesterol;
    const hdl = profile.vitals.hdlCholesterol;
    const smoker = profile.lifestyle.smoker;
    const diabetic = profile.medicalHistory.diabetes;
    const treated = profile.medications.some((m) =>
      m.toLowerCase().includes('blood pressure')
    );

    // Simplified ASCVD calculation (actual formula is more complex)
    let score = 0;

    // Age points
    if (isMale) {
      score += age >= 40 ? (age - 40) * 2 : 0;
    } else {
      score += age >= 40 ? (age - 40) * 1.5 : 0;
    }

    // Cholesterol points
    score += (totalChol - 170) / 10;
    score -= (hdl - 50) / 5;

    // Blood pressure points
    if (systolic >= 160) score += 8;
    else if (systolic >= 140) score += 5;
    else if (systolic >= 130) score += 3;
    else if (systolic >= 120) score += 1;

    // Smoking
    if (smoker) score += isMale ? 8 : 9;

    // Diabetes
    if (diabetic) score += isMale ? 4 : 5;

    // Treatment
    if (treated && systolic >= 140) score += 2;

    // Calculate 10-year risk percentage (simplified)
    const tenYearRisk = Math.min(100, (score / 100) * 30);

    // Risk level
    let riskLevel: CardiovascularRisk['riskLevel'];
    if (tenYearRisk < 5) riskLevel = 'low';
    else if (tenYearRisk < 7.5) riskLevel = 'borderline';
    else if (tenYearRisk < 20) riskLevel = 'intermediate';
    else riskLevel = 'high';

    // Heart age estimation
    const heartAge = age + (tenYearRisk > 10 ? Math.round(tenYearRisk / 2) : 0);

    // Statin recommendation
    const statin_recommended = tenYearRisk >= 7.5 || diabetic;

    return {
      framinghamScore: Math.round(score),
      ascvdScore: Math.round(score * 1.2), // Adjusted
      tenYearRisk: Math.round(tenYearRisk * 10) / 10,
      heartAge,
      riskLevel,
      statin_recommended,
    };
  }

  /**
   * Assess diabetes risk
   */
  assessDiabetesRisk(profile: PatientRiskProfile): DiabetesRisk {
    const indicators: string[] = [];
    let score = 0;

    // Age
    if (profile.demographics.age >= 45) {
      score += 5;
      indicators.push('Age ≥45 years');
    } else if (profile.demographics.age >= 40) {
      score += 3;
    }

    // BMI calculation
    const heightM = profile.vitals.height / 100;
    const bmi = profile.vitals.weight / (heightM * heightM);

    if (bmi >= 30) {
      score += 5;
      indicators.push('BMI ≥30 (Obesity)');
    } else if (bmi >= 25) {
      score += 3;
      indicators.push('BMI ≥25 (Overweight)');
    }

    // Physical activity
    if (profile.lifestyle.physicalActivity === 'sedentary') {
      score += 3;
      indicators.push('Sedentary lifestyle');
    }

    // Family history
    if (profile.medicalHistory.familyHistory.diabetes) {
      score += 5;
      indicators.push('Family history of diabetes');
    }

    // Hypertension
    if (
      profile.medicalHistory.hypertension ||
      profile.vitals.systolicBP >= 140 ||
      profile.vitals.diastolicBP >= 90
    ) {
      score += 3;
      indicators.push('Hypertension');
    }

    // Lab results
    if (profile.labResults?.fastingGlucose) {
      const glucose = profile.labResults.fastingGlucose;
      if (glucose >= 126) {
        indicators.push('Diabetic fasting glucose (≥126 mg/dL)');
      } else if (glucose >= 100) {
        score += 5;
        indicators.push('Prediabetic fasting glucose (100-125 mg/dL)');
      }
    }

    if (profile.labResults?.a1c) {
      const a1c = profile.labResults.a1c;
      if (a1c >= 6.5) {
        indicators.push('Diabetic A1C (≥6.5%)');
      } else if (a1c >= 5.7) {
        score += 5;
        indicators.push('Prediabetic A1C (5.7-6.4%)');
      }
    }

    // Determine category
    let category: DiabetesRisk['category'];
    if (profile.medicalHistory.diabetes || profile.labResults?.a1c && profile.labResults.a1c >= 6.5) {
      category = 'diabetic';
    } else if (
      (profile.labResults?.a1c && profile.labResults.a1c >= 5.7) ||
      (profile.labResults?.fastingGlucose && profile.labResults.fastingGlucose >= 100)
    ) {
      category = 'prediabetic';
    } else if (score >= 10) {
      category = 'very_high';
    } else if (score >= 7) {
      category = 'high';
    } else if (score >= 4) {
      category = 'moderate';
    } else {
      category = 'low';
    }

    // 10-year risk (simplified)
    const tenYearRisk = Math.min(100, score * 5);

    return {
      riskScore: score,
      category,
      tenYearRisk,
      prediabetesIndicators: indicators,
      screening_recommended: score >= 4 || profile.demographics.age >= 45,
    };
  }

  /**
   * Assess fall risk (for elderly patients)
   */
  assessFallRisk(
    age: number,
    previousFalls: number,
    mobilityIssues: boolean,
    medications: number,
    visionProblems: boolean,
    cognitiveImpairment: boolean
  ): FallRisk {
    let score = 0;
    const factors: string[] = [];

    // Age
    if (age >= 75) {
      score += 2;
      factors.push('Age ≥75 years');
    } else if (age >= 65) {
      score += 1;
      factors.push('Age 65-74 years');
    }

    // Previous falls
    if (previousFalls >= 2) {
      score += 3;
      factors.push(`${previousFalls} falls in past year`);
    } else if (previousFalls === 1) {
      score += 2;
      factors.push('1 fall in past year');
    }

    // Mobility issues
    if (mobilityIssues) {
      score += 2;
      factors.push('Mobility impairment');
    }

    // Polypharmacy (multiple medications)
    if (medications >= 5) {
      score += 2;
      factors.push(`Taking ${medications} medications`);
    } else if (medications >= 3) {
      score += 1;
    }

    // Vision problems
    if (visionProblems) {
      score += 1;
      factors.push('Vision impairment');
    }

    // Cognitive impairment
    if (cognitiveImpairment) {
      score += 2;
      factors.push('Cognitive impairment');
    }

    // Category
    let category: FallRisk['category'];
    if (score >= 6) category = 'high';
    else if (score >= 3) category = 'moderate';
    else category = 'low';

    // Interventions
    const interventions: string[] = [];
    if (score >= 3) {
      interventions.push('Home safety assessment');
      interventions.push('Physical therapy evaluation');
    }
    if (medications >= 5) {
      interventions.push('Medication review and deprescribing');
    }
    if (mobilityIssues) {
      interventions.push('Assistive device evaluation');
      interventions.push('Balance and strength training');
    }
    if (visionProblems) {
      interventions.push('Ophthalmology referral');
    }

    return {
      score,
      category,
      factors,
      interventions,
    };
  }

  /**
   * Predict hospitalization risk
   */
  assessHospitalizationRisk(profile: PatientRiskProfile): HospitalizationRisk {
    let score = 0;
    const drivers: string[] = [];

    // Age
    if (profile.demographics.age >= 75) {
      score += 3;
      drivers.push('Advanced age (≥75)');
    } else if (profile.demographics.age >= 65) {
      score += 2;
    }

    // Chronic conditions count
    const conditions = [
      profile.medicalHistory.diabetes,
      profile.medicalHistory.hypertension,
      profile.medicalHistory.heartDisease,
      profile.medicalHistory.stroke,
      profile.medicalHistory.kidneyDisease,
    ].filter(Boolean).length;

    if (conditions >= 3) {
      score += 4;
      drivers.push(`${conditions} chronic conditions`);
    } else if (conditions >= 2) {
      score += 2;
    }

    // Polypharmacy
    if (profile.medications.length >= 10) {
      score += 3;
      drivers.push(`High medication count (${profile.medications.length})`);
    } else if (profile.medications.length >= 5) {
      score += 1;
    }

    // Specific high-risk conditions
    if (profile.medicalHistory.heartDisease) {
      score += 2;
      drivers.push('History of heart disease');
    }

    if (profile.medicalHistory.kidneyDisease) {
      score += 2;
      drivers.push('Chronic kidney disease');
    }

    // Poor self-care indicators
    if (profile.lifestyle.physicalActivity === 'sedentary') {
      score += 1;
      drivers.push('Sedentary lifestyle');
    }

    if (profile.lifestyle.smoker) {
      score += 1;
      drivers.push('Current smoker');
    }

    // Calculate risk percentages
    const thirtyDayRisk = Math.min(100, score * 3);
    const ninetyDayRisk = Math.min(100, score * 5);

    // Preventive actions
    const preventiveActions: string[] = [];
    if (score >= 5) {
      preventiveActions.push('Schedule care management consultation');
      preventiveActions.push('Medication reconciliation');
      preventiveActions.push('Care transition planning');
    }
    if (conditions >= 2) {
      preventiveActions.push('Chronic disease management enrollment');
    }
    if (profile.lifestyle.physicalActivity === 'sedentary') {
      preventiveActions.push('Physical activity program');
    }

    return {
      score,
      thirtyDayRisk: Math.round(thirtyDayRisk * 10) / 10,
      ninetyDayRisk: Math.round(ninetyDayRisk * 10) / 10,
      drivers,
      preventiveActions,
    };
  }

  /**
   * Generate comprehensive risk assessment with recommendations
   */
  generateComprehensiveAssessment(profile: PatientRiskProfile): RiskAssessment[] {
    const assessments: RiskAssessment[] = [];

    // 1. Cardiovascular Risk
    const cvRisk = this.assessCardiovascularRisk(profile);
    const cvFactors: RiskFactor[] = [
      {
        factor: 'Age',
        value: profile.demographics.age,
        impact: profile.demographics.age >= 45 ? 'risk_increasing' : 'neutral',
        modifiable: false,
      },
      {
        factor: 'Blood Pressure',
        value: `${profile.vitals.systolicBP}/${profile.vitals.diastolicBP}`,
        impact: profile.vitals.systolicBP >= 130 ? 'risk_increasing' : 'neutral',
        modifiable: true,
      },
      {
        factor: 'Cholesterol',
        value: profile.vitals.totalCholesterol,
        impact: profile.vitals.totalCholesterol >= 200 ? 'risk_increasing' : 'neutral',
        modifiable: true,
      },
      {
        factor: 'HDL Cholesterol',
        value: profile.vitals.hdlCholesterol,
        impact: profile.vitals.hdlCholesterol >= 60 ? 'protective' : 'neutral',
        modifiable: true,
      },
      {
        factor: 'Smoking',
        value: profile.lifestyle.smoker ? 'Yes' : 'No',
        impact: profile.lifestyle.smoker ? 'risk_increasing' : 'protective',
        modifiable: true,
      },
    ];

    const cvRecommendations: Recommendation[] = [];
    if (cvRisk.statin_recommended) {
      cvRecommendations.push({
        priority: 'high',
        category: 'medication',
        action: 'Consider statin therapy',
        rationale: '10-year ASCVD risk ≥7.5%',
        timeline: 'Discuss with provider at next visit',
      });
    }

    if (profile.vitals.systolicBP >= 130) {
      cvRecommendations.push({
        priority: 'high',
        category: 'lifestyle',
        action: 'Reduce blood pressure through diet and exercise',
        rationale: 'Current BP above recommended target',
        timeline: 'Begin immediately',
      });
    }

    if (profile.lifestyle.smoker) {
      cvRecommendations.push({
        priority: 'critical',
        category: 'lifestyle',
        action: 'Smoking cessation program',
        rationale: 'Smoking is a major cardiovascular risk factor',
        timeline: 'Begin immediately',
      });
    }

    assessments.push({
      assessmentType: 'Cardiovascular Disease Risk (ASCVD)',
      riskScore: cvRisk.ascvdScore,
      riskLevel: cvRisk.riskLevel === 'low' || cvRisk.riskLevel === 'borderline' ? 'low' : cvRisk.riskLevel === 'intermediate' ? 'moderate' : 'high',
      absoluteRisk: cvRisk.tenYearRisk,
      interpretation: `${cvRisk.tenYearRisk}% 10-year risk of cardiovascular event. Heart age: ${cvRisk.heartAge} years.`,
      factors: cvFactors,
      recommendations: cvRecommendations,
      targetMetrics: [
        {
          metric: 'Blood Pressure',
          current: profile.vitals.systolicBP,
          target: 120,
          unit: 'mmHg',
          importance: 'critical',
        },
        {
          metric: 'LDL Cholesterol',
          current: profile.vitals.ldlCholesterol || 0,
          target: 100,
          unit: 'mg/dL',
          importance: 'important',
        },
      ],
    });

    // 2. Diabetes Risk
    const diabetesRisk = this.assessDiabetesRisk(profile);
    const diabetesFactors: RiskFactor[] = [
      {
        factor: 'BMI',
        value: Math.round(
          (profile.vitals.weight / Math.pow(profile.vitals.height / 100, 2)) * 10
        ) / 10,
        impact: profile.vitals.weight / Math.pow(profile.vitals.height / 100, 2) >= 25 ? 'risk_increasing' : 'neutral',
        modifiable: true,
      },
      {
        factor: 'Physical Activity',
        value: profile.lifestyle.physicalActivity,
        impact: profile.lifestyle.physicalActivity === 'sedentary' ? 'risk_increasing' : 'protective',
        modifiable: true,
      },
      {
        factor: 'Family History',
        value: profile.medicalHistory.familyHistory.diabetes ? 'Yes' : 'No',
        impact: profile.medicalHistory.familyHistory.diabetes ? 'risk_increasing' : 'neutral',
        modifiable: false,
      },
    ];

    const diabetesRecommendations: Recommendation[] = [];
    if (diabetesRisk.screening_recommended) {
      diabetesRecommendations.push({
        priority: 'high',
        category: 'screening',
        action: 'Diabetes screening (A1C or fasting glucose)',
        rationale: 'Multiple risk factors present',
        timeline: 'Within 3 months',
      });
    }

    if (diabetesRisk.category === 'prediabetic') {
      diabetesRecommendations.push({
        priority: 'critical',
        category: 'lifestyle',
        action: 'Diabetes prevention program enrollment',
        rationale: 'Prediabetes detected',
        timeline: 'Immediately',
      });
    }

    assessments.push({
      assessmentType: 'Type 2 Diabetes Risk',
      riskScore: diabetesRisk.riskScore,
      riskLevel: diabetesRisk.category === 'low' ? 'low' : diabetesRisk.category === 'moderate' ? 'moderate' : 'high',
      interpretation: `Risk category: ${diabetesRisk.category}. ${diabetesRisk.prediabetesIndicators.length} risk indicators identified.`,
      factors: diabetesFactors,
      recommendations: diabetesRecommendations,
    });

    // 3. Hospitalization Risk (if applicable)
    if (profile.demographics.age >= 65 || profile.medications.length >= 5) {
      const hospRisk = this.assessHospitalizationRisk(profile);

      const hospRecommendations: Recommendation[] = [];
      if (hospRisk.score >= 5) {
        hospRisk.preventiveActions.forEach((action) => {
          hospRecommendations.push({
            priority: 'high',
            category: 'monitoring',
            action,
            rationale: 'Prevent unnecessary hospitalization',
            timeline: 'Within 1 month',
          });
        });
      }

      assessments.push({
        assessmentType: 'Hospitalization Risk',
        riskScore: hospRisk.score,
        riskLevel: hospRisk.score >= 8 ? 'very_high' : hospRisk.score >= 5 ? 'high' : hospRisk.score >= 3 ? 'moderate' : 'low',
        interpretation: `${hospRisk.thirtyDayRisk}% 30-day risk, ${hospRisk.ninetyDayRisk}% 90-day risk`,
        factors: hospRisk.drivers.map((d) => ({
          factor: d,
          value: 'Present',
          impact: 'risk_increasing' as const,
          modifiable: true,
        })),
        recommendations: hospRecommendations,
      });
    }

    return assessments;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Health Risk Assessment - Comprehensive Example');
  console.log('='.repeat(70));

  const assessor = new HealthRiskAssessor();

  // Example patient profile
  const patientProfile: PatientRiskProfile = {
    demographics: {
      age: 58,
      gender: 'male',
      race: 'Caucasian',
    },
    vitals: {
      systolicBP: 142,
      diastolicBP: 88,
      totalCholesterol: 220,
      hdlCholesterol: 42,
      ldlCholesterol: 145,
      weight: 95,
      height: 175,
    },
    labResults: {
      fastingGlucose: 108,
      a1c: 5.9,
      triglycerides: 185,
    },
    lifestyle: {
      smoker: true,
      physicalActivity: 'sedentary',
      alcoholUse: 'moderate',
      diet: 'fair',
    },
    medicalHistory: {
      diabetes: false,
      hypertension: true,
      heartDisease: false,
      stroke: false,
      kidneyDisease: false,
      familyHistory: {
        heartDisease: true,
        diabetes: true,
        cancer: false,
      },
    },
    medications: ['Lisinopril', 'Aspirin'],
  };

  console.log('\n👤 Patient Profile:');
  console.log(`   Age: ${patientProfile.demographics.age}`);
  console.log(`   Gender: ${patientProfile.demographics.gender}`);
  console.log(`   BP: ${patientProfile.vitals.systolicBP}/${patientProfile.vitals.diastolicBP}`);
  console.log(`   Total Cholesterol: ${patientProfile.vitals.totalCholesterol}`);
  console.log(`   HDL: ${patientProfile.vitals.hdlCholesterol}`);
  console.log(`   Fasting Glucose: ${patientProfile.labResults?.fastingGlucose}`);
  console.log(`   A1C: ${patientProfile.labResults?.a1c}%`);
  console.log(`   Smoker: ${patientProfile.lifestyle.smoker ? 'Yes' : 'No'}`);

  // Example 1: Cardiovascular Risk Assessment
  console.log('\n\n❤️  Example 1: Cardiovascular Disease Risk');

  const cvRisk = assessor.assessCardiovascularRisk(patientProfile);

  console.log(`\n   ASCVD Score: ${cvRisk.ascvdScore}`);
  console.log(`   10-Year Risk: ${cvRisk.tenYearRisk}%`);
  console.log(`   Risk Level: ${cvRisk.riskLevel.toUpperCase()}`);
  console.log(`   Heart Age: ${cvRisk.heartAge} years (chronological age: ${patientProfile.demographics.age})`);
  console.log(`   Statin Recommended: ${cvRisk.statin_recommended ? 'Yes' : 'No'}`);

  // Example 2: Diabetes Risk Assessment
  console.log('\n\n🩸 Example 2: Type 2 Diabetes Risk');

  const diabetesRisk = assessor.assessDiabetesRisk(patientProfile);

  console.log(`\n   Risk Score: ${diabetesRisk.riskScore}`);
  console.log(`   Category: ${diabetesRisk.category.toUpperCase()}`);
  if (diabetesRisk.tenYearRisk) {
    console.log(`   10-Year Risk: ${diabetesRisk.tenYearRisk}%`);
  }
  console.log(`   Screening Recommended: ${diabetesRisk.screening_recommended ? 'Yes' : 'No'}`);

  if (diabetesRisk.prediabetesIndicators.length > 0) {
    console.log('\n   Risk Indicators:');
    diabetesRisk.prediabetesIndicators.forEach((indicator) => {
      console.log(`     • ${indicator}`);
    });
  }

  // Example 3: Fall Risk Assessment (elderly patient)
  console.log('\n\n🚶 Example 3: Fall Risk Assessment (Elderly Patient)');

  const fallRisk = assessor.assessFallRisk(
    78, // age
    1, // previous falls
    true, // mobility issues
    7, // number of medications
    true, // vision problems
    false // cognitive impairment
  );

  console.log(`\n   Risk Score: ${fallRisk.score}`);
  console.log(`   Risk Category: ${fallRisk.category.toUpperCase()}`);

  if (fallRisk.factors.length > 0) {
    console.log('\n   Risk Factors:');
    fallRisk.factors.forEach((factor) => {
      console.log(`     • ${factor}`);
    });
  }

  if (fallRisk.interventions.length > 0) {
    console.log('\n   Recommended Interventions:');
    fallRisk.interventions.forEach((intervention) => {
      console.log(`     • ${intervention}`);
    });
  }

  // Example 4: Hospitalization Risk
  console.log('\n\n🏥 Example 4: Hospitalization Risk Prediction');

  const hospRisk = assessor.assessHospitalizationRisk(patientProfile);

  console.log(`\n   Risk Score: ${hospRisk.score}`);
  console.log(`   30-Day Risk: ${hospRisk.thirtyDayRisk}%`);
  console.log(`   90-Day Risk: ${hospRisk.ninetyDayRisk}%`);

  if (hospRisk.drivers.length > 0) {
    console.log('\n   Risk Drivers:');
    hospRisk.drivers.forEach((driver) => {
      console.log(`     • ${driver}`);
    });
  }

  if (hospRisk.preventiveActions.length > 0) {
    console.log('\n   Preventive Actions:');
    hospRisk.preventiveActions.forEach((action) => {
      console.log(`     • ${action}`);
    });
  }

  // Example 5: Comprehensive Risk Assessment with Recommendations
  console.log('\n\n📋 Example 5: Comprehensive Risk Profile & Recommendations');

  const comprehensiveAssessment = assessor.generateComprehensiveAssessment(patientProfile);

  comprehensiveAssessment.forEach((assessment, idx) => {
    console.log(`\n   ${idx + 1}. ${assessment.assessmentType}`);
    console.log(`      Risk Level: ${assessment.riskLevel.toUpperCase()}`);
    console.log(`      Score: ${assessment.riskScore}`);
    if (assessment.absoluteRisk) {
      console.log(`      Absolute Risk: ${assessment.absoluteRisk}%`);
    }
    console.log(`      ${assessment.interpretation}`);

    if (assessment.targetMetrics && assessment.targetMetrics.length > 0) {
      console.log('\n      Target Metrics:');
      assessment.targetMetrics.forEach((metric) => {
        console.log(
          `        ${metric.metric}: ${metric.current} → ${metric.target} ${metric.unit} (${metric.importance})`
        );
      });
    }

    if (assessment.recommendations.length > 0) {
      console.log('\n      Top Recommendations:');
      assessment.recommendations.slice(0, 3).forEach((rec) => {
        console.log(`        [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`          ${rec.rationale}`);
        if (rec.timeline) {
          console.log(`          Timeline: ${rec.timeline}`);
        }
      });
    }
  });

  // Example 6: Risk Factor Summary
  console.log('\n\n🎯 Example 6: Modifiable vs Non-Modifiable Risk Factors');

  const allFactors = comprehensiveAssessment.flatMap((a) => a.factors);
  const modifiable = allFactors.filter((f) => f.modifiable && f.impact === 'risk_increasing');
  const nonModifiable = allFactors.filter(
    (f) => !f.modifiable && f.impact === 'risk_increasing'
  );

  console.log(`\n   Modifiable Risk Factors (${modifiable.length}):`);
  modifiable.forEach((factor) => {
    console.log(`     • ${factor.factor}: ${factor.value}`);
  });

  console.log(`\n   Non-Modifiable Risk Factors (${nonModifiable.length}):`);
  nonModifiable.forEach((factor) => {
    console.log(`     • ${factor.factor}: ${factor.value}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('Health risk assessment examples completed!');
  console.log('Evidence-based clinical guidelines applied');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
