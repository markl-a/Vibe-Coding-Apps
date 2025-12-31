/**
 * Compliance Check Examples
 *
 * This file demonstrates compliance and regulatory checking patterns:
 * - KYC (Know Your Customer) verification
 * - AML (Anti-Money Laundering) screening
 * - Sanctions list checking
 * - PEP (Politically Exposed Person) screening
 * - Document verification
 * - Identity verification
 * - Regulatory reporting
 */

// ============================================================================
// TYPES
// ============================================================================

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'requires_review';

export type DocumentType =
  | 'passport'
  | 'drivers_license'
  | 'national_id'
  | 'utility_bill'
  | 'bank_statement';

export interface KYCData {
  customerId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  documents: {
    type: DocumentType;
    number: string;
    issuedDate: Date;
    expiryDate?: Date;
    issuingCountry: string;
    verified: boolean;
  }[];
  email: string;
  phone: string;
}

export interface KYCResult {
  status: VerificationStatus;
  verificationLevel: 'basic' | 'intermediate' | 'enhanced';
  score: number; // 0-100
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  missingDocuments: DocumentType[];
  recommendation: string;
  timestamp: Date;
}

export interface AMLResult {
  status: 'clear' | 'flagged' | 'high_risk';
  riskScore: number; // 0-100
  flags: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  recommendations: string[];
  requiresManualReview: boolean;
  timestamp: Date;
}

export interface SanctionsResult {
  isMatch: boolean;
  confidence: number; // 0-1
  matches: {
    listName: string;
    matchedName: string;
    reason: string;
    dateAdded: Date;
  }[];
  recommendation: 'proceed' | 'review' | 'block';
  timestamp: Date;
}

export interface PEPResult {
  isPEP: boolean;
  confidence: number; // 0-1
  matches: {
    name: string;
    position: string;
    country: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  recommendation: string;
  timestamp: Date;
}

export interface ComplianceReport {
  customerId: string;
  overallStatus: VerificationStatus;
  kycResult: KYCResult;
  amlResult: AMLResult;
  sanctionsResult: SanctionsResult;
  pepResult: PEPResult;
  recommendation: 'approve' | 'review' | 'reject';
  timestamp: Date;
}

// ============================================================================
// KYC VERIFICATION SERVICE
// ============================================================================

/**
 * KYC verification service
 */
export class KYCVerificationService {
  /**
   * Verify customer identity and documents
   */
  async verifyCustomer(kycData: KYCData): Promise<KYCResult> {
    try {
      console.log(`Verifying KYC for customer ${kycData.customerId}...`);

      const checks: KYCResult['checks'] = [];
      let score = 0;

      // Name validation
      const nameCheck = this.validateName(kycData.firstName, kycData.lastName);
      checks.push(nameCheck);
      if (nameCheck.passed) score += 15;

      // Date of birth validation
      const dobCheck = this.validateDateOfBirth(kycData.dateOfBirth);
      checks.push(dobCheck);
      if (dobCheck.passed) score += 15;

      // Address validation
      const addressCheck = this.validateAddress(kycData.address);
      checks.push(addressCheck);
      if (addressCheck.passed) score += 20;

      // Document validation
      const docCheck = this.validateDocuments(kycData.documents);
      checks.push(docCheck);
      if (docCheck.passed) score += 30;

      // Contact information
      const contactCheck = this.validateContactInfo(kycData.email, kycData.phone);
      checks.push(contactCheck);
      if (contactCheck.passed) score += 20;

      // Determine verification level
      const verificationLevel = this.determineVerificationLevel(score, kycData);

      // Check for missing documents
      const missingDocuments = this.checkMissingDocuments(kycData);

      // Determine status
      const status = this.determineStatus(score, checks);
      const recommendation = this.generateRecommendation(status, score, missingDocuments);

      return {
        status,
        verificationLevel,
        score,
        checks,
        missingDocuments,
        recommendation,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during KYC verification:', error);
      throw new Error('Failed to verify customer KYC');
    }
  }

  private validateName(firstName: string, lastName: string): KYCResult['checks'][0] {
    const isValid =
      firstName.length >= 2 &&
      lastName.length >= 2 &&
      /^[a-zA-Z\s'-]+$/.test(firstName) &&
      /^[a-zA-Z\s'-]+$/.test(lastName);

    return {
      name: 'Name Validation',
      passed: isValid,
      details: isValid
        ? 'Name format is valid'
        : 'Invalid name format or too short',
    };
  }

  private validateDateOfBirth(dob: Date): KYCResult['checks'][0] {
    const age = this.calculateAge(dob);
    const isValid = age >= 18 && age <= 120;

    return {
      name: 'Date of Birth',
      passed: isValid,
      details: isValid
        ? `Customer is ${age} years old`
        : age < 18
          ? 'Customer is under 18'
          : 'Invalid date of birth',
    };
  }

  private validateAddress(address: KYCData['address']): KYCResult['checks'][0] {
    const isValid =
      address.street.length > 0 &&
      address.city.length > 0 &&
      address.postalCode.length > 0 &&
      address.country.length === 2;

    return {
      name: 'Address Validation',
      passed: isValid,
      details: isValid
        ? 'Address is complete and valid'
        : 'Incomplete or invalid address',
    };
  }

  private validateDocuments(
    documents: KYCData['documents']
  ): KYCResult['checks'][0] {
    const hasIDDocument = documents.some(
      (doc) =>
        (doc.type === 'passport' ||
          doc.type === 'drivers_license' ||
          doc.type === 'national_id') &&
        doc.verified
    );

    const hasProofOfAddress = documents.some(
      (doc) =>
        (doc.type === 'utility_bill' || doc.type === 'bank_statement') &&
        doc.verified
    );

    const allValid = documents.every((doc) => {
      if (doc.expiryDate) {
        return doc.expiryDate > new Date();
      }
      return true;
    });

    const isValid = hasIDDocument && allValid;

    return {
      name: 'Document Verification',
      passed: isValid,
      details: isValid
        ? `${documents.length} document(s) verified`
        : !hasIDDocument
          ? 'Missing verified ID document'
          : !allValid
            ? 'Some documents are expired'
            : 'Document verification incomplete',
    };
  }

  private validateContactInfo(email: string, phone: string): KYCResult['checks'][0] {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = /^\+?[\d\s-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;

    const isValid = emailValid && phoneValid;

    return {
      name: 'Contact Information',
      passed: isValid,
      details: isValid
        ? 'Email and phone are valid'
        : !emailValid
          ? 'Invalid email format'
          : 'Invalid phone format',
    };
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  private determineVerificationLevel(
    score: number,
    kycData: KYCData
  ): 'basic' | 'intermediate' | 'enhanced' {
    const hasMultipleDocs = kycData.documents.length >= 2;
    const hasProofOfAddress = kycData.documents.some(
      (doc) => doc.type === 'utility_bill' || doc.type === 'bank_statement'
    );

    if (score >= 90 && hasMultipleDocs && hasProofOfAddress) {
      return 'enhanced';
    } else if (score >= 70 && hasMultipleDocs) {
      return 'intermediate';
    }
    return 'basic';
  }

  private checkMissingDocuments(kycData: KYCData): DocumentType[] {
    const missing: DocumentType[] = [];
    const providedTypes = new Set(kycData.documents.map((d) => d.type));

    if (
      !providedTypes.has('passport') &&
      !providedTypes.has('drivers_license') &&
      !providedTypes.has('national_id')
    ) {
      missing.push('passport');
    }

    if (
      !providedTypes.has('utility_bill') &&
      !providedTypes.has('bank_statement')
    ) {
      missing.push('utility_bill');
    }

    return missing;
  }

  private determineStatus(
    score: number,
    checks: KYCResult['checks']
  ): VerificationStatus {
    const allPassed = checks.every((c) => c.passed);

    if (allPassed && score >= 90) return 'verified';
    if (score >= 70) return 'requires_review';
    if (score < 50) return 'rejected';
    return 'pending';
  }

  private generateRecommendation(
    status: VerificationStatus,
    score: number,
    missingDocuments: DocumentType[]
  ): string {
    if (status === 'verified') {
      return 'Customer identity verified. Proceed with onboarding.';
    } else if (status === 'requires_review') {
      return `Manual review required. Missing documents: ${missingDocuments.join(', ') || 'none'}.`;
    } else if (status === 'rejected') {
      return 'Verification failed. Do not proceed with onboarding.';
    }
    return 'Verification pending. Request additional documentation.';
  }
}

// ============================================================================
// AML SCREENING SERVICE
// ============================================================================

/**
 * AML (Anti-Money Laundering) screening service
 */
export class AMLScreeningService {
  /**
   * Screen customer for AML risks
   */
  async screenCustomer(
    customerId: string,
    kycData: KYCData,
    transactionHistory?: {
      totalVolume: number;
      largeTransactions: number;
      internationalTransactions: number;
      cashTransactions: number;
    }
  ): Promise<AMLResult> {
    try {
      console.log(`Running AML screening for customer ${customerId}...`);

      const flags: AMLResult['flags'] = [];
      let riskScore = 0;

      // High-risk country check
      const countryRisk = this.checkHighRiskCountry(kycData.nationality);
      if (countryRisk) {
        riskScore += 25;
        flags.push(countryRisk);
      }

      // Transaction pattern analysis
      if (transactionHistory) {
        const txnRisk = this.analyzeTransactionPatterns(transactionHistory);
        riskScore += txnRisk.score;
        flags.push(...txnRisk.flags);
      }

      // Occupation risk (would need additional data)
      // Industry-specific checks

      // Determine status
      const status = this.determineStatus(riskScore);
      const requiresManualReview = riskScore >= 40;
      const recommendations = this.generateRecommendations(flags, riskScore);

      return {
        status,
        riskScore: Math.min(riskScore, 100),
        flags,
        recommendations,
        requiresManualReview,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during AML screening:', error);
      throw new Error('Failed to screen customer for AML');
    }
  }

  private checkHighRiskCountry(
    nationality: string
  ): AMLResult['flags'][0] | null {
    // Simplified high-risk country list (in production, use FATF lists)
    const highRiskCountries = ['KP', 'IR', 'MM'];
    const mediumRiskCountries = ['PK', 'YE', 'SY'];

    if (highRiskCountries.includes(nationality)) {
      return {
        type: 'high_risk_country',
        severity: 'critical',
        description: `Customer nationality (${nationality}) is on high-risk list`,
      };
    } else if (mediumRiskCountries.includes(nationality)) {
      return {
        type: 'medium_risk_country',
        severity: 'medium',
        description: `Customer nationality (${nationality}) requires enhanced due diligence`,
      };
    }

    return null;
  }

  private analyzeTransactionPatterns(transactionHistory: {
    totalVolume: number;
    largeTransactions: number;
    internationalTransactions: number;
    cashTransactions: number;
  }): { score: number; flags: AMLResult['flags'] } {
    const flags: AMLResult['flags'] = [];
    let score = 0;

    // Large transaction volume
    if (transactionHistory.totalVolume > 100000) {
      score += 15;
      flags.push({
        type: 'high_volume',
        severity: 'medium',
        description: `High total transaction volume: $${transactionHistory.totalVolume.toLocaleString()}`,
      });
    }

    // Frequent large transactions
    if (transactionHistory.largeTransactions > 10) {
      score += 20;
      flags.push({
        type: 'large_transactions',
        severity: 'high',
        description: `${transactionHistory.largeTransactions} large transactions detected`,
      });
    }

    // High international activity
    if (transactionHistory.internationalTransactions > 20) {
      score += 15;
      flags.push({
        type: 'international_activity',
        severity: 'medium',
        description: `${transactionHistory.internationalTransactions} international transactions`,
      });
    }

    // Cash transactions
    if (transactionHistory.cashTransactions > 5) {
      score += 25;
      flags.push({
        type: 'cash_transactions',
        severity: 'high',
        description: `${transactionHistory.cashTransactions} cash transactions detected`,
      });
    }

    return { score, flags };
  }

  private determineStatus(riskScore: number): 'clear' | 'flagged' | 'high_risk' {
    if (riskScore >= 60) return 'high_risk';
    if (riskScore >= 30) return 'flagged';
    return 'clear';
  }

  private generateRecommendations(
    flags: AMLResult['flags'],
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 60) {
      recommendations.push('File Suspicious Activity Report (SAR)');
      recommendations.push('Conduct enhanced due diligence');
      recommendations.push('Consider account restrictions or closure');
    } else if (riskScore >= 30) {
      recommendations.push('Conduct additional verification');
      recommendations.push('Monitor account activity closely');
      recommendations.push('Request source of funds documentation');
    } else {
      recommendations.push('Standard monitoring procedures apply');
    }

    if (flags.some((f) => f.type === 'cash_transactions')) {
      recommendations.push('Verify source of cash deposits');
    }

    return recommendations;
  }
}

// ============================================================================
// SANCTIONS SCREENING SERVICE
// ============================================================================

/**
 * Sanctions list screening service
 */
export class SanctionsScreeningService {
  // Mock sanctions lists
  private sanctionedEntities = new Set([
    'JOHN DOE',
    'JANE SMITH',
    'ACME EVIL CORP',
  ]);

  /**
   * Screen customer against sanctions lists
   */
  async screenAgainstSanctions(
    firstName: string,
    lastName: string,
    dateOfBirth?: Date
  ): Promise<SanctionsResult> {
    try {
      console.log(`Screening ${firstName} ${lastName} against sanctions lists...`);

      const fullName = `${firstName} ${lastName}`.toUpperCase();
      const matches: SanctionsResult['matches'] = [];

      // Check direct match
      if (this.sanctionedEntities.has(fullName)) {
        matches.push({
          listName: 'OFAC SDN List',
          matchedName: fullName,
          reason: 'Exact name match',
          dateAdded: new Date('2020-01-01'),
        });
      }

      // Check fuzzy match (simplified)
      const fuzzyMatches = this.fuzzyMatch(fullName);
      matches.push(...fuzzyMatches);

      const isMatch = matches.length > 0;
      const confidence = isMatch ? this.calculateMatchConfidence(matches) : 0;
      const recommendation = this.getRecommendation(isMatch, confidence);

      return {
        isMatch,
        confidence,
        matches,
        recommendation,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during sanctions screening:', error);
      throw new Error('Failed to screen against sanctions lists');
    }
  }

  private fuzzyMatch(name: string): SanctionsResult['matches'] {
    const matches: SanctionsResult['matches'] = [];

    // Simplified fuzzy matching (in production, use Levenshtein distance)
    for (const sanctioned of this.sanctionedEntities) {
      const similarity = this.calculateSimilarity(name, sanctioned);
      if (similarity > 0.8 && name !== sanctioned) {
        matches.push({
          listName: 'OFAC SDN List',
          matchedName: sanctioned,
          reason: `Similar name (${(similarity * 100).toFixed(0)}% match)`,
          dateAdded: new Date('2020-01-01'),
        });
      }
    }

    return matches;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simplified similarity (in production, use proper string matching)
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');

    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) matches++;
      }
    }

    return matches / Math.max(words1.length, words2.length);
  }

  private calculateMatchConfidence(matches: SanctionsResult['matches']): number {
    if (matches.some((m) => m.reason.includes('Exact'))) {
      return 1.0;
    }

    // Extract similarity from reason
    const similarities = matches
      .map((m) => {
        const match = m.reason.match(/(\d+)%/);
        return match ? parseInt(match[1]) / 100 : 0.5;
      })
      .filter((s) => s > 0);

    return similarities.length > 0 ? Math.max(...similarities) : 0.5;
  }

  private getRecommendation(
    isMatch: boolean,
    confidence: number
  ): 'proceed' | 'review' | 'block' {
    if (!isMatch) return 'proceed';
    if (confidence >= 0.9) return 'block';
    return 'review';
  }
}

// ============================================================================
// PEP SCREENING SERVICE
// ============================================================================

/**
 * PEP (Politically Exposed Person) screening service
 */
export class PEPScreeningService {
  // Mock PEP database
  private pepDatabase = [
    {
      name: 'ROBERT POLITICIAN',
      position: 'Minister of Finance',
      country: 'US',
      riskLevel: 'high' as const,
    },
  ];

  /**
   * Screen for Politically Exposed Persons
   */
  async screenForPEP(
    firstName: string,
    lastName: string,
    nationality: string
  ): Promise<PEPResult> {
    try {
      console.log(`Screening ${firstName} ${lastName} for PEP status...`);

      const fullName = `${firstName} ${lastName}`.toUpperCase();
      const matches: PEPResult['matches'] = [];

      // Check database
      for (const pep of this.pepDatabase) {
        if (pep.name === fullName) {
          matches.push(pep);
        }
      }

      const isPEP = matches.length > 0;
      const confidence = isPEP ? 0.95 : 0;
      const recommendation = this.generateRecommendation(isPEP, matches);

      return {
        isPEP,
        confidence,
        matches,
        recommendation,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during PEP screening:', error);
      throw new Error('Failed to screen for PEP status');
    }
  }

  private generateRecommendation(
    isPEP: boolean,
    matches: PEPResult['matches']
  ): string {
    if (!isPEP) {
      return 'No PEP status detected. Standard procedures apply.';
    }

    const highRisk = matches.some((m) => m.riskLevel === 'high');
    if (highRisk) {
      return 'PEP detected with high risk. Enhanced due diligence required. Senior management approval needed.';
    }

    return 'PEP detected. Apply enhanced due diligence procedures.';
  }
}

// ============================================================================
// COMPREHENSIVE COMPLIANCE SERVICE
// ============================================================================

/**
 * Comprehensive compliance checking service
 */
export class ComplianceService {
  private kycService: KYCVerificationService;
  private amlService: AMLScreeningService;
  private sanctionsService: SanctionsScreeningService;
  private pepService: PEPScreeningService;

  constructor() {
    this.kycService = new KYCVerificationService();
    this.amlService = new AMLScreeningService();
    this.sanctionsService = new SanctionsScreeningService();
    this.pepService = new PEPScreeningService();
  }

  /**
   * Run comprehensive compliance check
   */
  async runComplianceCheck(kycData: KYCData): Promise<ComplianceReport> {
    try {
      console.log(`Running comprehensive compliance check for ${kycData.customerId}...\n`);

      // Run all checks in parallel
      const [kycResult, amlResult, sanctionsResult, pepResult] = await Promise.all([
        this.kycService.verifyCustomer(kycData),
        this.amlService.screenCustomer(kycData.customerId, kycData),
        this.sanctionsService.screenAgainstSanctions(
          kycData.firstName,
          kycData.lastName,
          kycData.dateOfBirth
        ),
        this.pepService.screenForPEP(
          kycData.firstName,
          kycData.lastName,
          kycData.nationality
        ),
      ]);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(
        kycResult,
        amlResult,
        sanctionsResult,
        pepResult
      );

      // Generate recommendation
      const recommendation = this.generateRecommendation(
        kycResult,
        amlResult,
        sanctionsResult,
        pepResult
      );

      return {
        customerId: kycData.customerId,
        overallStatus,
        kycResult,
        amlResult,
        sanctionsResult,
        pepResult,
        recommendation,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error during compliance check:', error);
      throw new Error('Failed to run compliance check');
    }
  }

  private determineOverallStatus(
    kycResult: KYCResult,
    amlResult: AMLResult,
    sanctionsResult: SanctionsResult,
    pepResult: PEPResult
  ): VerificationStatus {
    // Sanctions match = automatic rejection
    if (sanctionsResult.recommendation === 'block') {
      return 'rejected';
    }

    // KYC not verified
    if (kycResult.status === 'rejected') {
      return 'rejected';
    }

    // High AML risk
    if (amlResult.status === 'high_risk') {
      return 'requires_review';
    }

    // PEP or sanctions review needed
    if (sanctionsResult.recommendation === 'review' || pepResult.isPEP) {
      return 'requires_review';
    }

    // KYC verified and no major issues
    if (kycResult.status === 'verified' && amlResult.status === 'clear') {
      return 'verified';
    }

    return 'pending';
  }

  private generateRecommendation(
    kycResult: KYCResult,
    amlResult: AMLResult,
    sanctionsResult: SanctionsResult,
    pepResult: PEPResult
  ): 'approve' | 'review' | 'reject' {
    if (sanctionsResult.recommendation === 'block') {
      return 'reject';
    }

    if (
      amlResult.status === 'high_risk' ||
      kycResult.status === 'rejected'
    ) {
      return 'reject';
    }

    if (
      kycResult.status === 'requires_review' ||
      amlResult.requiresManualReview ||
      sanctionsResult.recommendation === 'review' ||
      pepResult.isPEP
    ) {
      return 'review';
    }

    return 'approve';
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: KYC verification
 */
export async function exampleKYCVerification(): Promise<void> {
  console.log('Example: KYC Verification\n');

  const service = new KYCVerificationService();

  const kycData: KYCData = {
    customerId: 'cust_001',
    firstName: 'Alice',
    lastName: 'Johnson',
    dateOfBirth: new Date('1985-06-15'),
    nationality: 'US',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    documents: [
      {
        type: 'passport',
        number: 'P1234567',
        issuedDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        issuingCountry: 'US',
        verified: true,
      },
      {
        type: 'utility_bill',
        number: 'UB789',
        issuedDate: new Date('2024-11-01'),
        issuingCountry: 'US',
        verified: true,
      },
    ],
    email: 'alice.johnson@example.com',
    phone: '+1-555-0123',
  };

  try {
    const result = await service.verifyCustomer(kycData);

    console.log('KYC Verification Result:');
    console.log(`  Status: ${result.status.toUpperCase()}`);
    console.log(`  Verification Level: ${result.verificationLevel.toUpperCase()}`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Recommendation: ${result.recommendation}`);

    console.log('\nChecks:');
    result.checks.forEach((check) => {
      const icon = check.passed ? '[PASS]' : '[FAIL]';
      console.log(`  ${icon} ${check.name}: ${check.details}`);
    });

    if (result.missingDocuments.length > 0) {
      console.log(`\nMissing Documents: ${result.missingDocuments.join(', ')}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: AML screening
 */
export async function exampleAMLScreening(): Promise<void> {
  console.log('\nExample: AML Screening\n');

  const service = new AMLScreeningService();

  const kycData: KYCData = {
    customerId: 'cust_002',
    firstName: 'Bob',
    lastName: 'Smith',
    dateOfBirth: new Date('1975-03-20'),
    nationality: 'PK',
    address: {
      street: '456 Oak Ave',
      city: 'London',
      postalCode: 'SW1A 1AA',
      country: 'GB',
    },
    documents: [],
    email: 'bob.smith@example.com',
    phone: '+44-20-1234-5678',
  };

  const transactionHistory = {
    totalVolume: 150000,
    largeTransactions: 15,
    internationalTransactions: 25,
    cashTransactions: 8,
  };

  try {
    const result = await service.screenCustomer(
      kycData.customerId,
      kycData,
      transactionHistory
    );

    console.log('AML Screening Result:');
    console.log(`  Status: ${result.status.toUpperCase()}`);
    console.log(`  Risk Score: ${result.riskScore}/100`);
    console.log(`  Manual Review Required: ${result.requiresManualReview ? 'YES' : 'NO'}`);

    if (result.flags.length > 0) {
      console.log('\nRisk Flags:');
      result.flags.forEach((flag) => {
        console.log(`  [${flag.severity.toUpperCase()}] ${flag.type}: ${flag.description}`);
      });
    }

    console.log('\nRecommendations:');
    result.recommendations.forEach((rec) => console.log(`  - ${rec}`));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Sanctions screening
 */
export async function exampleSanctionsScreening(): Promise<void> {
  console.log('\nExample: Sanctions Screening\n');

  const service = new SanctionsScreeningService();

  try {
    const result = await service.screenAgainstSanctions('John', 'Doe');

    console.log('Sanctions Screening Result:');
    console.log(`  Match Found: ${result.isMatch ? 'YES' : 'NO'}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  Recommendation: ${result.recommendation.toUpperCase()}`);

    if (result.matches.length > 0) {
      console.log('\nMatches:');
      result.matches.forEach((match) => {
        console.log(`  - ${match.matchedName} (${match.listName})`);
        console.log(`    Reason: ${match.reason}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Comprehensive compliance check
 */
export async function exampleComprehensiveCompliance(): Promise<void> {
  console.log('\nExample: Comprehensive Compliance Check\n');

  const service = new ComplianceService();

  const kycData: KYCData = {
    customerId: 'cust_003',
    firstName: 'Carol',
    lastName: 'Williams',
    dateOfBirth: new Date('1990-08-10'),
    nationality: 'GB',
    address: {
      street: '789 Elm Street',
      city: 'Manchester',
      postalCode: 'M1 1AA',
      country: 'GB',
    },
    documents: [
      {
        type: 'passport',
        number: 'GB9876543',
        issuedDate: new Date('2019-01-01'),
        expiryDate: new Date('2029-01-01'),
        issuingCountry: 'GB',
        verified: true,
      },
    ],
    email: 'carol.williams@example.com',
    phone: '+44-161-123-4567',
  };

  try {
    const result = await service.runComplianceCheck(kycData);

    console.log('Comprehensive Compliance Report:');
    console.log(`  Customer ID: ${result.customerId}`);
    console.log(`  Overall Status: ${result.overallStatus.toUpperCase()}`);
    console.log(`  Final Recommendation: ${result.recommendation.toUpperCase()}`);

    console.log('\nKYC Result:');
    console.log(`  Status: ${result.kycResult.status}`);
    console.log(`  Score: ${result.kycResult.score}/100`);

    console.log('\nAML Result:');
    console.log(`  Status: ${result.amlResult.status}`);
    console.log(`  Risk Score: ${result.amlResult.riskScore}/100`);

    console.log('\nSanctions Result:');
    console.log(`  Match: ${result.sanctionsResult.isMatch ? 'YES' : 'NO'}`);
    console.log(`  Recommendation: ${result.sanctionsResult.recommendation}`);

    console.log('\nPEP Result:');
    console.log(`  Is PEP: ${result.pepResult.isPEP ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  await exampleKYCVerification();
  await exampleAMLScreening();
  await exampleSanctionsScreening();
  await exampleComprehensiveCompliance();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
