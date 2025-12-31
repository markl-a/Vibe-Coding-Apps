/**
 * Appointment Scheduling Example
 *
 * Demonstrates comprehensive appointment management with:
 * - Availability checking and conflict resolution
 * - Multi-provider scheduling
 * - Waitlist management
 * - Reminder notifications
 * - Cancellation and rescheduling policies
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  facilityId: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  reason: string;
  notes?: string;
  priority: 'routine' | 'urgent' | 'emergency';
  telehealth: boolean;
  metadata: AppointmentMetadata;
}

type AppointmentType =
  | 'initial_consultation'
  | 'follow_up'
  | 'annual_physical'
  | 'lab_work'
  | 'imaging'
  | 'procedure'
  | 'vaccination'
  | 'therapy'
  | 'emergency';

type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

interface AppointmentMetadata {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  confirmationSent?: Date;
  reminderSent?: Date;
  cancellationReason?: string;
  rescheduledFrom?: string;
}

interface Provider {
  id: string;
  name: string;
  specialty: string;
  facilityIds: string[];
  workingHours: WorkingHours[];
  appointmentDuration: Record<AppointmentType, number>; // minutes
}

interface WorkingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  start: string; // HH:mm format
  end: string;
  facilityId: string;
}

interface Facility {
  id: string;
  name: string;
  address: string;
  timezone: string;
  operatingHours: {
    start: string;
    end: string;
  };
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  providerId: string;
  facilityId: string;
}

interface WaitlistEntry {
  id: string;
  patientId: string;
  providerId: string;
  preferredDates: Date[];
  appointmentType: AppointmentType;
  priority: 'routine' | 'urgent' | 'emergency';
  createdAt: Date;
  notified: boolean;
}

interface Reminder {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  scheduledFor: Date;
  sent: boolean;
  content: string;
}

interface CancellationPolicy {
  minimumNoticeHours: number;
  feeAmount?: number;
  allowedCancellations: number;
  periodDays: number;
}

// ============================================================================
// Appointment Scheduler
// ============================================================================

class AppointmentScheduler {
  private appointments: Map<string, Appointment> = new Map();
  private waitlist: WaitlistEntry[] = [];
  private reminders: Reminder[] = [];
  private cancellationPolicy: CancellationPolicy = {
    minimumNoticeHours: 24,
    feeAmount: 50,
    allowedCancellations: 2,
    periodDays: 90,
  };

  /**
   * Find available time slots for a provider
   */
  async findAvailableSlots(
    providerId: string,
    facilityId: string,
    appointmentType: AppointmentType,
    startDate: Date,
    endDate: Date,
    provider: Provider
  ): Promise<TimeSlot[]> {
    console.log('\n🔍 Searching for available slots...');
    console.log(`   Provider: ${provider.name}`);
    console.log(`   Date range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

    const slots: TimeSlot[] = [];
    const duration = provider.appointmentDuration[appointmentType];

    // Get provider's working hours
    const workingHours = provider.workingHours.filter(
      (wh) => wh.facilityId === facilityId
    );

    // Generate potential slots
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const dayHours = workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

      if (dayHours) {
        const [startHour, startMin] = dayHours.start.split(':').map(Number);
        const [endHour, endMin] = dayHours.end.split(':').map(Number);

        let slotStart = new Date(currentDate);
        slotStart.setHours(startHour, startMin, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(endHour, endMin, 0, 0);

        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);

          if (slotEnd <= dayEnd) {
            const isAvailable = this.isSlotAvailable(providerId, slotStart, slotEnd);

            slots.push({
              start: new Date(slotStart),
              end: new Date(slotEnd),
              available: isAvailable,
              providerId,
              facilityId,
            });
          }

          slotStart = slotEnd;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const availableCount = slots.filter((s) => s.available).length;
    console.log(`   Found ${availableCount} available slots out of ${slots.length} total`);

    return slots.filter((s) => s.available);
  }

  /**
   * Schedule a new appointment
   */
  async scheduleAppointment(
    patientId: string,
    providerId: string,
    facilityId: string,
    appointmentType: AppointmentType,
    scheduledStart: Date,
    duration: number,
    reason: string,
    userId: string,
    options?: {
      priority?: 'routine' | 'urgent' | 'emergency';
      telehealth?: boolean;
      notes?: string;
    }
  ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    try {
      const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60000);

      // Check slot availability
      if (!this.isSlotAvailable(providerId, scheduledStart, scheduledEnd)) {
        return {
          success: false,
          error: 'Time slot is not available. Please choose a different time.',
        };
      }

      // Create appointment
      const appointment: Appointment = {
        id: this.generateId(),
        patientId,
        providerId,
        facilityId,
        appointmentType,
        status: 'scheduled',
        scheduledStart,
        scheduledEnd,
        reason,
        notes: options?.notes,
        priority: options?.priority || 'routine',
        telehealth: options?.telehealth || false,
        metadata: {
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      };

      this.appointments.set(appointment.id, appointment);

      // Schedule confirmation and reminders
      await this.scheduleReminders(appointment);

      console.log('\n✅ Appointment scheduled successfully');
      console.log(`   ID: ${appointment.id}`);
      console.log(`   Date: ${scheduledStart.toLocaleString()}`);
      console.log(`   Type: ${appointmentType}`);
      console.log(`   Duration: ${duration} minutes`);

      return { success: true, appointment };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(
    appointmentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const appointment = this.appointments.get(appointmentId);

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    if (appointment.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot confirm appointment with status: ${appointment.status}`,
      };
    }

    appointment.status = 'confirmed';
    appointment.metadata.confirmationSent = new Date();
    appointment.metadata.updatedAt = new Date();
    appointment.metadata.updatedBy = userId;

    console.log(`✅ Appointment ${appointmentId} confirmed`);

    return { success: true };
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newStart: Date,
    duration: number,
    userId: string
  ): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    const appointment = this.appointments.get(appointmentId);

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    // Check cancellation policy
    const hoursUntilAppointment =
      (appointment.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < this.cancellationPolicy.minimumNoticeHours) {
      return {
        success: false,
        error: `Rescheduling requires ${this.cancellationPolicy.minimumNoticeHours} hours notice`,
      };
    }

    const newEnd = new Date(newStart.getTime() + duration * 60000);

    // Check new slot availability
    if (!this.isSlotAvailable(appointment.providerId, newStart, newEnd, appointmentId)) {
      return { success: false, error: 'New time slot is not available' };
    }

    // Update appointment
    const originalAppointmentId = appointment.id;
    appointment.scheduledStart = newStart;
    appointment.scheduledEnd = newEnd;
    appointment.status = 'rescheduled';
    appointment.metadata.rescheduledFrom = originalAppointmentId;
    appointment.metadata.updatedAt = new Date();
    appointment.metadata.updatedBy = userId;

    // Reschedule reminders
    await this.scheduleReminders(appointment);

    console.log('\n✅ Appointment rescheduled successfully');
    console.log(`   Original: ${new Date(originalAppointmentId).toLocaleString()}`);
    console.log(`   New time: ${newStart.toLocaleString()}`);

    return { success: true, appointment };
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    userId: string
  ): Promise<{ success: boolean; fee?: number; error?: string }> {
    const appointment = this.appointments.get(appointmentId);

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    // Check cancellation policy
    const hoursUntilAppointment =
      (appointment.scheduledStart.getTime() - Date.now()) / (1000 * 60 * 60);

    let fee = 0;
    if (hoursUntilAppointment < this.cancellationPolicy.minimumNoticeHours) {
      fee = this.cancellationPolicy.feeAmount || 0;
    }

    appointment.status = 'cancelled';
    appointment.metadata.cancellationReason = reason;
    appointment.metadata.updatedAt = new Date();
    appointment.metadata.updatedBy = userId;

    console.log('\n❌ Appointment cancelled');
    console.log(`   Reason: ${reason}`);
    if (fee > 0) {
      console.log(`   ⚠️  Late cancellation fee: $${fee}`);
    }

    // Check waitlist for this slot
    await this.processWaitlist(appointment);

    return { success: true, fee };
  }

  /**
   * Add patient to waitlist
   */
  addToWaitlist(
    patientId: string,
    providerId: string,
    preferredDates: Date[],
    appointmentType: AppointmentType,
    priority: 'routine' | 'urgent' | 'emergency' = 'routine'
  ): WaitlistEntry {
    const entry: WaitlistEntry = {
      id: this.generateId(),
      patientId,
      providerId,
      preferredDates,
      appointmentType,
      priority,
      createdAt: new Date(),
      notified: false,
    };

    this.waitlist.push(entry);

    console.log('\n📋 Added to waitlist');
    console.log(`   Entry ID: ${entry.id}`);
    console.log(`   Priority: ${priority}`);

    return entry;
  }

  /**
   * Check in patient for appointment
   */
  async checkIn(
    appointmentId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const appointment = this.appointments.get(appointmentId);

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    if (appointment.status !== 'confirmed' && appointment.status !== 'scheduled') {
      return {
        success: false,
        error: `Cannot check in for appointment with status: ${appointment.status}`,
      };
    }

    appointment.status = 'checked_in';
    appointment.actualStart = new Date();
    appointment.metadata.updatedAt = new Date();
    appointment.metadata.updatedBy = userId;

    console.log(`✅ Patient checked in for appointment ${appointmentId}`);

    return { success: true };
  }

  /**
   * Complete appointment
   */
  async completeAppointment(
    appointmentId: string,
    userId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const appointment = this.appointments.get(appointmentId);

    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    appointment.status = 'completed';
    appointment.actualEnd = new Date();
    if (notes) {
      appointment.notes = (appointment.notes || '') + '\n' + notes;
    }
    appointment.metadata.updatedAt = new Date();
    appointment.metadata.updatedBy = userId;

    const duration = appointment.actualEnd.getTime() - (appointment.actualStart?.getTime() || 0);
    const durationMinutes = Math.round(duration / 60000);

    console.log('\n✅ Appointment completed');
    console.log(`   Actual duration: ${durationMinutes} minutes`);

    return { success: true };
  }

  /**
   * Get appointments for a provider on a specific date
   */
  getProviderSchedule(providerId: string, date: Date): Appointment[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.appointments.values()).filter(
      (apt) =>
        apt.providerId === providerId &&
        apt.scheduledStart >= startOfDay &&
        apt.scheduledStart <= endOfDay &&
        apt.status !== 'cancelled'
    );
  }

  /**
   * Get appointments for a patient
   */
  getPatientAppointments(patientId: string): Appointment[] {
    return Array.from(this.appointments.values())
      .filter((apt) => apt.patientId === patientId)
      .sort((a, b) => b.scheduledStart.getTime() - a.scheduledStart.getTime());
  }

  /**
   * Get upcoming appointments
   */
  getUpcomingAppointments(patientId: string): Appointment[] {
    const now = new Date();
    return this.getPatientAppointments(patientId).filter(
      (apt) => apt.scheduledStart > now && apt.status !== 'cancelled'
    );
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private isSlotAvailable(
    providerId: string,
    start: Date,
    end: Date,
    excludeAppointmentId?: string
  ): boolean {
    for (const [id, apt] of this.appointments) {
      if (
        apt.providerId === providerId &&
        apt.status !== 'cancelled' &&
        id !== excludeAppointmentId
      ) {
        // Check for overlap
        if (
          (start >= apt.scheduledStart && start < apt.scheduledEnd) ||
          (end > apt.scheduledStart && end <= apt.scheduledEnd) ||
          (start <= apt.scheduledStart && end >= apt.scheduledEnd)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private async scheduleReminders(appointment: Appointment): Promise<void> {
    // Schedule confirmation (immediate)
    this.reminders.push({
      id: this.generateId(),
      appointmentId: appointment.id,
      type: 'email',
      scheduledFor: new Date(),
      sent: false,
      content: 'Your appointment has been scheduled',
    });

    // Schedule 24-hour reminder
    const reminderTime = new Date(appointment.scheduledStart.getTime() - 24 * 60 * 60 * 1000);
    if (reminderTime > new Date()) {
      this.reminders.push({
        id: this.generateId(),
        appointmentId: appointment.id,
        type: 'sms',
        scheduledFor: reminderTime,
        sent: false,
        content: 'Reminder: You have an appointment tomorrow',
      });
    }

    console.log('   📧 Confirmation and reminders scheduled');
  }

  private async processWaitlist(cancelledAppointment: Appointment): Promise<void> {
    const matchingEntries = this.waitlist
      .filter(
        (entry) =>
          entry.providerId === cancelledAppointment.providerId &&
          entry.appointmentType === cancelledAppointment.appointmentType &&
          !entry.notified
      )
      .sort((a, b) => {
        // Sort by priority first, then by creation time
        const priorityOrder = { emergency: 0, urgent: 1, routine: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (matchingEntries.length > 0) {
      const firstEntry = matchingEntries[0];
      firstEntry.notified = true;

      console.log('\n📞 Notifying waitlist patient');
      console.log(`   Waitlist ID: ${firstEntry.id}`);
      console.log(
        `   Available slot: ${cancelledAppointment.scheduledStart.toLocaleString()}`
      );
    }
  }

  private generateId(): string {
    return `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Appointment Scheduling System - Comprehensive Example');
  console.log('='.repeat(70));

  const scheduler = new AppointmentScheduler();

  // Set up provider
  const provider: Provider = {
    id: 'PROV-001',
    name: 'Dr. Sarah Johnson',
    specialty: 'Primary Care',
    facilityIds: ['FAC-001'],
    appointmentDuration: {
      initial_consultation: 60,
      follow_up: 30,
      annual_physical: 45,
      lab_work: 15,
      imaging: 30,
      procedure: 90,
      vaccination: 15,
      therapy: 60,
      emergency: 30,
    },
  };

  provider.workingHours = [
    // Monday-Friday
    { dayOfWeek: 1, start: '09:00', end: '17:00', facilityId: 'FAC-001' },
    { dayOfWeek: 2, start: '09:00', end: '17:00', facilityId: 'FAC-001' },
    { dayOfWeek: 3, start: '09:00', end: '17:00', facilityId: 'FAC-001' },
    { dayOfWeek: 4, start: '09:00', end: '17:00', facilityId: 'FAC-001' },
    { dayOfWeek: 5, start: '09:00', end: '17:00', facilityId: 'FAC-001' },
  ];

  // Example 1: Find Available Slots
  console.log('\n📅 Example 1: Finding Available Slots');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Tomorrow
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7); // Next week

  const availableSlots = await scheduler.findAvailableSlots(
    provider.id,
    'FAC-001',
    'follow_up',
    startDate,
    endDate,
    provider
  );

  if (availableSlots.length > 0) {
    console.log('\n   First 5 available slots:');
    availableSlots.slice(0, 5).forEach((slot, index) => {
      console.log(`   ${index + 1}. ${slot.start.toLocaleString()}`);
    });
  }

  // Example 2: Schedule Appointment
  console.log('\n\n📝 Example 2: Scheduling Appointment');

  const appointmentTime = availableSlots[0].start;
  const scheduleResult = await scheduler.scheduleAppointment(
    'PATIENT-001',
    provider.id,
    'FAC-001',
    'follow_up',
    appointmentTime,
    30,
    'Follow-up for blood pressure management',
    'STAFF-001',
    {
      priority: 'routine',
      telehealth: false,
      notes: 'Patient requested morning appointment',
    }
  );

  // Example 3: Confirm Appointment
  if (scheduleResult.success && scheduleResult.appointment) {
    console.log('\n\n✓ Example 3: Confirming Appointment');
    await scheduler.confirmAppointment(scheduleResult.appointment.id, 'PATIENT-001');

    // Example 4: Check In
    console.log('\n\n👋 Example 4: Patient Check-In');
    await scheduler.checkIn(scheduleResult.appointment.id, 'STAFF-001');

    // Example 5: Complete Appointment
    console.log('\n\n🏁 Example 5: Completing Appointment');
    await scheduler.completeAppointment(
      scheduleResult.appointment.id,
      provider.id,
      'Patient responded well to treatment. Continue current medication regimen.'
    );
  }

  // Example 6: Schedule Multiple Appointments
  console.log('\n\n📊 Example 6: Scheduling Multiple Appointments');

  for (let i = 1; i <= 3; i++) {
    const slotTime = availableSlots[i * 5].start;
    await scheduler.scheduleAppointment(
      `PATIENT-00${i}`,
      provider.id,
      'FAC-001',
      'follow_up',
      slotTime,
      30,
      `Appointment for patient ${i}`,
      'STAFF-001'
    );
  }

  // Example 7: View Provider Schedule
  console.log('\n\n📋 Example 7: Provider Schedule for Today');

  const schedule = scheduler.getProviderSchedule(provider.id, appointmentTime);
  console.log(`\n   Dr. ${provider.name} - ${appointmentTime.toLocaleDateString()}`);
  console.log(`   Total appointments: ${schedule.length}\n`);

  schedule.forEach((apt, index) => {
    console.log(`   ${index + 1}. ${apt.scheduledStart.toLocaleTimeString()} - ${apt.status}`);
    console.log(`      Patient: ${apt.patientId}`);
    console.log(`      Type: ${apt.appointmentType}`);
  });

  // Example 8: Reschedule Appointment
  if (availableSlots[10]) {
    console.log('\n\n🔄 Example 8: Rescheduling Appointment');

    const newTime = availableSlots[10].start;
    const rescheduleResult = await scheduler.rescheduleAppointment(
      scheduleResult.appointment!.id,
      newTime,
      30,
      'PATIENT-001'
    );

    if (!rescheduleResult.success) {
      console.log(`   Note: ${rescheduleResult.error}`);
    }
  }

  // Example 9: Waitlist Management
  console.log('\n\n⏳ Example 9: Adding to Waitlist');

  const preferredDates = [
    new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
    new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
  ];

  scheduler.addToWaitlist(
    'PATIENT-999',
    provider.id,
    preferredDates,
    'initial_consultation',
    'urgent'
  );

  // Example 10: Cancel Appointment (triggers waitlist processing)
  if (scheduleResult.success && scheduleResult.appointment) {
    console.log('\n\n❌ Example 10: Cancelling Appointment');

    const cancelResult = await scheduler.cancelAppointment(
      scheduleResult.appointment.id,
      'Patient illness',
      'PATIENT-001'
    );

    if (cancelResult.success && cancelResult.fee) {
      console.log(`   Cancellation processed`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('Appointment scheduling examples completed!');
  console.log('='.repeat(70));
}

// Run the example
main().catch(console.error);
