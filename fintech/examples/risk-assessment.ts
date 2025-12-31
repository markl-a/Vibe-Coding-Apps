/**
 * Risk Assessment Examples
 *
 * This file demonstrates risk assessment patterns for fintech:
 * - Credit risk scoring
 * - Fraud detection and prevention
 * - Transaction risk evaluation
 * - Customer risk profiling
 * - Portfolio risk metrics
 * - Machine learning-based risk models
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CreditScoreResult {
  score: number; // 300-850 (FICO-like scale)
  rating: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent';
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  recommendation: string;
}

export interface FraudRiskResult {
  riskLevel: RiskLevel;
  score: number; // 0-100
  confidence: number; // 0-1
  flags: {
    type: string;
    severity: RiskLevel;
    description: string;
  }[];
  recommendation: 'approve' | 'review' | 'reject';
}

export interface TransactionRisk {
  transactionId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  timestamp: Date;
}

export interface CustomerProfile {
  customerId: string;
  age?: number;
  incomeRange?: string;
  employmentStatus?: string;
  accountAge: number; // in months
  transactionHistory: {
    count: number;
    totalVolume: number;
    averageAmount: number;
    failureRate: number;
  };
  creditHistory?: {
    score?: number;
    delinquencies: number;
    bankruptcies: number;
    creditUtilization: number; // 0-1
  };
  behaviorMetrics: {
    loginFrequency: number;
    deviceChanges: number;
    locationChanges: number;
    failedLoginAttempts: number;
  };
}

export interface RiskAssessmentResult {
  customerId: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  creditRisk: number;
  fraudRisk: number;
  operationalRisk: number;
  details: string[];
  recommendations: string[];
  timestamp: Date;
}

// ============================================================================
// CREDIT SCORING ENGINE
// ============================================================================

/**
 * Credit scoring engine using simplified FICO-like algorithm
 */
export class CreditScoringEngine {
  /**
   * Calculate credit score
   */
  calculateScore(profile: CustomerProfile): CreditScoreResult {
    try {
      let score = 300; // Base score
      const factors: CreditScoreResult['factors'] = [];

      // Payment History (35%)
      const paymentScore = this.calculatePaymentHistoryScore(profile);
      score += paymentScore.score;
      factors.push(...paymentScore.factors);

      // Credit Utilization (30%)
      const utilizationScore = this.calculateCreditUtilizationScore(profile);
      score += utilizationScore.score;
      factors.push(...utilizationScore.factors);

      // Credit History Length (15%)
      const historyScore = this.calculateCreditHistoryScore(profile);
      score += historyScore.score;
      factors.push(...historyScore.factors);

      // Account Activity (10%)
      const activityScore = this.calculateAccountActivityScore(profile);
      score += activityScore.score;
      factors.push(...activityScore.factors);

      // Account Diversity (10%)
      const diversityScore = this.calculateAccountDiversityScore(profile);
      score += diversityScore.score;
      factors.push(...diversityScore.factors);

      // Cap at 850
      score = Math.min(score, 850);

      const rating = this.getCreditRating(score);
      const recommendation = this.getRecommendation(score);

      return {
        score: Math.round(score),
        rating,
        factors,
        recommendation,
      };
    } catch (error) {
      console.error('Error calculating credit score:', error);
      throw new Error('Failed to calculate credit score');
    }
  }

  private calculatePaymentHistoryScore(
    profile: CustomerProfile
  ): { score: number; factors: CreditScoreResult['factors'] } {
    const factors: CreditScoreResult['factors'] = [];
    let score = 0;

    const failureRate = profile.transactionHistory.failureRate;
    const delinquencies = profile.creditHistory?.delinquencies || 0;

    // Perfect payment history
    if (failureRate === 0 && delinquencies === 0) {
      score = 192.5; // 35% of 550
      factors.push({
        name: 'Perfect Payment History',
        impact: 'positive',
        description: 'No failed transactions or delinquencies',
      });
    } else if (failureRate < 0.05 && delinquencies <= 1) {
      score = 150;
      factors.push({
        name: 'Good Payment History',
        impact: 'positive',
        description: 'Minimal payment issues',
      });
    } else if (failureRate < 0.1 && delinquencies <= 3) {
      score = 100;
      factors.push({
        name: 'Fair Payment History',
        impact: 'neutral',
        description: 'Some payment issues',
      });
    } else {
      score = 50;
      factors.push({
        name: 'Poor Payment History',
        impact: 'negative',
        description: 'Multiple payment issues or delinquencies',
      });
    }

    return { score, factors };
  }

  private calculateCreditUtilizationScore(
    profile: CustomerProfile
  ): { score: number; factors: CreditScoreResult['factors'] } {
    const factors: CreditScoreResult['factors'] = [];
    let score = 0;

    const utilization = profile.creditHistory?.creditUtilization || 0;

    if (utilization < 0.1) {
      score = 165; // 30% of 550
      factors.push({
        name: 'Excellent Credit Utilization',
        impact: 'positive',
        description: `Low utilization: ${(utilization * 100).toFixed(0)}%`,
      });
    } else if (utilization < 0.3) {
      score = 140;
      factors.push({
        name: 'Good Credit Utilization',
        impact: 'positive',
        description: `Moderate utilization: ${(utilization * 100).toFixed(0)}%`,
      });
    } else if (utilization < 0.5) {
      score = 100;
      factors.push({
        name: 'Fair Credit Utilization',
        impact: 'neutral',
        description: `Higher utilization: ${(utilization * 100).toFixed(0)}%`,
      });
    } else {
      score = 50;
      factors.push({
        name: 'High Credit Utilization',
        impact: 'negative',
        description: `Very high utilization: ${(utilization * 100).toFixed(0)}%`,
      });
    }

    return { score, factors };
  }

  private calculateCreditHistoryScore(
    profile: CustomerProfile
  ): { score: number; factors: CreditScoreResult['factors'] } {
    const factors: CreditScoreResult['factors'] = [];
    let score = 0;

    const ageInMonths = profile.accountAge;

    if (ageInMonths >= 120) {
      // 10+ years
      score = 82.5; // 15% of 550
      factors.push({
        name: 'Extensive Credit History',
        impact: 'positive',
        description: `${Math.floor(ageInMonths / 12)} years of history`,
      });
    } else if (ageInMonths >= 60) {
      // 5+ years
      score = 70;
      factors.push({
        name: 'Established Credit History',
        impact: 'positive',
        description: `${Math.floor(ageInMonths / 12)} years of history`,
      });
    } else if (ageInMonths >= 24) {
      // 2+ years
      score = 50;
      factors.push({
        name: 'Moderate Credit History',
        impact: 'neutral',
        description: `${Math.floor(ageInMonths / 12)} years of history`,
      });
    } else {
      score = 30;
      factors.push({
        name: 'Limited Credit History',
        impact: 'negative',
        description: `Only ${ageInMonths} months of history`,
      });
    }

    return { score, factors };
  }

  private calculateAccountActivityScore(
    profile: CustomerProfile
  ): { score: number; factors: CreditScoreResult['factors'] } {
    const factors: CreditScoreResult['factors'] = [];
    let score = 55; // 10% of 550

    const txnCount = profile.transactionHistory.count;

    if (txnCount >= 100) {
      factors.push({
        name: 'High Account Activity',
        impact: 'positive',
        description: `${txnCount} transactions processed`,
      });
    } else if (txnCount >= 20) {
      score = 45;
      factors.push({
        name: 'Moderate Account Activity',
        impact: 'neutral',
        description: `${txnCount} transactions processed`,
      });
    } else {
      score = 30;
      factors.push({
        name: 'Low Account Activity',
        impact: 'neutral',
        description: `Only ${txnCount} transactions`,
      });
    }

    return { score, factors };
  }

  private calculateAccountDiversityScore(
    profile: CustomerProfile
  ): { score: number; factors: CreditScoreResult['factors'] } {
    const factors: CreditScoreResult['factors'] = [];
    const score = 55; // 10% of 550

    factors.push({
      name: 'Account Diversity',
      impact: 'neutral',
      description: 'Single account type assessed',
    });

    return { score, factors };
  }

  private getCreditRating(
    score: number
  ): 'poor' | 'fair' | 'good' | 'very_good' | 'excellent' {
    if (score >= 800) return 'excellent';
    if (score >= 740) return 'very_good';
    if (score >= 670) return 'good';
    if (score >= 580) return 'fair';
    return 'poor';
  }

  private getRecommendation(score: number): string {
    if (score >= 740) {
      return 'Excellent credit profile. Approved for premium products.';
    } else if (score >= 670) {
      return 'Good credit profile. Approved with standard terms.';
    } else if (score >= 580) {
      return 'Fair credit profile. May require additional verification or higher rates.';
    } else {
      return 'Poor credit profile. High risk. Consider declining or requiring collateral.';
    }
  }
}

// ============================================================================
// FRAUD DETECTION ENGINE
// ============================================================================

/**
 * Fraud detection using rule-based and behavioral analysis
 */
export class FraudDetectionEngine {
  /**
   * Assess fraud risk for a transaction
   */
  assessTransaction(
    amount: number,
    customerId: string,
    profile: CustomerProfile,
    metadata: {
      ipAddress?: string;
      deviceId?: string;
      location?: string;
      paymentMethod?: string;
      velocity?: number; // transactions in last hour
    }
  ): FraudRiskResult {
    try {
      const flags: FraudRiskResult['flags'] = [];
      let score = 0;

      // Amount-based checks
      const amountRisk = this.checkAmountRisk(amount, profile);
      score += amountRisk.score;
      flags.push(...amountRisk.flags);

      // Velocity checks
      if (metadata.velocity !== undefined) {
        const velocityRisk = this.checkVelocityRisk(metadata.velocity);
        score += velocityRisk.score;
        flags.push(...velocityRisk.flags);
      }

      // Behavioral checks
      const behaviorRisk = this.checkBehaviorRisk(profile);
      score += behaviorRisk.score;
      flags.push(...behaviorRisk.flags);

      // Device and location checks
      const deviceRisk = this.checkDeviceAndLocation(
        profile,
        metadata.deviceId,
        metadata.location
      );
      score += deviceRisk.score;
      flags.push(...deviceRisk.flags);

      // Account age check
      if (profile.accountAge < 1) {
        score += 15;
        flags.push({
          type: 'new_account',
          severity: 'medium',
          description: 'Account is less than 1 month old',
        });
      }

      // Determine risk level
      const riskLevel = this.determineRiskLevel(score);
      const confidence = this.calculateConfidence(flags.length, profile);
      const recommendation = this.getRecommendation(score);

      return {
        riskLevel,
        score: Math.min(score, 100),
        confidence,
        flags,
        recommendation,
      };
    } catch (error) {
      console.error('Error assessing fraud risk:', error);
      throw new Error('Failed to assess fraud risk');
    }
  }

  private checkAmountRisk(
    amount: number,
    profile: CustomerProfile
  ): { score: number; flags: FraudRiskResult['flags'] } {
    const flags: FraudRiskResult['flags'] = [];
    let score = 0;

    const avgAmount = profile.transactionHistory.averageAmount;

    // Unusual amount (3x average)
    if (avgAmount > 0 && amount > avgAmount * 3) {
      score += 25;
      flags.push({
        type: 'unusual_amount',
        severity: 'high',
        description: `Amount ${amount} is ${Math.round(amount / avgAmount)}x average`,
      });
    }

    // High-value transaction
    if (amount > 10000) {
      score += 15;
      flags.push({
        type: 'high_value',
        severity: 'medium',
        description: `Transaction amount exceeds $10,000`,
      });
    }

    return { score, flags };
  }

  private checkVelocityRisk(
    velocity: number
  ): { score: number; flags: FraudRiskResult['flags'] } {
    const flags: FraudRiskResult['flags'] = [];
    let score = 0;

    if (velocity > 10) {
      score += 30;
      flags.push({
        type: 'high_velocity',
        severity: 'critical',
        description: `${velocity} transactions in last hour`,
      });
    } else if (velocity > 5) {
      score += 15;
      flags.push({
        type: 'elevated_velocity',
        severity: 'medium',
        description: `${velocity} transactions in last hour`,
      });
    }

    return { score, flags };
  }

  private checkBehaviorRisk(
    profile: CustomerProfile
  ): { score: number; flags: FraudRiskResult['flags'] } {
    const flags: FraudRiskResult['flags'] = [];
    let score = 0;

    // Failed login attempts
    if (profile.behaviorMetrics.failedLoginAttempts > 3) {
      score += 20;
      flags.push({
        type: 'failed_logins',
        severity: 'high',
        description: `${profile.behaviorMetrics.failedLoginAttempts} failed login attempts`,
      });
    }

    // Transaction failure rate
    if (profile.transactionHistory.failureRate > 0.3) {
      score += 15;
      flags.push({
        type: 'high_failure_rate',
        severity: 'medium',
        description: `${(profile.transactionHistory.failureRate * 100).toFixed(0)}% transaction failure rate`,
      });
    }

    return { score, flags };
  }

  private checkDeviceAndLocation(
    profile: CustomerProfile,
    deviceId?: string,
    location?: string
  ): { score: number; flags: FraudRiskResult['flags'] } {
    const flags: FraudRiskResult['flags'] = [];
    let score = 0;

    // Frequent device changes
    if (profile.behaviorMetrics.deviceChanges > 5) {
      score += 10;
      flags.push({
        type: 'device_changes',
        severity: 'medium',
        description: `${profile.behaviorMetrics.deviceChanges} device changes detected`,
      });
    }

    // Frequent location changes
    if (profile.behaviorMetrics.locationChanges > 10) {
      score += 10;
      flags.push({
        type: 'location_changes',
        severity: 'medium',
        description: `${profile.behaviorMetrics.locationChanges} location changes detected`,
      });
    }

    return { score, flags };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private calculateConfidence(flagCount: number, profile: CustomerProfile): number {
    // Higher confidence with more data points
    let confidence = 0.5;

    if (profile.transactionHistory.count > 100) confidence += 0.2;
    if (profile.accountAge > 12) confidence += 0.15;
    if (flagCount > 3) confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  private getRecommendation(score: number): 'approve' | 'review' | 'reject' {
    if (score >= 70) return 'reject';
    if (score >= 40) return 'review';
    return 'approve';
  }
}

// ============================================================================
// COMPREHENSIVE RISK ASSESSOR
// ============================================================================

/**
 * Comprehensive risk assessment combining multiple risk factors
 */
export class RiskAssessor {
  private creditEngine: CreditScoringEngine;
  private fraudEngine: FraudDetectionEngine;

  constructor() {
    this.creditEngine = new CreditScoringEngine();
    this.fraudEngine = new FraudDetectionEngine();
  }

  /**
   * Perform comprehensive risk assessment
   */
  assessCustomer(
    profile: CustomerProfile,
    transactionAmount?: number
  ): RiskAssessmentResult {
    try {
      const details: string[] = [];
      const recommendations: string[] = [];

      // Credit risk
      const creditScore = this.creditEngine.calculateScore(profile);
      const creditRisk = this.normalizeCreditScore(creditScore.score);
      details.push(`Credit Score: ${creditScore.score} (${creditScore.rating})`);

      // Fraud risk
      let fraudRisk = 0;
      if (transactionAmount) {
        const fraudResult = this.fraudEngine.assessTransaction(
          transactionAmount,
          profile.customerId,
          profile,
          {}
        );
        fraudRisk = fraudResult.score;
        details.push(`Fraud Risk: ${fraudRisk} (${fraudResult.riskLevel})`);

        if (fraudResult.flags.length > 0) {
          details.push(`Fraud Flags: ${fraudResult.flags.map(f => f.type).join(', ')}`);
        }
      }

      // Operational risk (based on account behavior)
      const operationalRisk = this.calculateOperationalRisk(profile);
      details.push(`Operational Risk: ${operationalRisk}`);

      // Calculate overall risk score (weighted average)
      const overallScore =
        creditRisk * 0.4 + fraudRisk * 0.4 + operationalRisk * 0.2;

      const overallRisk = this.determineOverallRisk(overallScore);

      // Generate recommendations
      if (creditScore.score < 670) {
        recommendations.push('Consider requiring additional verification or collateral');
      }
      if (fraudRisk > 50) {
        recommendations.push('Manual review required before approval');
      }
      if (profile.accountAge < 3) {
        recommendations.push('Apply stricter transaction limits for new account');
      }
      if (recommendations.length === 0) {
        recommendations.push('Customer meets standard risk criteria');
      }

      return {
        customerId: profile.customerId,
        overallRisk,
        riskScore: Math.round(overallScore),
        creditRisk,
        fraudRisk,
        operationalRisk,
        details,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error assessing customer risk:', error);
      throw new Error('Failed to assess customer risk');
    }
  }

  private normalizeCreditScore(score: number): number {
    // Convert 300-850 credit score to 0-100 risk score (inverted)
    // Higher credit score = lower risk
    return Math.round(((850 - score) / 550) * 100);
  }

  private calculateOperationalRisk(profile: CustomerProfile): number {
    let risk = 0;

    // High failure rate
    if (profile.transactionHistory.failureRate > 0.2) risk += 30;
    else if (profile.transactionHistory.failureRate > 0.1) risk += 15;

    // Low transaction count
    if (profile.transactionHistory.count < 10) risk += 20;

    // Frequent device/location changes
    if (profile.behaviorMetrics.deviceChanges > 5) risk += 15;
    if (profile.behaviorMetrics.locationChanges > 10) risk += 15;

    // Failed login attempts
    if (profile.behaviorMetrics.failedLoginAttempts > 3) risk += 20;

    return Math.min(risk, 100);
  }

  private determineOverallRisk(score: number): RiskLevel {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Credit scoring
 */
export async function exampleCreditScoring(): Promise<void> {
  console.log('Example: Credit Scoring\n');

  const engine = new CreditScoringEngine();

  const profile: CustomerProfile = {
    customerId: 'cust_001',
    age: 35,
    accountAge: 60, // 5 years
    transactionHistory: {
      count: 150,
      totalVolume: 50000,
      averageAmount: 333,
      failureRate: 0.02,
    },
    creditHistory: {
      score: 720,
      delinquencies: 0,
      bankruptcies: 0,
      creditUtilization: 0.25,
    },
    behaviorMetrics: {
      loginFrequency: 10,
      deviceChanges: 2,
      locationChanges: 3,
      failedLoginAttempts: 0,
    },
  };

  try {
    const result = engine.calculateScore(profile);

    console.log('Credit Score Result:');
    console.log(`  Score: ${result.score}`);
    console.log(`  Rating: ${result.rating.toUpperCase()}`);
    console.log(`  Recommendation: ${result.recommendation}`);
    console.log('\nFactors:');
    result.factors.forEach((factor) => {
      const impactIcon = factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : '=';
      console.log(`  [${impactIcon}] ${factor.name}: ${factor.description}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Fraud detection
 */
export async function exampleFraudDetection(): Promise<void> {
  console.log('\nExample: Fraud Detection\n');

  const engine = new FraudDetectionEngine();

  const profile: CustomerProfile = {
    customerId: 'cust_002',
    accountAge: 2, // 2 months
    transactionHistory: {
      count: 15,
      totalVolume: 5000,
      averageAmount: 333,
      failureRate: 0.2,
    },
    behaviorMetrics: {
      loginFrequency: 5,
      deviceChanges: 3,
      locationChanges: 5,
      failedLoginAttempts: 2,
    },
  };

  try {
    const result = engine.assessTransaction(5000, 'cust_002', profile, {
      velocity: 3,
      deviceId: 'device_123',
      location: 'US',
    });

    console.log('Fraud Risk Assessment:');
    console.log(`  Risk Level: ${result.riskLevel.toUpperCase()}`);
    console.log(`  Risk Score: ${result.score}/100`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  Recommendation: ${result.recommendation.toUpperCase()}`);

    if (result.flags.length > 0) {
      console.log('\nRisk Flags:');
      result.flags.forEach((flag) => {
        console.log(`  [${flag.severity.toUpperCase()}] ${flag.type}: ${flag.description}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Comprehensive risk assessment
 */
export async function exampleComprehensiveAssessment(): Promise<void> {
  console.log('\nExample: Comprehensive Risk Assessment\n');

  const assessor = new RiskAssessor();

  const profile: CustomerProfile = {
    customerId: 'cust_003',
    age: 42,
    accountAge: 36, // 3 years
    transactionHistory: {
      count: 85,
      totalVolume: 35000,
      averageAmount: 412,
      failureRate: 0.05,
    },
    creditHistory: {
      score: 680,
      delinquencies: 1,
      bankruptcies: 0,
      creditUtilization: 0.45,
    },
    behaviorMetrics: {
      loginFrequency: 8,
      deviceChanges: 1,
      locationChanges: 2,
      failedLoginAttempts: 1,
    },
  };

  try {
    const result = assessor.assessCustomer(profile, 1500);

    console.log('Comprehensive Risk Assessment:');
    console.log(`  Customer: ${result.customerId}`);
    console.log(`  Overall Risk: ${result.overallRisk.toUpperCase()}`);
    console.log(`  Overall Score: ${result.riskScore}/100`);
    console.log(`  Credit Risk: ${result.creditRisk}/100`);
    console.log(`  Fraud Risk: ${result.fraudRisk}/100`);
    console.log(`  Operational Risk: ${result.operationalRisk}/100`);

    console.log('\nDetails:');
    result.details.forEach((detail) => console.log(`  - ${detail}`));

    console.log('\nRecommendations:');
    result.recommendations.forEach((rec) => console.log(`  - ${rec}`));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleCreditScoring();
  await exampleFraudDetection();
  await exampleComprehensiveAssessment();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
