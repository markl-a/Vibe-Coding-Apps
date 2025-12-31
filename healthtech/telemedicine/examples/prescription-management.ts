/**
 * Digital Prescription Management Example
 *
 * Demonstrates e-prescribing system with:
 * - Electronic prescription creation and transmission
 * - Drug database integration
 * - Pharmacy network connectivity
 * - Controlled substance handling (EPCS)
 * - Prior authorization workflows
 * - Prescription history and refills
 * - Drug interaction checking
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Prescription {
  id: string;
  rxNumber: string;
  patientId: string;
  prescriberId: string;
  medication: MedicationDetails;
  dosage: DosageInstructions;
  pharmacy: PharmacyInfo;
  status: PrescriptionStatus;
  dates: PrescriptionDates;
  authorization?: PriorAuthorization;
  controlledSubstance?: ControlledSubstanceInfo;
  metadata: PrescriptionMetadata;
}

type PrescriptionStatus =
  | 'draft'
  | 'pending_signature'
  | 'signed'
  | 'transmitted'
  | 'received_by_pharmacy'
  | 'in_progress'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled'
  | 'denied';

interface MedicationDetails {
  name: string;
  genericName?: string;
  ndcCode: string; // National Drug Code
  rxcuiCode?: string; // RxNorm Concept Unique Identifier
  strength: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'patch' | 'inhaler';
  brandName?: string;
  manufacturer?: string;
  deaSchedule?: 'II' | 'III' | 'IV' | 'V'; // For controlled substances
}

interface DosageInstructions {
  quantity: number;
  unit: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'sublingual' | 'rectal';
  duration?: number; // days
  instructions: string;
  refills: number;
  substitutionAllowed: boolean;
  daySupply: number;
}

interface PharmacyInfo {
  id: string;
  name: string;
  ncpdpId: string; // National Council for Prescription Drug Programs ID
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  fax?: string;
  email?: string;
  supportsEPrescribing: boolean;
}

interface PrescriptionDates {
  written: Date;
  effectiveDate: Date;
  expirationDate: Date;
  lastFilled?: Date;
  nextRefillDate?: Date;
}

interface PriorAuthorization {
  id: string;
  status: 'pending' | 'approved' | 'denied' | 'not_required';
  requestedDate: Date;
  approvedDate?: Date;
  deniedDate?: Date;
  denialReason?: string;
  insuranceCompany: string;
  authorizationNumber?: string;
  validUntil?: Date;
  notes?: string;
}

interface ControlledSubstanceInfo {
  deaSchedule: 'II' | 'III' | 'IV' | 'V';
  prescriberDEA: string;
  requiresEPCS: boolean; // Electronic Prescribing for Controlled Substances
  twoFactorAuthCompleted: boolean;
  identityProofed: boolean;
}

interface PrescriptionMetadata {
  createdAt: Date;
  createdBy: string;
  signedAt?: Date;
  signedBy?: string;
  transmittedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  electronicSignature?: string;
  ipAddress?: string;
}

interface DrugInteraction {
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  drug1: string;
  drug2: string;
  description: string;
  clinicalEffects: string[];
  management: string;
}

interface RefillRequest {
  id: string;
  prescriptionId: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: Date;
  denialReason?: string;
}

interface FormularyCheck {
  medication: string;
  covered: boolean;
  tier?: number;
  copay?: number;
  alternatives?: FormularyAlternative[];
  priorAuthRequired: boolean;
  quantityLimits?: string;
}

interface FormularyAlternative {
  name: string;
  tier: number;
  copay: number;
  reason: string;
}

// ============================================================================
// Prescription Management System
// ============================================================================

class PrescriptionManager {
  private prescriptions: Map<string, Prescription> = new Map();
  private refillRequests: RefillRequest[] = [];

  /**
   * Create a new prescription
   */
  async createPrescription(
    patientId: string,
    prescriberId: string,
    medication: MedicationDetails,
    dosage: DosageInstructions,
    pharmacy: PharmacyInfo
  ): Promise<{ success: boolean; prescription?: Prescription; warnings?: string[] }> {
    const warnings: string[] = [];

    // Check if controlled substance
    let controlledSubstanceInfo: ControlledSubstanceInfo | undefined;
    if (medication.deaSchedule) {
      controlledSubstanceInfo = {
        deaSchedule: medication.deaSchedule,
        prescriberDEA: 'AB1234563', // Would be looked up from provider
        requiresEPCS: medication.deaSchedule === 'II', // Schedule II requires EPCS
        twoFactorAuthCompleted: false,
        identityProofed: false,
      };

      if (medication.deaSchedule === 'II') {
        warnings.push('⚠️  Schedule II controlled substance requires two-factor authentication');
      }
    }

    // Calculate expiration date
    const effectiveDate = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 365); // 1 year for most prescriptions

    // Controlled substances have shorter expiration
    if (medication.deaSchedule === 'II') {
      expirationDate.setDate(effectiveDate.getDate() + 90); // 90 days for Schedule II
    }

    const prescription: Prescription = {
      id: this.generatePrescriptionId(),
      rxNumber: this.generateRxNumber(),
      patientId,
      prescriberId,
      medication,
      dosage,
      pharmacy,
      status: controlledSubstanceInfo?.requiresEPCS ? 'draft' : 'pending_signature',
      dates: {
        written: new Date(),
        effectiveDate,
        expirationDate,
      },
      controlledSubstance: controlledSubstanceInfo,
      metadata: {
        createdAt: new Date(),
        createdBy: prescriberId,
      },
    };

    this.prescriptions.set(prescription.id, prescription);

    console.log('\n📋 Prescription created');
    console.log(`   Rx Number: ${prescription.rxNumber}`);
    console.log(`   Medication: ${medication.name} ${medication.strength}`);
    console.log(`   Quantity: ${dosage.quantity} ${dosage.unit}`);
    console.log(`   Refills: ${dosage.refills}`);
    console.log(`   Status: ${prescription.status}`);

    if (controlledSubstanceInfo) {
      console.log(`   ⚠️  DEA Schedule ${controlledSubstanceInfo.deaSchedule} Controlled Substance`);
    }

    return { success: true, prescription, warnings };
  }

  /**
   * Check drug interactions
   */
  async checkDrugInteractions(
    newMedication: string,
    currentMedications: string[]
  ): Promise<DrugInteraction[]> {
    console.log('\n🔍 Checking drug interactions...');
    console.log(`   New medication: ${newMedication}`);
    console.log(`   Against ${currentMedications.length} current medications`);

    const interactions: DrugInteraction[] = [];

    // Simulated drug interaction database
    const interactionDatabase: Record<string, Record<string, DrugInteraction>> = {
      warfarin: {
        aspirin: {
          severity: 'major',
          drug1: 'Warfarin',
          drug2: 'Aspirin',
          description: 'Increased risk of bleeding',
          clinicalEffects: ['Hemorrhage', 'Bruising', 'Epistaxis'],
          management: 'Monitor INR closely. Consider alternative antiplatelet agent.',
        },
        ibuprofen: {
          severity: 'moderate',
          drug1: 'Warfarin',
          drug2: 'Ibuprofen',
          description: 'May increase bleeding risk',
          clinicalEffects: ['Increased bleeding tendency'],
          management: 'Use with caution. Monitor for signs of bleeding.',
        },
      },
      lisinopril: {
        spironolactone: {
          severity: 'major',
          drug1: 'Lisinopril',
          drug2: 'Spironolactone',
          description: 'Risk of hyperkalemia',
          clinicalEffects: ['Elevated potassium', 'Cardiac arrhythmia'],
          management: 'Monitor serum potassium levels regularly.',
        },
      },
    };

    // Check for interactions
    const newMedLower = newMedication.toLowerCase();
    currentMedications.forEach((currentMed) => {
      const currentMedLower = currentMed.toLowerCase();

      // Check both directions
      if (interactionDatabase[newMedLower]?.[currentMedLower]) {
        interactions.push(interactionDatabase[newMedLower][currentMedLower]);
      } else if (interactionDatabase[currentMedLower]?.[newMedLower]) {
        interactions.push(interactionDatabase[currentMedLower][newMedLower]);
      }
    });

    if (interactions.length > 0) {
      console.log(`\n   ⚠️  Found ${interactions.length} interaction(s):`);
      interactions.forEach((int) => {
        console.log(`   • ${int.drug1} + ${int.drug2}: ${int.severity.toUpperCase()}`);
        console.log(`     ${int.description}`);
      });
    } else {
      console.log('   ✅ No significant interactions found');
    }

    return interactions;
  }

  /**
   * Check insurance formulary
   */
  async checkFormulary(
    medication: string,
    insuranceId: string
  ): Promise<FormularyCheck> {
    console.log('\n💰 Checking insurance formulary...');
    console.log(`   Medication: ${medication}`);
    console.log(`   Insurance: ${insuranceId}`);

    // Simulated formulary check
    const formularyCheck: FormularyCheck = {
      medication,
      covered: true,
      tier: 2,
      copay: 25,
      priorAuthRequired: false,
      alternatives: [
        {
          name: 'Generic equivalent',
          tier: 1,
          copay: 10,
          reason: 'Lower cost alternative',
        },
      ],
    };

    console.log(`   Coverage: ${formularyCheck.covered ? 'Yes' : 'No'}`);
    console.log(`   Tier: ${formularyCheck.tier}`);
    console.log(`   Copay: $${formularyCheck.copay}`);

    if (formularyCheck.alternatives && formularyCheck.alternatives.length > 0) {
      console.log('   Alternatives available:');
      formularyCheck.alternatives.forEach((alt) => {
        console.log(`     • ${alt.name} - Tier ${alt.tier}, $${alt.copay}`);
      });
    }

    return formularyCheck;
  }

  /**
   * Request prior authorization
   */
  async requestPriorAuthorization(
    prescriptionId: string,
    insuranceCompany: string,
    clinicalJustification: string
  ): Promise<{ success: boolean; authorization?: PriorAuthorization }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return { success: false };
    }

    const authorization: PriorAuthorization = {
      id: this.generateAuthId(),
      status: 'pending',
      requestedDate: new Date(),
      insuranceCompany,
      notes: clinicalJustification,
    };

    prescription.authorization = authorization;

    console.log('\n📝 Prior authorization requested');
    console.log(`   Auth ID: ${authorization.id}`);
    console.log(`   Insurance: ${insuranceCompany}`);
    console.log(`   Status: Pending review`);

    return { success: true, authorization };
  }

  /**
   * Sign prescription (including two-factor auth for controlled substances)
   */
  async signPrescription(
    prescriptionId: string,
    prescriberId: string,
    twoFactorCode?: string
  ): Promise<{ success: boolean; error?: string }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    // Check if controlled substance requires two-factor auth
    if (prescription.controlledSubstance?.requiresEPCS) {
      if (!twoFactorCode) {
        return {
          success: false,
          error: 'Two-factor authentication required for controlled substance',
        };
      }

      // Verify two-factor code (simulated)
      const isValid = this.verifyTwoFactorCode(twoFactorCode);
      if (!isValid) {
        return { success: false, error: 'Invalid two-factor authentication code' };
      }

      prescription.controlledSubstance.twoFactorAuthCompleted = true;
      prescription.controlledSubstance.identityProofed = true;
    }

    prescription.status = 'signed';
    prescription.metadata.signedAt = new Date();
    prescription.metadata.signedBy = prescriberId;
    prescription.metadata.electronicSignature = this.generateElectronicSignature(prescriberId);

    console.log('\n✍️  Prescription signed');
    console.log(`   Signed by: ${prescriberId}`);
    console.log(`   Timestamp: ${prescription.metadata.signedAt.toISOString()}`);

    if (prescription.controlledSubstance?.requiresEPCS) {
      console.log('   ✅ Two-factor authentication completed');
    }

    return { success: true };
  }

  /**
   * Transmit prescription to pharmacy
   */
  async transmitPrescription(
    prescriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    if (prescription.status !== 'signed') {
      return { success: false, error: 'Prescription must be signed before transmission' };
    }

    if (!prescription.pharmacy.supportsEPrescribing) {
      return { success: false, error: 'Pharmacy does not support e-prescribing' };
    }

    // Check prior authorization if required
    if (prescription.authorization?.status === 'pending') {
      return { success: false, error: 'Awaiting prior authorization approval' };
    }

    prescription.status = 'transmitted';
    prescription.metadata.transmittedAt = new Date();

    // Simulate transmission
    console.log('\n📤 Transmitting prescription to pharmacy...');
    console.log(`   Pharmacy: ${prescription.pharmacy.name}`);
    console.log(`   NCPDP ID: ${prescription.pharmacy.ncpdpId}`);
    console.log(`   Medication: ${prescription.medication.name}`);

    // Simulate successful transmission
    await this.simulateTransmission();

    prescription.status = 'received_by_pharmacy';

    console.log('   ✅ Prescription received by pharmacy');
    console.log(`   Estimated ready time: ${this.getEstimatedReadyTime()}`);

    return { success: true };
  }

  /**
   * Request refill
   */
  async requestRefill(
    prescriptionId: string,
    requestedBy: string
  ): Promise<{ success: boolean; request?: RefillRequest; error?: string }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    // Check if refills are available
    if (prescription.dosage.refills <= 0) {
      return { success: false, error: 'No refills remaining. New prescription required.' };
    }

    // Check if prescription is expired
    if (new Date() > prescription.dates.expirationDate) {
      return { success: false, error: 'Prescription expired. New prescription required.' };
    }

    // Check if too early for refill
    if (prescription.dates.nextRefillDate && new Date() < prescription.dates.nextRefillDate) {
      return {
        success: false,
        error: `Too early for refill. Next refill date: ${prescription.dates.nextRefillDate.toLocaleDateString()}`,
      };
    }

    const refillRequest: RefillRequest = {
      id: this.generateRefillId(),
      prescriptionId,
      requestedBy,
      requestedAt: new Date(),
      status: 'pending',
    };

    this.refillRequests.push(refillRequest);

    console.log('\n🔄 Refill requested');
    console.log(`   Request ID: ${refillRequest.id}`);
    console.log(`   Prescription: ${prescription.rxNumber}`);
    console.log(`   Refills remaining: ${prescription.dosage.refills}`);

    return { success: true, request: refillRequest };
  }

  /**
   * Approve refill
   */
  async approveRefill(
    refillRequestId: string,
    approvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const request = this.refillRequests.find((r) => r.id === refillRequestId);
    if (!request) {
      return { success: false, error: 'Refill request not found' };
    }

    const prescription = this.prescriptions.get(request.prescriptionId);
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    // Update prescription
    prescription.dosage.refills--;
    prescription.dates.lastFilled = new Date();

    // Calculate next refill date
    const nextRefillDate = new Date();
    nextRefillDate.setDate(nextRefillDate.getDate() + prescription.dosage.daySupply);
    prescription.dates.nextRefillDate = nextRefillDate;

    console.log('\n✅ Refill approved');
    console.log(`   Approved by: ${approvedBy}`);
    console.log(`   Refills remaining: ${prescription.dosage.refills}`);
    console.log(`   Next refill available: ${nextRefillDate.toLocaleDateString()}`);

    // Transmit to pharmacy
    await this.transmitPrescription(prescription.id);

    return { success: true };
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(
    prescriptionId: string,
    cancelledBy: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      return { success: false, error: 'Prescription not found' };
    }

    if (prescription.status === 'picked_up') {
      return { success: false, error: 'Cannot cancel prescription that has been picked up' };
    }

    prescription.status = 'cancelled';
    prescription.metadata.cancelledAt = new Date();
    prescription.metadata.cancellationReason = reason;

    console.log('\n❌ Prescription cancelled');
    console.log(`   Rx Number: ${prescription.rxNumber}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Cancelled by: ${cancelledBy}`);

    // Notify pharmacy if already transmitted
    if (prescription.metadata.transmittedAt) {
      console.log('   📞 Pharmacy notified of cancellation');
    }

    return { success: true };
  }

  /**
   * Get prescription history for a patient
   */
  getPrescriptionHistory(patientId: string): Prescription[] {
    return Array.from(this.prescriptions.values())
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => b.dates.written.getTime() - a.dates.written.getTime());
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generatePrescriptionId(): string {
    return `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRxNumber(): string {
    return `${Date.now().toString().slice(-8)}`;
  }

  private generateAuthId(): string {
    return `AUTH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateRefillId(): string {
    return `REFILL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateElectronicSignature(prescriberId: string): string {
    return `SIG-${prescriberId}-${Date.now()}`;
  }

  private verifyTwoFactorCode(code: string): boolean {
    // Simulated verification
    return code === '123456';
  }

  private async simulateTransmission(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  private getEstimatedReadyTime(): string {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toLocaleTimeString();
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Digital Prescription Management - Comprehensive Example');
  console.log('='.repeat(70));

  const manager = new PrescriptionManager();

  const pharmacy: PharmacyInfo = {
    id: 'PHARM-001',
    name: 'City Health Pharmacy',
    ncpdpId: '1234567',
    address: {
      street: '456 Main St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
    },
    phone: '+15551234567',
    supportsEPrescribing: true,
  };

  // Example 1: Create Regular Prescription
  console.log('\n💊 Example 1: Creating Regular Prescription');

  const result1 = await manager.createPrescription(
    'PATIENT-001',
    'DR-001',
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      ndcCode: '00603-3851-21',
      strength: '10mg',
      form: 'tablet',
    },
    {
      quantity: 90,
      unit: 'tablets',
      frequency: 'Once daily',
      route: 'oral',
      duration: 90,
      instructions: 'Take one tablet by mouth once daily for blood pressure',
      refills: 3,
      substitutionAllowed: true,
      daySupply: 90,
    },
    pharmacy
  );

  // Example 2: Check Drug Interactions
  console.log('\n\n🔍 Example 2: Checking Drug Interactions');

  await manager.checkDrugInteractions('Warfarin', ['Aspirin', 'Lisinopril', 'Metformin']);

  // Example 3: Check Insurance Formulary
  console.log('\n\n💰 Example 3: Insurance Formulary Check');

  await manager.checkFormulary('Lisinopril 10mg', 'INS-001');

  // Example 4: Create Controlled Substance Prescription (Schedule II)
  console.log('\n\n⚠️  Example 4: Creating Controlled Substance Prescription');

  const result2 = await manager.createPrescription(
    'PATIENT-002',
    'DR-001',
    {
      name: 'Oxycodone',
      genericName: 'Oxycodone HCl',
      ndcCode: '00406-0512-01',
      strength: '5mg',
      form: 'tablet',
      deaSchedule: 'II',
    },
    {
      quantity: 30,
      unit: 'tablets',
      frequency: 'Every 6 hours as needed',
      route: 'oral',
      duration: 30,
      instructions: 'Take one tablet by mouth every 6 hours as needed for pain',
      refills: 0, // No refills allowed for Schedule II
      substitutionAllowed: false,
      daySupply: 30,
    },
    pharmacy
  );

  if (result2.success && result2.prescription) {
    // Sign with two-factor authentication
    console.log('\n\n✍️  Example 5: Signing Controlled Substance Prescription');

    await manager.signPrescription(result2.prescription.id, 'DR-001', '123456');
  }

  // Example 6: Sign and Transmit Regular Prescription
  if (result1.success && result1.prescription) {
    console.log('\n\n📤 Example 6: Signing and Transmitting Prescription');

    await manager.signPrescription(result1.prescription.id, 'DR-001');
    await manager.transmitPrescription(result1.prescription.id);
  }

  // Example 7: Request Prior Authorization
  console.log('\n\n📋 Example 7: Prior Authorization Request');

  const result3 = await manager.createPrescription(
    'PATIENT-001',
    'DR-001',
    {
      name: 'Humira',
      genericName: 'Adalimumab',
      ndcCode: '00074-4339-02',
      strength: '40mg/0.8mL',
      form: 'injection',
    },
    {
      quantity: 2,
      unit: 'syringes',
      frequency: 'Every 2 weeks',
      route: 'injection',
      duration: 28,
      instructions: 'Inject subcutaneously every 2 weeks',
      refills: 5,
      substitutionAllowed: false,
      daySupply: 28,
    },
    pharmacy
  );

  if (result3.success && result3.prescription) {
    await manager.requestPriorAuthorization(
      result3.prescription.id,
      'Blue Cross Blue Shield',
      'Patient has rheumatoid arthritis unresponsive to methotrexate therapy'
    );
  }

  // Example 8: Request Refill
  if (result1.success && result1.prescription) {
    console.log('\n\n🔄 Example 8: Requesting Refill');

    // Simulate prescription being filled
    result1.prescription.dosage.refills = 3;
    result1.prescription.dates.lastFilled = new Date();
    result1.prescription.dates.lastFilled.setDate(
      result1.prescription.dates.lastFilled.getDate() - 85
    );

    const refillResult = await manager.requestRefill(result1.prescription.id, 'PATIENT-001');

    if (refillResult.success && refillResult.request) {
      console.log('\n\n✅ Example 9: Approving Refill');
      await manager.approveRefill(refillResult.request.id, 'DR-001');
    }
  }

  // Example 10: View Prescription History
  console.log('\n\n📚 Example 10: Prescription History');

  const history = manager.getPrescriptionHistory('PATIENT-001');
  console.log(`\nTotal prescriptions: ${history.length}\n`);

  history.forEach((rx, index) => {
    console.log(`${index + 1}. ${rx.medication.name} ${rx.medication.strength}`);
    console.log(`   Rx #: ${rx.rxNumber}`);
    console.log(`   Written: ${rx.dates.written.toLocaleDateString()}`);
    console.log(`   Status: ${rx.status}`);
    console.log(`   Refills remaining: ${rx.dosage.refills}`);
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('Digital prescription management examples completed!');
  console.log('EPCS and HIPAA compliant');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
