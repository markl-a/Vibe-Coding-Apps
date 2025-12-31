/**
 * Student Enrollment Example for LMS Platforms
 *
 * Demonstrates student enrollment workflows, waitlists, prerequisites checking,
 * and enrollment management in an LMS.
 */

// Types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  profile: StudentProfile;
}

interface StudentProfile {
  avatar?: string;
  bio?: string;
  interests: string[];
  educationLevel: 'high-school' | 'undergraduate' | 'graduate' | 'professional';
  timezone: string;
  preferredLanguage: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'pending' | 'active' | 'completed' | 'dropped' | 'failed';
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  currentProgress: number; // 0-100
  grade?: number;
  certificateIssued: boolean;
  paymentStatus: 'pending' | 'paid' | 'waived' | 'refunded';
}

interface EnrollmentRequest {
  studentId: string;
  courseId: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  notes?: string;
}

interface PaymentMethod {
  type: 'credit_card' | 'paypal' | 'bank_transfer' | 'scholarship';
  details?: Record<string, unknown>;
}

interface Waitlist {
  courseId: string;
  entries: WaitlistEntry[];
  maxSize: number;
}

interface WaitlistEntry {
  id: string;
  studentId: string;
  addedAt: Date;
  priority: number;
  notified: boolean;
}

interface PrerequisiteCheck {
  required: string[];
  completed: string[];
  missing: string[];
  satisfied: boolean;
}

interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  completionRate: number;
}

// Enrollment Service
class EnrollmentService {
  private students: Map<string, Student> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private waitlists: Map<string, Waitlist> = new Map();
  private coursePrerequisites: Map<string, string[]> = new Map();
  private courseCapacity: Map<string, number> = new Map();

  /**
   * Register a new student
   */
  registerStudent(data: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    profile: StudentProfile;
  }): Student {
    // Check if email already exists
    const existingStudent = Array.from(this.students.values()).find(
      s => s.email === data.email
    );

    if (existingStudent) {
      throw new Error(`Student with email ${data.email} already exists`);
    }

    const student: Student = {
      id: this.generateId(),
      ...data,
      enrollmentDate: new Date(),
      status: 'active',
    };

    this.students.set(student.id, student);
    console.log(`✅ Student registered: ${student.firstName} ${student.lastName}`);
    return student;
  }

  /**
   * Enroll a student in a course
   */
  async enrollStudent(request: EnrollmentRequest): Promise<Enrollment> {
    const student = this.getStudent(request.studentId);

    // Check if student is active
    if (student.status !== 'active') {
      throw new Error(`Student account is ${student.status}`);
    }

    // Check prerequisites
    const prereqCheck = this.checkPrerequisites(
      request.studentId,
      request.courseId
    );

    if (!prereqCheck.satisfied) {
      throw new Error(
        `Prerequisites not met. Missing: ${prereqCheck.missing.join(', ')}`
      );
    }

    // Check if already enrolled
    const existingEnrollment = this.findEnrollment(
      request.studentId,
      request.courseId
    );

    if (existingEnrollment && existingEnrollment.status === 'active') {
      throw new Error('Student is already enrolled in this course');
    }

    // Check course capacity
    const capacity = this.courseCapacity.get(request.courseId);
    if (capacity !== undefined) {
      const currentEnrollments = this.getCourseEnrollments(request.courseId)
        .filter(e => e.status === 'active').length;

      if (currentEnrollments >= capacity) {
        // Add to waitlist
        return this.addToWaitlist(request.studentId, request.courseId);
      }
    }

    // Process payment
    await this.processPayment(request);

    // Create enrollment
    const enrollment: Enrollment = {
      id: this.generateId(),
      studentId: request.studentId,
      courseId: request.courseId,
      status: 'active',
      enrolledAt: new Date(),
      startedAt: new Date(),
      currentProgress: 0,
      certificateIssued: false,
      paymentStatus: 'paid',
    };

    this.enrollments.set(enrollment.id, enrollment);
    console.log(`✅ Student enrolled in course: ${request.courseId}`);

    // Send welcome email
    this.sendEnrollmentConfirmation(student, enrollment);

    return enrollment;
  }

  /**
   * Add student to waitlist
   */
  private addToWaitlist(studentId: string, courseId: string): never {
    let waitlist = this.waitlists.get(courseId);

    if (!waitlist) {
      waitlist = {
        courseId,
        entries: [],
        maxSize: 50,
      };
      this.waitlists.set(courseId, waitlist);
    }

    const entry: WaitlistEntry = {
      id: this.generateId(),
      studentId,
      addedAt: new Date(),
      priority: waitlist.entries.length + 1,
      notified: false,
    };

    waitlist.entries.push(entry);
    console.log(`⏳ Student added to waitlist for course: ${courseId}`);

    throw new Error('Course is full. Student added to waitlist.');
  }

  /**
   * Process next waitlist entry
   */
  processWaitlist(courseId: string): void {
    const waitlist = this.waitlists.get(courseId);
    if (!waitlist || waitlist.entries.length === 0) {
      return;
    }

    const nextEntry = waitlist.entries
      .filter(e => !e.notified)
      .sort((a, b) => a.priority - b.priority)[0];

    if (nextEntry) {
      nextEntry.notified = true;
      console.log(`📧 Notified student ${nextEntry.studentId} about opening`);
    }
  }

  /**
   * Check prerequisites
   */
  checkPrerequisites(studentId: string, courseId: string): PrerequisiteCheck {
    const required = this.coursePrerequisites.get(courseId) || [];

    const completedEnrollments = Array.from(this.enrollments.values())
      .filter(
        e =>
          e.studentId === studentId &&
          e.status === 'completed' &&
          e.grade !== undefined &&
          e.grade >= 70
      )
      .map(e => e.courseId);

    const completed = required.filter(prereq =>
      completedEnrollments.includes(prereq)
    );

    const missing = required.filter(prereq => !completed.includes(prereq));

    return {
      required,
      completed,
      missing,
      satisfied: missing.length === 0,
    };
  }

  /**
   * Drop a course
   */
  dropCourse(
    studentId: string,
    courseId: string,
    reason?: string
  ): Enrollment {
    const enrollment = this.findEnrollment(studentId, courseId);

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'active') {
      throw new Error(`Cannot drop course with status: ${enrollment.status}`);
    }

    enrollment.status = 'dropped';

    console.log(`✅ Student dropped course: ${courseId}`);
    if (reason) {
      console.log(`   Reason: ${reason}`);
    }

    // Process refund if applicable
    if (enrollment.paymentStatus === 'paid') {
      const daysSinceEnrollment = Math.floor(
        (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceEnrollment <= 14) {
        enrollment.paymentStatus = 'refunded';
        console.log('   💰 Refund processed (within 14-day window)');
      }
    }

    // Process waitlist
    this.processWaitlist(courseId);

    return enrollment;
  }

  /**
   * Transfer student to another course
   */
  transferCourse(
    studentId: string,
    fromCourseId: string,
    toCourseId: string
  ): Enrollment {
    // Drop from current course
    this.dropCourse(studentId, fromCourseId, 'Transfer to another course');

    // Enroll in new course
    return this.enrollStudent({
      studentId,
      courseId: toCourseId,
    }) as any;
  }

  /**
   * Bulk enrollment
   */
  async bulkEnroll(
    studentIds: string[],
    courseId: string
  ): Promise<{
    successful: Enrollment[];
    failed: Array<{ studentId: string; error: string }>;
  }> {
    const successful: Enrollment[] = [];
    const failed: Array<{ studentId: string; error: string }> = [];

    for (const studentId of studentIds) {
      try {
        const enrollment = await this.enrollStudent({
          studentId,
          courseId,
        });
        successful.push(enrollment);
      } catch (error) {
        failed.push({
          studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Bulk enrollment complete: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed };
  }

  /**
   * Get student enrollments
   */
  getStudentEnrollments(studentId: string): Enrollment[] {
    return Array.from(this.enrollments.values()).filter(
      e => e.studentId === studentId
    );
  }

  /**
   * Get course enrollments
   */
  getCourseEnrollments(courseId: string): Enrollment[] {
    return Array.from(this.enrollments.values()).filter(
      e => e.courseId === courseId
    );
  }

  /**
   * Get enrollment statistics
   */
  getEnrollmentStats(courseId: string): EnrollmentStats {
    const enrollments = this.getCourseEnrollments(courseId);

    const activeEnrollments = enrollments.filter(
      e => e.status === 'active'
    ).length;

    const completedEnrollments = enrollments.filter(
      e => e.status === 'completed'
    ).length;

    const totalProgress = enrollments.reduce(
      (sum, e) => sum + e.currentProgress,
      0
    );

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments,
      completedEnrollments,
      averageProgress: totalProgress / enrollments.length || 0,
      completionRate: (completedEnrollments / enrollments.length) * 100 || 0,
    };
  }

  /**
   * Set course capacity
   */
  setCourseCapacity(courseId: string, capacity: number): void {
    this.courseCapacity.set(courseId, capacity);
    console.log(`✅ Course capacity set: ${capacity}`);
  }

  /**
   * Set course prerequisites
   */
  setCoursePrerequisites(courseId: string, prerequisites: string[]): void {
    this.coursePrerequisites.set(courseId, prerequisites);
    console.log(`✅ Prerequisites set for course: ${courseId}`);
  }

  private getStudent(studentId: string): Student {
    const student = this.students.get(studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }
    return student;
  }

  private findEnrollment(studentId: string, courseId: string): Enrollment | undefined {
    return Array.from(this.enrollments.values()).find(
      e => e.studentId === studentId && e.courseId === courseId
    );
  }

  private async processPayment(request: EnrollmentRequest): Promise<void> {
    // Simulate payment processing
    console.log(`💳 Processing payment...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`✅ Payment successful`);
  }

  private sendEnrollmentConfirmation(student: Student, enrollment: Enrollment): void {
    console.log(`📧 Sending enrollment confirmation to ${student.email}`);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateEnrollment() {
  console.log('=== Student Enrollment Example ===\n');

  const service = new EnrollmentService();

  // Register students
  const student1 = service.registerStudent({
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@email.com',
    dateOfBirth: new Date('2000-05-15'),
    profile: {
      interests: ['Web Development', 'UI/UX Design'],
      educationLevel: 'undergraduate',
      timezone: 'America/New_York',
      preferredLanguage: 'English',
    },
  });

  const student2 = service.registerStudent({
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob.smith@email.com',
    dateOfBirth: new Date('1998-09-20'),
    profile: {
      interests: ['Data Science', 'Machine Learning'],
      educationLevel: 'graduate',
      timezone: 'America/Los_Angeles',
      preferredLanguage: 'English',
    },
  });

  const student3 = service.registerStudent({
    firstName: 'Carol',
    lastName: 'Davis',
    email: 'carol.davis@email.com',
    dateOfBirth: new Date('2001-03-10'),
    profile: {
      interests: ['Mobile Development', 'iOS'],
      educationLevel: 'undergraduate',
      timezone: 'Europe/London',
      preferredLanguage: 'English',
    },
  });

  // Set up courses
  const introWebDevId = 'course-intro-webdev';
  const advWebDevId = 'course-adv-webdev';
  const reactId = 'course-react';

  // Set course capacity
  service.setCourseCapacity(introWebDevId, 2); // Small capacity for demo

  // Set prerequisites
  service.setCoursePrerequisites(advWebDevId, [introWebDevId]);
  service.setCoursePrerequisites(reactId, [introWebDevId]);

  // Enroll students
  console.log('\n📝 Enrolling students...\n');

  await service.enrollStudent({
    studentId: student1.id,
    courseId: introWebDevId,
  });

  await service.enrollStudent({
    studentId: student2.id,
    courseId: introWebDevId,
  });

  // This should go to waitlist (capacity exceeded)
  try {
    await service.enrollStudent({
      studentId: student3.id,
      courseId: introWebDevId,
    });
  } catch (error) {
    console.log(`❌ ${error instanceof Error ? error.message : error}`);
  }

  // Try to enroll in advanced course without prerequisites
  console.log('\n📝 Attempting enrollment without prerequisites...\n');
  try {
    await service.enrollStudent({
      studentId: student1.id,
      courseId: advWebDevId,
    });
  } catch (error) {
    console.log(`❌ ${error instanceof Error ? error.message : error}`);
  }

  // Check enrollment statistics
  console.log('\n📊 Enrollment Statistics:');
  const stats = service.getEnrollmentStats(introWebDevId);
  console.log(`   Total Enrollments: ${stats.totalEnrollments}`);
  console.log(`   Active Enrollments: ${stats.activeEnrollments}`);
  console.log(`   Completion Rate: ${stats.completionRate.toFixed(2)}%`);

  // Drop a course
  console.log('\n📝 Dropping course...\n');
  service.dropCourse(student2.id, introWebDevId, 'Schedule conflict');

  // Bulk enrollment
  console.log('\n📝 Bulk enrollment...\n');
  const bulkResult = await service.bulkEnroll(
    [student1.id, student2.id, student3.id],
    reactId
  );
  console.log(`   Successful: ${bulkResult.successful.length}`);
  console.log(`   Failed: ${bulkResult.failed.length}`);

  console.log('\n✅ Enrollment demonstration complete!');
}

// Run the example
demonstrateEnrollment().catch(console.error);
