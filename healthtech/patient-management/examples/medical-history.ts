/**
 * Medical History Tracking Example
 *
 * Demonstrates comprehensive medical history management with:
 * - Condition tracking and ICD-10 coding
 * - Medication history and interactions
 * - Allergy management
 * - Family history tracking
 * - Immunization records
 * - Surgical history
 * - Timeline visualization
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface MedicalHistory {
  patientId: string;
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  immunizations: Immunization[];
  surgeries: Surgery[];
  familyHistory: FamilyHistory[];
  socialHistory: SocialHistory;
  lastUpdated: Date;
}

interface Condition {
  id: string;
  name: string;
  icd10Code: string;
  status: 'active' | 'resolved' | 'chronic' | 'in_remission';
  severity: 'mild' | 'moderate' | 'severe';
  diagnosedDate: Date;
  resolvedDate?: Date;
  diagnosedBy: string;
  notes?: string;
  relatedConditions?: string[];
}

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  status: 'active' | 'discontinued' | 'completed';
  prescribedDate: Date;
  prescribedBy: string;
  startDate: Date;
  endDate?: Date;
  reason: string;
  sideEffects?: string[];
  interactions?: MedicationInteraction[];
  refillsRemaining?: number;
}

interface MedicationInteraction {
  medicationId: string;
  medicationName: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

interface Allergy {
  id: string;
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string[];
  diagnosedDate: Date;
  verifiedBy?: string;
  notes?: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  cvxCode?: string; // CDC vaccine code
  administeredDate: Date;
  doseNumber?: number;
  totalDoses?: number;
  manufacturer?: string;
  lotNumber?: string;
  site?: string;
  route?: string;
  administeredBy: string;
  nextDueDate?: Date;
  notes?: string;
}

interface Surgery {
  id: string;
  procedure: string;
  cptCode?: string; // Current Procedural Terminology
  surgeryDate: Date;
  surgeon: string;
  facility: string;
  indication: string;
  outcome: 'successful' | 'complicated' | 'failed';
  complications?: string[];
  notes?: string;
}

interface FamilyHistory {
  id: string;
  relationship: 'parent' | 'sibling' | 'grandparent' | 'aunt_uncle' | 'cousin';
  condition: string;
  icd10Code?: string;
  ageOfOnset?: number;
  isDeceased: boolean;
  causeOfDeath?: string;
  notes?: string;
}

interface SocialHistory {
  smokingStatus: 'never' | 'former' | 'current';
  smokingDetails?: {
    packsPerDay?: number;
    yearsSmoked?: number;
    quitDate?: Date;
  };
  alcoholUse: 'never' | 'occasional' | 'moderate' | 'heavy';
  alcoholDetails?: {
    drinksPerWeek?: number;
  };
  drugUse: 'never' | 'former' | 'current';
  drugDetails?: {
    substances?: string[];
    lastUse?: Date;
  };
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
  occupation?: string;
  maritalStatus?: string;
  livingArrangement?: string;
}

interface HistoryTimeline {
  date: Date;
  type: 'condition' | 'medication' | 'surgery' | 'immunization' | 'allergy';
  event: string;
  details: string;
}

interface RiskAssessment {
  condition: string;
  risk: 'low' | 'moderate' | 'high';
  factors: string[];
  recommendations: string[];
}

// ============================================================================
// Medical History Manager
// ============================================================================

class MedicalHistoryManager {
  private histories: Map<string, MedicalHistory> = new Map();

  /**
   * Initialize or get medical history for a patient
   */
  getOrCreateHistory(patientId: string): MedicalHistory {
    let history = this.histories.get(patientId);

    if (!history) {
      history = {
        patientId,
        conditions: [],
        medications: [],
        allergies: [],
        immunizations: [],
        surgeries: [],
        familyHistory: [],
        socialHistory: {
          smokingStatus: 'never',
          alcoholUse: 'never',
          drugUse: 'never',
        },
        lastUpdated: new Date(),
      };
      this.histories.set(patientId, history);
    }

    return history;
  }

  /**
   * Add a new condition
   */
  addCondition(
    patientId: string,
    condition: Omit<Condition, 'id'>
  ): { success: boolean; condition?: Condition } {
    const history = this.getOrCreateHistory(patientId);

    const newCondition: Condition = {
      id: this.generateId(),
      ...condition,
    };

    history.conditions.push(newCondition);
    history.lastUpdated = new Date();

    console.log('\n✅ Condition added to medical history');
    console.log(`   Condition: ${newCondition.name}`);
    console.log(`   ICD-10: ${newCondition.icd10Code}`);
    console.log(`   Status: ${newCondition.status}`);
    console.log(`   Severity: ${newCondition.severity}`);

    return { success: true, condition: newCondition };
  }

  /**
   * Update condition status
   */
  updateConditionStatus(
    patientId: string,
    conditionId: string,
    status: Condition['status'],
    resolvedDate?: Date
  ): { success: boolean; error?: string } {
    const history = this.getOrCreateHistory(patientId);
    const condition = history.conditions.find((c) => c.id === conditionId);

    if (!condition) {
      return { success: false, error: 'Condition not found' };
    }

    condition.status = status;
    if (status === 'resolved' && resolvedDate) {
      condition.resolvedDate = resolvedDate;
    }
    history.lastUpdated = new Date();

    console.log(`✅ Condition status updated: ${condition.name} → ${status}`);

    return { success: true };
  }

  /**
   * Add medication with interaction checking
   */
  addMedication(
    patientId: string,
    medication: Omit<Medication, 'id' | 'interactions'>
  ): { success: boolean; medication?: Medication; warnings?: string[] } {
    const history = this.getOrCreateHistory(patientId);

    const newMedication: Medication = {
      id: this.generateId(),
      ...medication,
      interactions: [],
    };

    // Check for drug interactions
    const interactions = this.checkDrugInteractions(newMedication, history.medications);
    newMedication.interactions = interactions;

    const warnings: string[] = [];

    // Check for allergies
    const allergyWarnings = this.checkAllergyConflicts(newMedication, history.allergies);
    warnings.push(...allergyWarnings);

    // Add interaction warnings
    const severeInteractions = interactions.filter((i) => i.severity === 'major');
    if (severeInteractions.length > 0) {
      warnings.push(
        `⚠️  Major drug interaction with: ${severeInteractions.map((i) => i.medicationName).join(', ')}`
      );
    }

    history.medications.push(newMedication);
    history.lastUpdated = new Date();

    console.log('\n💊 Medication added to history');
    console.log(`   Name: ${newMedication.name}`);
    console.log(`   Dosage: ${newMedication.dosage}`);
    console.log(`   Frequency: ${newMedication.frequency}`);

    if (warnings.length > 0) {
      console.log('\n   Warnings:');
      warnings.forEach((w) => console.log(`   ${w}`));
    }

    return { success: true, medication: newMedication, warnings };
  }

  /**
   * Discontinue medication
   */
  discontinueMedication(
    patientId: string,
    medicationId: string,
    endDate: Date,
    reason?: string
  ): { success: boolean; error?: string } {
    const history = this.getOrCreateHistory(patientId);
    const medication = history.medications.find((m) => m.id === medicationId);

    if (!medication) {
      return { success: false, error: 'Medication not found' };
    }

    medication.status = 'discontinued';
    medication.endDate = endDate;
    if (reason) {
      medication.notes = (medication.notes || '') + `\nDiscontinued: ${reason}`;
    }
    history.lastUpdated = new Date();

    console.log(`✅ Medication discontinued: ${medication.name}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

    return { success: true };
  }

  /**
   * Add allergy
   */
  addAllergy(
    patientId: string,
    allergy: Omit<Allergy, 'id'>
  ): { success: boolean; allergy?: Allergy; warnings?: string[] } {
    const history = this.getOrCreateHistory(patientId);

    const newAllergy: Allergy = {
      id: this.generateId(),
      ...allergy,
    };

    history.allergies.push(newAllergy);
    history.lastUpdated = new Date();

    // Check current medications for conflicts
    const warnings: string[] = [];
    if (allergy.type === 'drug') {
      const conflictingMeds = history.medications.filter(
        (m) =>
          m.status === 'active' &&
          (m.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
            m.genericName?.toLowerCase().includes(allergy.allergen.toLowerCase()))
      );

      if (conflictingMeds.length > 0) {
        warnings.push(
          `⚠️  Patient is currently taking: ${conflictingMeds.map((m) => m.name).join(', ')}`
        );
      }
    }

    console.log('\n⚠️  Allergy added to medical history');
    console.log(`   Allergen: ${newAllergy.allergen}`);
    console.log(`   Type: ${newAllergy.type}`);
    console.log(`   Severity: ${newAllergy.severity}`);
    console.log(`   Reactions: ${newAllergy.reaction.join(', ')}`);

    if (warnings.length > 0) {
      console.log('\n   ⚠️  WARNINGS:');
      warnings.forEach((w) => console.log(`   ${w}`));
    }

    return { success: true, allergy: newAllergy, warnings };
  }

  /**
   * Add immunization record
   */
  addImmunization(
    patientId: string,
    immunization: Omit<Immunization, 'id'>
  ): { success: boolean; immunization?: Immunization } {
    const history = this.getOrCreateHistory(patientId);

    const newImmunization: Immunization = {
      id: this.generateId(),
      ...immunization,
    };

    history.immunizations.push(newImmunization);
    history.lastUpdated = new Date();

    console.log('\n💉 Immunization recorded');
    console.log(`   Vaccine: ${newImmunization.vaccine}`);
    console.log(`   Date: ${newImmunization.administeredDate.toLocaleDateString()}`);
    if (newImmunization.doseNumber && newImmunization.totalDoses) {
      console.log(`   Dose: ${newImmunization.doseNumber} of ${newImmunization.totalDoses}`);
    }
    if (newImmunization.nextDueDate) {
      console.log(`   Next due: ${newImmunization.nextDueDate.toLocaleDateString()}`);
    }

    return { success: true, immunization: newImmunization };
  }

  /**
   * Add surgical history
   */
  addSurgery(
    patientId: string,
    surgery: Omit<Surgery, 'id'>
  ): { success: boolean; surgery?: Surgery } {
    const history = this.getOrCreateHistory(patientId);

    const newSurgery: Surgery = {
      id: this.generateId(),
      ...surgery,
    };

    history.surgeries.push(newSurgery);
    history.lastUpdated = new Date();

    console.log('\n🏥 Surgical history recorded');
    console.log(`   Procedure: ${newSurgery.procedure}`);
    console.log(`   Date: ${newSurgery.surgeryDate.toLocaleDateString()}`);
    console.log(`   Surgeon: ${newSurgery.surgeon}`);
    console.log(`   Outcome: ${newSurgery.outcome}`);
    if (newSurgery.complications && newSurgery.complications.length > 0) {
      console.log(`   Complications: ${newSurgery.complications.join(', ')}`);
    }

    return { success: true, surgery: newSurgery };
  }

  /**
   * Add family history
   */
  addFamilyHistory(
    patientId: string,
    familyHistory: Omit<FamilyHistory, 'id'>
  ): { success: boolean; familyHistory?: FamilyHistory } {
    const history = this.getOrCreateHistory(patientId);

    const newFamilyHistory: FamilyHistory = {
      id: this.generateId(),
      ...familyHistory,
    };

    history.familyHistory.push(newFamilyHistory);
    history.lastUpdated = new Date();

    console.log('\n👨‍👩‍👧‍👦 Family history recorded');
    console.log(`   Relationship: ${newFamilyHistory.relationship}`);
    console.log(`   Condition: ${newFamilyHistory.condition}`);
    if (newFamilyHistory.ageOfOnset) {
      console.log(`   Age of onset: ${newFamilyHistory.ageOfOnset}`);
    }

    return { success: true, familyHistory: newFamilyHistory };
  }

  /**
   * Update social history
   */
  updateSocialHistory(
    patientId: string,
    socialHistory: Partial<SocialHistory>
  ): { success: boolean } {
    const history = this.getOrCreateHistory(patientId);

    history.socialHistory = {
      ...history.socialHistory,
      ...socialHistory,
    };
    history.lastUpdated = new Date();

    console.log('✅ Social history updated');

    return { success: true };
  }

  /**
   * Get active conditions
   */
  getActiveConditions(patientId: string): Condition[] {
    const history = this.getOrCreateHistory(patientId);
    return history.conditions.filter(
      (c) => c.status === 'active' || c.status === 'chronic'
    );
  }

  /**
   * Get active medications
   */
  getActiveMedications(patientId: string): Medication[] {
    const history = this.getOrCreateHistory(patientId);
    return history.medications.filter((m) => m.status === 'active');
  }

  /**
   * Generate timeline of medical events
   */
  generateTimeline(patientId: string): HistoryTimeline[] {
    const history = this.getOrCreateHistory(patientId);
    const timeline: HistoryTimeline[] = [];

    // Add conditions
    history.conditions.forEach((c) => {
      timeline.push({
        date: c.diagnosedDate,
        type: 'condition',
        event: `Diagnosed: ${c.name}`,
        details: `ICD-10: ${c.icd10Code}, Severity: ${c.severity}`,
      });
    });

    // Add medications
    history.medications.forEach((m) => {
      timeline.push({
        date: m.startDate,
        type: 'medication',
        event: `Started: ${m.name}`,
        details: `${m.dosage} ${m.frequency}`,
      });
      if (m.endDate) {
        timeline.push({
          date: m.endDate,
          type: 'medication',
          event: `Stopped: ${m.name}`,
          details: `Status: ${m.status}`,
        });
      }
    });

    // Add surgeries
    history.surgeries.forEach((s) => {
      timeline.push({
        date: s.surgeryDate,
        type: 'surgery',
        event: `Surgery: ${s.procedure}`,
        details: `Outcome: ${s.outcome}`,
      });
    });

    // Add immunizations
    history.immunizations.forEach((i) => {
      timeline.push({
        date: i.administeredDate,
        type: 'immunization',
        event: `Vaccine: ${i.vaccine}`,
        details: i.doseNumber ? `Dose ${i.doseNumber}` : '',
      });
    });

    // Sort by date
    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

    return timeline;
  }

  /**
   * Assess disease risk based on family history
   */
  assessFamilyRisk(patientId: string): RiskAssessment[] {
    const history = this.getOrCreateHistory(patientId);
    const assessments: RiskAssessment[] = [];

    // Group family history by condition
    const conditionGroups = new Map<string, FamilyHistory[]>();
    history.familyHistory.forEach((fh) => {
      const existing = conditionGroups.get(fh.condition) || [];
      existing.push(fh);
      conditionGroups.set(fh.condition, existing);
    });

    // Assess risk for each condition
    conditionGroups.forEach((relatives, condition) => {
      const factors: string[] = [];
      let risk: 'low' | 'moderate' | 'high' = 'low';

      // Check number of affected relatives
      const firstDegreeRelatives = relatives.filter(
        (r) => r.relationship === 'parent' || r.relationship === 'sibling'
      );

      if (firstDegreeRelatives.length >= 2) {
        risk = 'high';
        factors.push(`Multiple first-degree relatives affected (${firstDegreeRelatives.length})`);
      } else if (firstDegreeRelatives.length === 1) {
        risk = 'moderate';
        factors.push('One first-degree relative affected');
      } else if (relatives.length >= 2) {
        risk = 'moderate';
        factors.push(`Multiple relatives affected (${relatives.length})`);
      } else {
        risk = 'low';
        factors.push('One relative affected');
      }

      // Check age of onset
      const earlyOnset = relatives.filter((r) => r.ageOfOnset && r.ageOfOnset < 50);
      if (earlyOnset.length > 0) {
        risk = risk === 'moderate' ? 'high' : risk === 'low' ? 'moderate' : risk;
        factors.push('Early onset in family member');
      }

      const recommendations: string[] = [];
      if (risk === 'high') {
        recommendations.push('Consider genetic counseling');
        recommendations.push('Schedule regular screening');
        recommendations.push('Discuss preventive measures with physician');
      } else if (risk === 'moderate') {
        recommendations.push('Discuss screening schedule with physician');
        recommendations.push('Maintain healthy lifestyle');
      } else {
        recommendations.push('Standard screening recommendations');
      }

      assessments.push({
        condition,
        risk,
        factors,
        recommendations,
      });
    });

    return assessments;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private checkDrugInteractions(
    newMed: Medication,
    currentMeds: Medication[]
  ): MedicationInteraction[] {
    const interactions: MedicationInteraction[] = [];

    // Simulated interaction database
    const knownInteractions: Record<string, { drug: string; severity: MedicationInteraction['severity']; description: string }[]> = {
      warfarin: [
        {
          drug: 'aspirin',
          severity: 'major',
          description: 'Increased bleeding risk',
        },
        {
          drug: 'ibuprofen',
          severity: 'moderate',
          description: 'May increase bleeding risk',
        },
      ],
      metformin: [
        {
          drug: 'alcohol',
          severity: 'moderate',
          description: 'May increase risk of lactic acidosis',
        },
      ],
    };

    const newMedLower = newMed.name.toLowerCase();
    currentMeds
      .filter((m) => m.status === 'active')
      .forEach((med) => {
        const medLower = med.name.toLowerCase();

        // Check both directions
        const interactions1 = knownInteractions[newMedLower] || [];
        const interactions2 = knownInteractions[medLower] || [];

        interactions1.forEach((int) => {
          if (medLower.includes(int.drug)) {
            interactions.push({
              medicationId: med.id,
              medicationName: med.name,
              severity: int.severity,
              description: int.description,
            });
          }
        });

        interactions2.forEach((int) => {
          if (newMedLower.includes(int.drug)) {
            interactions.push({
              medicationId: med.id,
              medicationName: med.name,
              severity: int.severity,
              description: int.description,
            });
          }
        });
      });

    return interactions;
  }

  private checkAllergyConflicts(medication: Medication, allergies: Allergy[]): string[] {
    const warnings: string[] = [];

    allergies
      .filter((a) => a.type === 'drug')
      .forEach((allergy) => {
        if (
          medication.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
          medication.genericName?.toLowerCase().includes(allergy.allergen.toLowerCase())
        ) {
          warnings.push(
            `⚠️  ALLERGY ALERT: Patient is allergic to ${allergy.allergen} (${allergy.severity})`
          );
        }
      });

    return warnings;
  }

  private generateId(): string {
    return `HIST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Medical History Tracking - Comprehensive Example');
  console.log('='.repeat(70));

  const manager = new MedicalHistoryManager();
  const patientId = 'PATIENT-001';

  // Example 1: Add Conditions
  console.log('\n🏥 Example 1: Recording Medical Conditions');

  manager.addCondition(patientId, {
    name: 'Hypertension',
    icd10Code: 'I10',
    status: 'chronic',
    severity: 'moderate',
    diagnosedDate: new Date('2020-03-15'),
    diagnosedBy: 'DR-001',
    notes: 'Well controlled with medication',
  });

  manager.addCondition(patientId, {
    name: 'Type 2 Diabetes Mellitus',
    icd10Code: 'E11.9',
    status: 'chronic',
    severity: 'moderate',
    diagnosedDate: new Date('2019-11-20'),
    diagnosedBy: 'DR-001',
  });

  // Example 2: Add Medications with Interaction Checking
  console.log('\n\n💊 Example 2: Managing Medications');

  manager.addMedication(patientId, {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    route: 'oral',
    status: 'active',
    prescribedDate: new Date('2020-03-15'),
    prescribedBy: 'DR-001',
    startDate: new Date('2020-03-15'),
    reason: 'Hypertension management',
    refillsRemaining: 3,
  });

  manager.addMedication(patientId, {
    name: 'Metformin',
    genericName: 'Metformin HCl',
    dosage: '500mg',
    frequency: 'Twice daily',
    route: 'oral',
    status: 'active',
    prescribedDate: new Date('2019-11-20'),
    prescribedBy: 'DR-001',
    startDate: new Date('2019-11-20'),
    reason: 'Type 2 Diabetes management',
    refillsRemaining: 5,
  });

  // Example 3: Add Allergy (will check for conflicts)
  console.log('\n\n⚠️  Example 3: Recording Allergies');

  manager.addAllergy(patientId, {
    allergen: 'Penicillin',
    type: 'drug',
    severity: 'severe',
    reaction: ['Hives', 'Difficulty breathing', 'Swelling'],
    diagnosedDate: new Date('2015-06-10'),
    verifiedBy: 'DR-002',
  });

  manager.addAllergy(patientId, {
    allergen: 'Peanuts',
    type: 'food',
    severity: 'life_threatening',
    reaction: ['Anaphylaxis'],
    diagnosedDate: new Date('2010-01-01'),
  });

  // Example 4: Add Immunization Records
  console.log('\n\n💉 Example 4: Immunization Records');

  manager.addImmunization(patientId, {
    vaccine: 'Influenza',
    cvxCode: '141',
    administeredDate: new Date('2024-10-15'),
    manufacturer: 'Moderna',
    lotNumber: 'FLU2024A',
    site: 'Left deltoid',
    route: 'Intramuscular',
    administeredBy: 'NURSE-001',
    nextDueDate: new Date('2025-10-15'),
  });

  manager.addImmunization(patientId, {
    vaccine: 'COVID-19 mRNA',
    cvxCode: '208',
    administeredDate: new Date('2024-09-01'),
    doseNumber: 1,
    totalDoses: 2,
    manufacturer: 'Pfizer',
    lotNumber: 'COVID2024B',
    administeredBy: 'NURSE-002',
    nextDueDate: new Date('2024-10-01'),
  });

  // Example 5: Add Surgical History
  console.log('\n\n🏥 Example 5: Surgical History');

  manager.addSurgery(patientId, {
    procedure: 'Appendectomy',
    cptCode: '44950',
    surgeryDate: new Date('2018-05-20'),
    surgeon: 'DR-SURGEON-001',
    facility: 'City General Hospital',
    indication: 'Acute appendicitis',
    outcome: 'successful',
    notes: 'Laparoscopic procedure, uncomplicated recovery',
  });

  // Example 6: Add Family History
  console.log('\n\n👨‍👩‍👧‍👦 Example 6: Family History');

  manager.addFamilyHistory(patientId, {
    relationship: 'parent',
    condition: 'Coronary Artery Disease',
    icd10Code: 'I25.1',
    ageOfOnset: 55,
    isDeceased: true,
    causeOfDeath: 'Myocardial Infarction',
  });

  manager.addFamilyHistory(patientId, {
    relationship: 'parent',
    condition: 'Type 2 Diabetes',
    icd10Code: 'E11.9',
    ageOfOnset: 50,
    isDeceased: false,
  });

  manager.addFamilyHistory(patientId, {
    relationship: 'sibling',
    condition: 'Breast Cancer',
    icd10Code: 'C50.9',
    ageOfOnset: 42,
    isDeceased: false,
  });

  // Example 7: Update Social History
  console.log('\n\n📋 Example 7: Social History');

  manager.updateSocialHistory(patientId, {
    smokingStatus: 'former',
    smokingDetails: {
      packsPerDay: 1,
      yearsSmoked: 15,
      quitDate: new Date('2015-01-01'),
    },
    alcoholUse: 'moderate',
    alcoholDetails: {
      drinksPerWeek: 5,
    },
    drugUse: 'never',
    exerciseFrequency: 'moderate',
    occupation: 'Software Engineer',
    maritalStatus: 'Married',
  });

  // Example 8: Get Active Conditions and Medications
  console.log('\n\n📊 Example 8: Current Medical Status');

  const activeConditions = manager.getActiveConditions(patientId);
  console.log(`\nActive Conditions (${activeConditions.length}):`);
  activeConditions.forEach((c) => {
    console.log(`   • ${c.name} (${c.icd10Code}) - ${c.severity}`);
  });

  const activeMeds = manager.getActiveMedications(patientId);
  console.log(`\nActive Medications (${activeMeds.length}):`);
  activeMeds.forEach((m) => {
    console.log(`   • ${m.name} - ${m.dosage} ${m.frequency}`);
  });

  // Example 9: Generate Timeline
  console.log('\n\n📅 Example 9: Medical History Timeline');

  const timeline = manager.generateTimeline(patientId);
  console.log(`\nTimeline (${timeline.length} events):\n`);
  timeline.slice(0, 10).forEach((event) => {
    const icon =
      event.type === 'condition'
        ? '🏥'
        : event.type === 'medication'
          ? '💊'
          : event.type === 'surgery'
            ? '🔪'
            : '💉';
    console.log(`   ${icon} ${event.date.toLocaleDateString()} - ${event.event}`);
    console.log(`      ${event.details}`);
  });

  // Example 10: Risk Assessment Based on Family History
  console.log('\n\n⚕️  Example 10: Family History Risk Assessment');

  const riskAssessments = manager.assessFamilyRisk(patientId);
  console.log(`\nIdentified ${riskAssessments.length} potential hereditary risks:\n`);

  riskAssessments.forEach((assessment) => {
    const riskIcon =
      assessment.risk === 'high' ? '🔴' : assessment.risk === 'moderate' ? '🟡' : '🟢';
    console.log(`${riskIcon} ${assessment.condition} - ${assessment.risk.toUpperCase()} RISK`);
    console.log('   Risk Factors:');
    assessment.factors.forEach((f) => console.log(`     • ${f}`));
    console.log('   Recommendations:');
    assessment.recommendations.forEach((r) => console.log(`     • ${r}`));
    console.log('');
  });

  console.log('='.repeat(70));
  console.log('Medical history tracking examples completed!');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
