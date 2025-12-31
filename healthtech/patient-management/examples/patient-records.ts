/**
 * Patient Records Management Example
 *
 * Demonstrates HIPAA-compliant CRUD operations for patient records with:
 * - Data encryption for PHI (Protected Health Information)
 * - Audit logging for all operations
 * - Access control and authorization
 * - Data validation and sanitization
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  demographics: PatientDemographics;
  contact: ContactInformation;
  insurance?: InsuranceInformation[];
  emergencyContacts: EmergencyContact[];
  metadata: RecordMetadata;
}

interface PatientDemographics {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  race?: string;
  ethnicity?: string;
  preferredLanguage?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'other';
}

interface ContactInformation {
  email?: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface InsuranceInformation {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberId: string;
  subscriberRelationship: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  expirationDate?: Date;
  isPrimary: boolean;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface RecordMetadata {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
  encryptionKeyId?: string;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  resourceType: 'patient';
  resourceId: string;
  ipAddress: string;
  userAgent?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  success: boolean;
  errorMessage?: string;
}

interface AccessControl {
  userId: string;
  role: 'doctor' | 'nurse' | 'admin' | 'billing' | 'receptionist';
  permissions: Permission[];
  facilities: string[];
}

type Permission = 'read' | 'write' | 'delete' | 'export' | 'share';

// ============================================================================
// HIPAA-Compliant Patient Record Manager
// ============================================================================

class PatientRecordManager {
  private auditLogs: AuditLog[] = [];
  private encryptionEnabled = true;

  /**
   * Create a new patient record with encryption and audit logging
   */
  async createPatient(
    patientData: Omit<Patient, 'id' | 'metadata'>,
    userId: string,
    accessControl: AccessControl
  ): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    const auditEntry: Partial<AuditLog> = {
      timestamp: new Date(),
      userId,
      action: 'create',
      resourceType: 'patient',
      ipAddress: '192.168.1.1', // Would come from request
    };

    try {
      // Check permissions
      if (!this.hasPermission(accessControl, 'write')) {
        throw new Error('Insufficient permissions to create patient records');
      }

      // Validate patient data
      this.validatePatientData(patientData);

      // Generate unique identifiers
      const patient: Patient = {
        id: this.generateUUID(),
        mrn: this.generateMRN(),
        ...patientData,
        metadata: {
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
          updatedBy: userId,
          version: 1,
          encryptionKeyId: this.encryptionEnabled ? this.generateKeyId() : undefined,
        },
      };

      // Encrypt sensitive data (PHI)
      const encryptedPatient = this.encryptionEnabled
        ? await this.encryptPHI(patient)
        : patient;

      // Store patient record (would be database operation)
      console.log('✅ Patient record created successfully');
      console.log(`   MRN: ${patient.mrn}`);
      console.log(`   Name: ${patient.demographics.firstName} ${patient.demographics.lastName}`);

      // Log successful audit entry
      this.logAudit({
        ...auditEntry,
        resourceId: patient.id,
        success: true,
      } as AuditLog);

      return { success: true, patient: encryptedPatient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed audit entry
      this.logAudit({
        ...auditEntry,
        resourceId: 'N/A',
        success: false,
        errorMessage,
      } as AuditLog);

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Read patient record with authorization check
   */
  async readPatient(
    patientId: string,
    userId: string,
    accessControl: AccessControl
  ): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    const auditEntry: Partial<AuditLog> = {
      timestamp: new Date(),
      userId,
      action: 'read',
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress: '192.168.1.1',
    };

    try {
      // Check permissions
      if (!this.hasPermission(accessControl, 'read')) {
        throw new Error('Insufficient permissions to read patient records');
      }

      // Retrieve patient (would be database operation)
      const encryptedPatient = await this.fetchPatientFromDB(patientId);

      if (!encryptedPatient) {
        throw new Error('Patient not found');
      }

      // Decrypt sensitive data
      const patient = this.encryptionEnabled
        ? await this.decryptPHI(encryptedPatient)
        : encryptedPatient;

      // Log successful access
      this.logAudit({ ...auditEntry, success: true } as AuditLog);

      return { success: true, patient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logAudit({ ...auditEntry, success: false, errorMessage } as AuditLog);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update patient record with change tracking
   */
  async updatePatient(
    patientId: string,
    updates: Partial<Omit<Patient, 'id' | 'mrn' | 'metadata'>>,
    userId: string,
    accessControl: AccessControl
  ): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    const auditEntry: Partial<AuditLog> = {
      timestamp: new Date(),
      userId,
      action: 'update',
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress: '192.168.1.1',
    };

    try {
      // Check permissions
      if (!this.hasPermission(accessControl, 'write')) {
        throw new Error('Insufficient permissions to update patient records');
      }

      // Fetch current patient record
      const currentPatient = await this.fetchPatientFromDB(patientId);
      if (!currentPatient) {
        throw new Error('Patient not found');
      }

      // Track changes for audit
      const changes = this.trackChanges(currentPatient, updates);

      // Apply updates
      const updatedPatient: Patient = {
        ...currentPatient,
        ...updates,
        metadata: {
          ...currentPatient.metadata,
          updatedAt: new Date(),
          updatedBy: userId,
          version: currentPatient.metadata.version + 1,
        },
      };

      // Validate updated data
      this.validatePatientData(updatedPatient);

      // Encrypt and store
      const encryptedPatient = this.encryptionEnabled
        ? await this.encryptPHI(updatedPatient)
        : updatedPatient;

      console.log('✅ Patient record updated successfully');
      console.log(`   MRN: ${updatedPatient.mrn}`);
      console.log(`   Version: ${updatedPatient.metadata.version}`);

      // Log with change tracking
      this.logAudit({
        ...auditEntry,
        success: true,
        changes,
      } as AuditLog);

      return { success: true, patient: encryptedPatient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logAudit({ ...auditEntry, success: false, errorMessage } as AuditLog);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete patient record (soft delete with retention policy)
   */
  async deletePatient(
    patientId: string,
    userId: string,
    accessControl: AccessControl
  ): Promise<{ success: boolean; error?: string }> {
    const auditEntry: Partial<AuditLog> = {
      timestamp: new Date(),
      userId,
      action: 'delete',
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress: '192.168.1.1',
    };

    try {
      // Check permissions (delete requires elevated access)
      if (!this.hasPermission(accessControl, 'delete')) {
        throw new Error('Insufficient permissions to delete patient records');
      }

      // Fetch patient to verify existence
      const patient = await this.fetchPatientFromDB(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Soft delete (HIPAA requires retention)
      // In production, this would mark as deleted but preserve data
      console.log('✅ Patient record marked for deletion');
      console.log(`   MRN: ${patient.mrn}`);
      console.log('   Note: Data retained per HIPAA retention requirements');

      this.logAudit({ ...auditEntry, success: true } as AuditLog);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logAudit({ ...auditEntry, success: false, errorMessage } as AuditLog);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Search patients with field-level access control
   */
  async searchPatients(
    criteria: {
      name?: string;
      mrn?: string;
      dateOfBirth?: Date;
      phone?: string;
    },
    userId: string,
    accessControl: AccessControl
  ): Promise<{ success: boolean; patients?: Patient[]; error?: string }> {
    try {
      if (!this.hasPermission(accessControl, 'read')) {
        throw new Error('Insufficient permissions to search patient records');
      }

      // Search would be database operation with indexed fields
      const results = await this.searchPatientsInDB(criteria);

      // Decrypt results
      const patients = this.encryptionEnabled
        ? await Promise.all(results.map((p) => this.decryptPHI(p)))
        : results;

      // Log search operation
      this.logAudit({
        id: this.generateUUID(),
        timestamp: new Date(),
        userId,
        action: 'read',
        resourceType: 'patient',
        resourceId: 'search',
        ipAddress: '192.168.1.1',
        success: true,
      });

      return { success: true, patients };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Export patient data (for patient right to access)
   */
  async exportPatientData(
    patientId: string,
    userId: string,
    accessControl: AccessControl,
    format: 'json' | 'pdf' | 'hl7'
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    const auditEntry: Partial<AuditLog> = {
      timestamp: new Date(),
      userId,
      action: 'export',
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress: '192.168.1.1',
    };

    try {
      if (!this.hasPermission(accessControl, 'export')) {
        throw new Error('Insufficient permissions to export patient data');
      }

      const result = await this.readPatient(patientId, userId, accessControl);
      if (!result.success || !result.patient) {
        throw new Error(result.error || 'Failed to retrieve patient');
      }

      // Format data based on requested format
      let exportData: string;
      switch (format) {
        case 'json':
          exportData = JSON.stringify(result.patient, null, 2);
          break;
        case 'pdf':
          exportData = this.generatePDF(result.patient);
          break;
        case 'hl7':
          exportData = this.generateHL7(result.patient);
          break;
      }

      console.log(`✅ Patient data exported as ${format.toUpperCase()}`);

      this.logAudit({ ...auditEntry, success: true } as AuditLog);

      return { success: true, data: exportData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logAudit({ ...auditEntry, success: false, errorMessage } as AuditLog);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get audit trail for a patient
   */
  getAuditTrail(patientId: string): AuditLog[] {
    return this.auditLogs.filter((log) => log.resourceId === patientId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private hasPermission(accessControl: AccessControl, permission: Permission): boolean {
    return accessControl.permissions.includes(permission);
  }

  private validatePatientData(patient: Partial<Patient>): void {
    if (patient.demographics) {
      if (!patient.demographics.firstName?.trim()) {
        throw new Error('First name is required');
      }
      if (!patient.demographics.lastName?.trim()) {
        throw new Error('Last name is required');
      }
      if (!patient.demographics.dateOfBirth) {
        throw new Error('Date of birth is required');
      }
    }

    if (patient.contact) {
      if (!patient.contact.phone?.match(/^\+?[1-9]\d{1,14}$/)) {
        throw new Error('Invalid phone number format');
      }
      if (patient.contact.email && !patient.contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email format');
      }
    }
  }

  private async encryptPHI(patient: Patient): Promise<Patient> {
    // In production, use proper encryption (AES-256)
    console.log('🔒 Encrypting PHI with AES-256');
    return patient; // Simulated
  }

  private async decryptPHI(patient: Patient): Promise<Patient> {
    // In production, use proper decryption
    console.log('🔓 Decrypting PHI');
    return patient; // Simulated
  }

  private trackChanges(
    current: Patient,
    updates: Partial<Patient>
  ): Record<string, { old: unknown; new: unknown }> {
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = current[key as keyof Patient];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    return changes;
  }

  private logAudit(entry: AuditLog): void {
    this.auditLogs.push({
      id: this.generateUUID(),
      ...entry,
    });
    console.log(`📝 Audit log: ${entry.action} ${entry.resourceType} - ${entry.success ? 'SUCCESS' : 'FAILED'}`);
  }

  private generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMRN(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `MRN-${timestamp}-${random}`;
  }

  private generateKeyId(): string {
    return `KEY-${Date.now()}`;
  }

  private async fetchPatientFromDB(patientId: string): Promise<Patient | null> {
    // Simulated database fetch
    return null;
  }

  private async searchPatientsInDB(criteria: unknown): Promise<Patient[]> {
    // Simulated database search
    return [];
  }

  private generatePDF(patient: Patient): string {
    return `PDF export for ${patient.demographics.firstName} ${patient.demographics.lastName}`;
  }

  private generateHL7(patient: Patient): string {
    return `HL7|${patient.mrn}|${patient.demographics.firstName}|${patient.demographics.lastName}`;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Patient Records Management - HIPAA Compliant Example');
  console.log('='.repeat(70));

  const manager = new PatientRecordManager();

  // Set up access control
  const doctorAccess: AccessControl = {
    userId: 'DR-12345',
    role: 'doctor',
    permissions: ['read', 'write', 'export'],
    facilities: ['FACILITY-001'],
  };

  const adminAccess: AccessControl = {
    userId: 'ADMIN-67890',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'export', 'share'],
    facilities: ['FACILITY-001', 'FACILITY-002'],
  };

  // Example 1: Create Patient Record
  console.log('\n📋 Example 1: Creating Patient Record\n');

  const newPatient = {
    demographics: {
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'female' as const,
      preferredLanguage: 'English',
      maritalStatus: 'married' as const,
    },
    contact: {
      email: 'jane.smith@email.com',
      phone: '+15551234567',
      address: {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA',
      },
    },
    insurance: [
      {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BCBS-123456',
        subscriberId: 'SUB-789012',
        subscriberRelationship: 'self' as const,
        effectiveDate: new Date('2024-01-01'),
        isPrimary: true,
      },
    ],
    emergencyContacts: [
      {
        name: 'John Smith',
        relationship: 'Spouse',
        phone: '+15559876543',
        email: 'john.smith@email.com',
      },
    ],
  };

  const createResult = await manager.createPatient(newPatient, 'DR-12345', doctorAccess);

  if (createResult.success && createResult.patient) {
    console.log('\n✨ Patient Created:');
    console.log(`   ID: ${createResult.patient.id}`);
    console.log(`   MRN: ${createResult.patient.mrn}`);
    console.log(`   Name: ${createResult.patient.demographics.firstName} ${createResult.patient.demographics.lastName}`);
    console.log(`   DOB: ${createResult.patient.demographics.dateOfBirth.toLocaleDateString()}`);

    // Example 2: Read Patient Record
    console.log('\n📖 Example 2: Reading Patient Record\n');
    const readResult = await manager.readPatient(createResult.patient.id, 'DR-12345', doctorAccess);

    if (readResult.success && readResult.patient) {
      console.log('✅ Patient record retrieved successfully');
      console.log(`   Insurance: ${readResult.patient.insurance?.[0]?.provider}`);
    }

    // Example 3: Update Patient Record
    console.log('\n✏️  Example 3: Updating Patient Record\n');
    const updateResult = await manager.updatePatient(
      createResult.patient.id,
      {
        contact: {
          ...createResult.patient.contact,
          phone: '+15551234999',
        },
      },
      'DR-12345',
      doctorAccess
    );

    if (updateResult.success) {
      console.log('   Phone number updated');
      console.log(`   New Version: ${updateResult.patient?.metadata.version}`);
    }

    // Example 4: Export Patient Data
    console.log('\n📤 Example 4: Exporting Patient Data\n');
    const exportResult = await manager.exportPatientData(
      createResult.patient.id,
      'DR-12345',
      doctorAccess,
      'json'
    );

    if (exportResult.success) {
      console.log('   Export format: JSON');
      console.log('   Data ready for download');
    }

    // Example 5: View Audit Trail
    console.log('\n📊 Example 5: Audit Trail\n');
    const auditTrail = manager.getAuditTrail(createResult.patient.id);
    console.log(`   Total operations: ${auditTrail.length}`);
    auditTrail.forEach((log) => {
      console.log(`   - ${log.action.toUpperCase()} by ${log.userId} at ${log.timestamp.toISOString()}`);
    });

    // Example 6: Permission Denied Scenario
    console.log('\n🚫 Example 6: Testing Access Control\n');
    const limitedAccess: AccessControl = {
      userId: 'BILLING-001',
      role: 'billing',
      permissions: ['read'], // No delete permission
      facilities: ['FACILITY-001'],
    };

    const deleteResult = await manager.deletePatient(
      createResult.patient.id,
      'BILLING-001',
      limitedAccess
    );

    if (!deleteResult.success) {
      console.log(`   ⚠️  Access denied: ${deleteResult.error}`);
      console.log('   Security working as expected!');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Example completed! All operations logged for HIPAA compliance.');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
